'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.get = get;
exports.getLoginTypes = getLoginTypes;
exports.find = find;
exports.getUserDevices = getUserDevices;
exports.getDevicesForAllUsers = getDevicesForAllUsers;
exports.getUserProfile = getUserProfile;
exports.create = create;
exports.update = update;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _apps_handlerJs = require('./apps_handler.js');

var AppsHandler = _interopRequireWildcard(_apps_handlerJs);

var _apps_collections_handlerJs = require('./apps_collections_handler.js');

var AppsCollectionsHandler = _interopRequireWildcard(_apps_collections_handlerJs);

var _pagination_handlerJs = require('./pagination_handler.js');

var PaginationHandler = _interopRequireWildcard(_pagination_handlerJs);

var _authentication_handlerJs = require('./authentication_handler.js');

var AuthHandler = _interopRequireWildcard(_authentication_handlerJs);

var _user_score_handlerJs = require('./user_score_handler.js');

var ScoresHandler = _interopRequireWildcard(_user_score_handlerJs);

var _ = require('underscore');
var Boom = require('boom');
var Bolt = require('bolt-js');
var TweetComposer = require('../utils/tweet_composer');
var CONFIG = require('../config/config');
var LOGIN_TYPES_FILTER = CONFIG.LOGIN_TYPES_FILTER;

var User = require('../models').User;
var Device = require('../models').Device;
var UserScoreHandler = require('./user_score_handler');
var CommentsHandler = require('./comments_handler');

function* get(q, loginType, page, pageSize) {
    var where = {};
    if (q !== undefined) {
        where = { $or: [{ email: { $regex: q, $options: 'i' } }, { name: { $regex: q, $options: 'i' } }, { username: { $regex: q, $options: 'i' } }] };
    }

    if (loginType !== undefined) {
        if (loginType == LOGIN_TYPES_FILTER.Real) {
            where.loginType = { $ne: LOGIN_TYPES_FILTER.Fake };
        } else {
            where.loginType = loginType;
        }
    }

    var query = User.find(where);

    return yield PaginationHandler.getPaginatedResultsWithName(query, 'users', page, pageSize);
}

function getLoginTypes() {
    return _.values(LOGIN_TYPES_FILTER);
}

function* find(userId) {
    return yield User.findById(userId).exec();
}

function* getUserDevices(userId) {
    var user = yield User.findById(userId).populate('devices').exec();
    if (user == null) {
        return [];
    }

    return user.devices;
}

function* getDevicesForAllUsers() {
    return yield Device.find({}).exec();
}

function* getUserProfile(userId, fromDate, toDate) {
    var user = yield find(userId);
    if (user == null) {
        return Boom.notFound('User is not existing!');
    }
    user = user.toObject();
    var details = yield ScoresHandler.getUserDetails(userId);
    user.apps = details.addedApps;
    user.comments = details.comments;
    user.votes = details.votes;
    user.collections = details.collections;
    user.favouriteApps = yield AppsHandler.getFavouriteAppsCount(userId);
    user.favouriteCollections = yield AppsCollectionsHandler.getCollectionsCount(userId);
    user.score = (yield ScoresHandler.getUserDetails(userId, fromDate, toDate)).score;

    return user;
}

function* create(user, notificationId) {
    var currUser = yield User.findOne({ email: user.email }).populate('devices').exec();
    if (!currUser) {
        currUser = yield User.create(user);
        if (currUser.loginType == LOGIN_TYPES_FILTER.Twitter) {
            postTweet(currUser);
            followUser(currUser);
        }
    } else {
        currUser.name = user.name;
        currUser.username = user.username;
        currUser.profilePicture = user.profilePicture;
        currUser.coverPicture = user.coverPicture;
        currUser.loginType = user.loginType;
        currUser.locale = user.locale;
        currUser.appVersion = user.appVersion;
    }

    if (notificationId) {
        if (currUser.devices == undefined || currUser.devices == null) {
            currUser.devices = [];
        }

        if (isUserDeviceExisting(currUser.devices, notificationId) == false) {
            var device = yield Device.findOneOrCreate({ notificationId: notificationId }, { notificationId: notificationId, notificationsEnabled: true });
            currUser.devices.push(device);
        }
    }
    yield currUser.save();

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