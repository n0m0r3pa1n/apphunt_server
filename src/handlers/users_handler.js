var _ = require('underscore')
var Boom = require('boom')
var Bolt = require("bolt-js")
var TweetComposer = require('../utils/tweet_composer')
var CONFIG = require('../config/config')
var LOGIN_TYPES = CONFIG.LOGIN_TYPES

var User = require('../models').User
var Device = require('../models').Device
var UserScoreHandler = require('./user_score_handler')
var CommentsHandler = require('./comments_handler')
import * as AppsHandler from './apps_handler.js'
import * as AppsCollectionsHandler from './apps_collections_handler.js'

import * as AuthHandler from './authentication_handler.js'
import * as ScoresHandler from './user_score_handler.js'


export function* get(userId, email, loginType) {
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

export function* getUserDevices(userId) {
    let user = yield User.findById(userId).populate('devices').exec()
    if(user == null) {
        return []
    }

    return user.devices
}


export function* getDevicesForAllUsers() {
    return yield Device.find({}).exec()
}

export function* getUserProfile(userId, fromDate, toDate) {
    let user = yield find(userId)
    if(user == null) {
        return Boom.notFound("User is not existing!")
    }
    user = user.toObject()
    let details = yield ScoresHandler.getUserDetails(userId)
    user.apps = details.addedApps
    user.comments = details.comments
    user.votes = details.votes
    user.collections = details.collections
    user.favouriteApps = yield AppsHandler.getFavouriteAppsCount(userId)
    user.favouriteCollections = yield AppsCollectionsHandler.getCollectionsCount(userId)
    user.score = (yield ScoresHandler.getUserDetails(userId, fromDate, toDate)).score

    return user
}

export function* create(user, notificationId) {
    var currUser = yield User.findOne({email: user.email}).populate('devices').exec();
    if (!currUser) {
        currUser = yield User.create(user)
        if(currUser.loginType == LOGIN_TYPES.Twitter) {
            postTweet(currUser)
            followUser(currUser)
        }
    } else {
        currUser.name = user.name
        currUser.username = user.username
        currUser.profilePicture = user.profilePicture
        currUser.coverPicture = user.coverPicture
        currUser.loginType = user.loginType
        currUser.locale = user.locale
        currUser.appVersion = user.appVersion
    }

    if(notificationId) {
        if (currUser.devices == undefined || currUser.devices == null) {
            currUser.devices = []
        }

        if(isUserDeviceExisting(currUser.devices, notificationId) == false) {
            var device = yield Device.findOneOrCreate({notificationId: notificationId}, {notificationId: notificationId, notificationsEnabled: true});
            currUser.devices.push(device)
        }
    }
    yield currUser.save()

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