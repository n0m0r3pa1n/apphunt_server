'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.get = get;
exports.find = find;
exports.create = create;
exports.update = update;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _authentication_handlerJs = require('./authentication_handler.js');

var AuthHandler = _interopRequireWildcard(_authentication_handlerJs);

var _ = require('underscore');
var Boom = require('boom');
var Bolt = require('bolt-js');
var TweetComposer = require('../utils/tweet_composer');
var CONFIG = require('../config/config');

var User = require('../models').User;
var Device = require('../models').Device;
var UserScoreHandler = require('./user_score_handler');

function* get(email, loginType) {
    var where = {};
    if (loginType !== undefined) {
        where.loginType = loginType;
    }

    if (email !== undefined) {
        where.email = email;
    }

    return yield User.find(where).exec();
}

function* find(userId) {
    return yield User.findById(userId).exec();
}

function* create(user, notificationId) {
    var currUser = yield User.findOne({ email: user.email }).populate('devices').exec();
    if (!currUser) {
        currUser = yield User.create(user);
        postTweet(currUser);
        followUser(currUser);
    }

    if (notificationId) {
        if (currUser.devices == undefined || currUser.devices == null) {
            currUser.devices = [];
        }

        if (isUserDeviceExisting(currUser.devices, notificationId) == false) {
            var device = yield Device.findOneOrCreate({ notificationId: notificationId }, { notificationId: notificationId, notificationsEnabled: true });
            currUser.devices.push(device);
        }
        yield currUser.save();
    }

    var myUser = currUser.toObject();
    myUser.token = AuthHandler.generateToken(currUser._id);
    myUser.id = myUser._id;
    return myUser;
}

function postTweet(user) {
    var bolt = new Bolt(CONFIG.BOLT_APP_ID);
    var tweetComposer = new TweetComposer(CONFIG.APP_HUNT_TWITTER_HANDLE);
    var tweetOptions = {
        username: user.username,
        hashTags: ['app']
    };

    bolt.postTweet(tweetComposer.composeWelcomeTweet(tweetOptions));
}

function followUser(user) {
    var bolt = new Bolt(CONFIG.BOLT_APP_ID);
    bolt.followUsers([user.username]);
}

function* update(userId, notificationId) {
    var user = yield User.findById(userId).populate('devices').exec();
    if (user == null) {
        return Boom.notFound('User not found!');
    }

    if (isUserDeviceExisting(user.devices, notificationId) == false) {
        var device = yield Device.findOneOrCreate({ notificationId: notificationId }, { notificationId: notificationId, notificationsEnabled: true });
        user.devices.push(device);
    } else {
        return Boom.conflict('Existing user device!');
    }
    user.loginType = user.loginType.toLowerCase();
    user.save(function (err) {
        if (err) {
            console.log(err);
        }
    });
    return Boom.OK();
}

function isUserDeviceExisting(devices, notificationId) {
    var isDeviceIdExisting = false;
    for (var i = 0; i < devices.length; i++) {
        var currentDevice = devices[i];
        if (currentDevice.notificationId == notificationId) {
            isDeviceIdExisting = true;
            break;
        }
    }

    return isDeviceIdExisting;
}