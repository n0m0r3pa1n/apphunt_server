var _ = require('underscore')

var Bolt = require("bolt-js")
var TweetComposer = require('../utils/tweet_composer')
var CONFIG = require('../config/config')

var User = require('../models').User
var Device = require('../models').Device
var STATUS_CODES = require('../config/config').STATUS_CODES
var UserScoreUtils = require('../utils/user_score_utils')


function* get(email, loginType) {
    var where = {}
    if(loginType !== undefined){
        where.loginType = loginType
    }

    if(email !== undefined) {
        where.email = email;
    }

    return yield User.find(where).exec();
}

function* create(user, notificationId) {
    var currUser = yield User.findOne({email: user.email}).populate('devices').exec();
    if (!currUser) {
        currUser = yield User.create(user)
        postTweet(currUser)
        followUser(currUser)
    }

	if(notificationId) {
		if (currUser.devices == undefined || currUser.devices == null) {
            currUser.devices = []
		}

		if(isUserDeviceExisting(currUser.devices, notificationId) == false) {
            var device = yield Device.findOneOrCreate({notificationId: notificationId}, {notificationId: notificationId, notificationsEnabled: true});
            currUser.devices.push(device)
		}
        currUser.save()
	}

	return currUser;
}

function postTweet(user) {
    var bolt = new Bolt(CONFIG.BOLT_APP_ID)
    var tweetComposer = new TweetComposer(CONFIG.APP_HUNT_TWITTER_HANDLE)
    var tweetOptions = {
        username: user.username,
        hashTags: ["app"]
    }

    bolt.postTweet(tweetComposer.composeWelcomeTweet(tweetOptions))
}

function followUser(user) {
    var bolt = new Bolt(CONFIG.BOLT_APP_ID)
    bolt.followUsers([user.username])
}

function* update(userId, notificationId) {
    var user = yield User.findById(userId).populate('devices').exec();
    if(user == null) {
        return {statusCode: STATUS_CODES.NOT_FOUND}
    }

    if(isUserDeviceExisting(user.devices, notificationId) == false) {
        var device = yield Device.findOneOrCreate({notificationId: notificationId}, {notificationId: notificationId, notificationsEnabled: true})
        user.devices.push(device)
    } else {
        return { statusCode: STATUS_CODES.CONFLICT }
    }
    user.loginType = user.loginType.toLowerCase()
    user.save(function(err) {
        if(err) {
            console.log(err)
        }
    })
    return {statusCode: STATUS_CODES.OK}
}

function isUserDeviceExisting(devices, notificationId) {
    var isDeviceIdExisting = false;
    for(var i=0; i < devices.length; i++) {
        var currentDevice = devices[i]
        if(currentDevice.notificationId == notificationId) {
            isDeviceIdExisting = true;
            break;
        }
    }

    return isDeviceIdExisting;
}

function* getWithScores(fromDate, toDate, query, loginType) {
    var where = {};

    if(query !== undefined) {
        where.username = {$regex: query, $options: 'i'};
    }

    if(loginType !== undefined && loginType == 'real') {
        where.loginType = { "$ne": 'fake'}
    } else if(loginType !== undefined) {
        where.loginType = loginType
    }

    var result = []
    var users = yield User.find(where).exec()
    for(var i=0; i<users.length; i++) {
        var user = users[i].toObject()
        var userDetails = yield UserScoreUtils.getUserDetails(user._id, fromDate, toDate)
        user.score = userDetails.score
        result.push(user);
    }

    result.sort(function(user1, user2) {
        return user2.score - user1.score
    })

    return result

}

module.exports.create = create
module.exports.get = get
module.exports.update = update
module.exports.getWithScores = getWithScores
