var _ = require('underscore')
var Boom = require('boom')
var Bolt = require("bolt-js")
var TweetComposer = require('../utils/tweet_composer')
var CONFIG = require('../config/config')

var User = require('../models').User
var Device = require('../models').Device
var UserScoreHandler = require('./user_score_handler')

import * as AuthHandler from './authentication_handler.js'


export function* get(email, loginType) {
    var where = {}
    if(loginType !== undefined){
        where.loginType = loginType
    }

    if(email !== undefined) {
        where.email = email;
    }

    return yield User.find(where).exec();
}

export function* find(userId) {
    return yield User.findById(userId).exec()
}

export function* create(user, notificationId) {
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
        yield currUser.save()
	}

    let myUser = currUser.toObject()
    myUser.token = AuthHandler.generateToken(currUser._id)
    myUser.id = myUser._id;
	return myUser;
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

export function* update(userId, notificationId) {
    var user = yield User.findById(userId).populate('devices').exec();
    if(user == null) {
        return Boom.notFound('User not found!')
    }

    if(isUserDeviceExisting(user.devices, notificationId) == false) {
        var device = yield Device.findOneOrCreate({notificationId: notificationId}, {notificationId: notificationId, notificationsEnabled: true})
        user.devices.push(device)
    } else {
        return Boom.conflict('Existing user device!')
    }
    user.loginType = user.loginType.toLowerCase()
    user.save(function(err) {
        if(err) {
            console.log(err)
        }
    })
    return Boom.OK()
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