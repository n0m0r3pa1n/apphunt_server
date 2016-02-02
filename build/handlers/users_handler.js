'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.get = get;
exports.getLoginTypes = getLoginTypes;
exports.isTopHunter = isTopHunter;
exports.find = find;
exports.findWithDevices = findWithDevices;
exports.findByUsername = findByUsername;
exports.getUserDevices = getUserDevices;
exports.filterExistingUsers = filterExistingUsers;
exports.getDeviceIdsForUser = getDeviceIdsForUser;
exports.getDevicesForUser = getDevicesForUser;
exports.getDevicesForAllUsers = getDevicesForAllUsers;
exports.getUserProfile = getUserProfile;
exports.create = create;
exports.getAnonymous = getAnonymous;
exports.update = update;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _comments_handler = require('./comments_handler');

var CommentsHandler = _interopRequireWildcard(_comments_handler);

var _apps_handlerJs = require('./apps_handler.js');

var AppsHandler = _interopRequireWildcard(_apps_handlerJs);

var _apps_collections_handlerJs = require('./apps_collections_handler.js');

var AppsCollectionsHandler = _interopRequireWildcard(_apps_collections_handlerJs);

var _pagination_handlerJs = require("./pagination_handler.js");

var PaginationHandler = _interopRequireWildcard(_pagination_handlerJs);

var _authentication_handlerJs = require('./authentication_handler.js');

var AuthHandler = _interopRequireWildcard(_authentication_handlerJs);

var _user_score_handlerJs = require('./user_score_handler.js');

var ScoresHandler = _interopRequireWildcard(_user_score_handlerJs);

var _followers_handlerJs = require('./followers_handler.js');

var FollowersHandler = _interopRequireWildcard(_followers_handlerJs);

var _ = require('underscore');
var Boom = require('boom');
var Bolt = require("bolt-js");
var TweetComposer = require('../utils/tweet_composer');
var CONFIG = require('../config/config');
var LOGIN_TYPES_FILTER = CONFIG.LOGIN_TYPES_FILTER;

var User = require('../models').User;
var Anonymous = require('../models').Anonymous;
var Device = require('../models').Device;
var UserScoreHandler = require('./user_score_handler');

var UserCollectionsHandler = require('./users_collections_handler');

function* get(q, loginType, page, pageSize) {
    var where = {};
    if (q !== undefined) {
        where = {
            $or: [{ email: { $regex: q, $options: 'i' } }, { name: { $regex: q, $options: 'i' } }, { username: { $regex: q, $options: 'i' } }]
        };
    }

    if (loginType !== undefined) {
        if (loginType == LOGIN_TYPES_FILTER.Real) {
            where.loginType = { $ne: LOGIN_TYPES_FILTER.Fake };
        } else {
            where.loginType = loginType;
        }
    }

    var query = User.find(where);

    return yield PaginationHandler.getPaginatedResultsWithName(query, "users", page, pageSize);
}

function getLoginTypes() {
    return _.values(LOGIN_TYPES_FILTER);
}

function* isTopHunter(userId) {
    var user = yield find(userId);
    if (!user) {
        return { isTopHunter: false };
    }
    var topHunters = (yield UserCollectionsHandler.getTopHuntersList()).users;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = topHunters[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var hunter = _step.value;

            if (hunter._id == userId) {
                return { isTopHunter: true };
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator['return']) {
                _iterator['return']();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    return { isTopHunter: false };
}

function* find(userId) {
    return yield User.findById(userId).exec();
}

function* findWithDevices(userId) {
    return yield User.findById(userId).populate('devices').exec();
}

function* findByUsername(username) {
    return yield User.findOne({ username: username }).populate('devices').exec();
}

function* getUserDevices(userId) {
    var user = yield User.findById(userId).populate('devices').exec();
    if (user == null) {
        return [];
    }

    return user.devices;
}

function* filterExistingUsers(userId, names) {
    var user = yield find(userId);
    if (user == null) {
        return Boom.notFound("User is not existing!");
    }

    var matchingUsers = [];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = names[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var _name = _step2.value;

            var users = yield User.find({ name: { $regex: _name, $options: 'i' } }).exec();
            matchingUsers = matchingUsers.concat(users);
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                _iterator2['return']();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }

    return { users: yield getPopulatedIsFollowing(user.id, matchingUsers) };
}

function* getPopulatedIsFollowing(followerId, users) {
    var result = [];
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = users[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var user = _step3.value;

            user = user.toObject();
            user.isFollowing = yield FollowersHandler.isFollowing(followerId, user._id);
            result.push(user);
        }
    } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion3 && _iterator3['return']) {
                _iterator3['return']();
            }
        } finally {
            if (_didIteratorError3) {
                throw _iteratorError3;
            }
        }
    }

    return result;
}

function* getDeviceIdsForUser(user) {
    if (user.populated('devices')) {
        user = yield User.findOne(user).populate('devices');
    }

    var notificationIds = [];
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = user.devices[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var device = _step4.value;

            notificationIds = notificationIds.concat(device.notificationId);
        }
    } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion4 && _iterator4['return']) {
                _iterator4['return']();
            }
        } finally {
            if (_didIteratorError4) {
                throw _iteratorError4;
            }
        }
    }

    return notificationIds;
}

function* getDevicesForUser(userId) {
    var user = yield User.findById(userId).populate('devices').exec();
    return user.devices;
}

function* getDevicesForAllUsers() {
    return yield Device.find({}).exec();
}

function* getUserProfile(userId, fromDate, toDate, currentUserId) {
    var user = yield find(userId);
    if (user == null) {
        return Boom.notFound("User is not existing!");
    }
    if (currentUserId != undefined) {
        var currentUser = yield find(currentUserId);
        if (currentUser == null) {
            return Boom.notFound("Current user is not existing!");
        }
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
    if (currentUserId != undefined) {
        user.isFollowing = yield FollowersHandler.isFollowing(currentUserId, userId);
    }

    var followings = currentUserId != undefined ? (yield FollowersHandler.getPopulatedFollowing(userId, currentUserId)) : (yield FollowersHandler.getFollowing(userId)).following;
    user.following = followings;
    user.followingCount = followings.length;

    var followers = currentUserId != undefined ? (yield FollowersHandler.getPopulatedFollowers(userId, currentUserId)) : (yield FollowersHandler.getFollowers(userId)).followers;
    user.followers = followers;
    user.followersCount = followers.length;
    return user;
}

function* create(user, notificationId, advertisingId) {
    var currUser = null;

    if (user.loginType == LOGIN_TYPES_FILTER.Anonymous) {
        if (!advertisingId) {
            return Boom.badRequest("advertisingId is empty for anonymous user");
        }
        currUser = yield getAnonymousUser(advertisingId);
    } else {
        if (!user.email) {
            return Boom.badRequest("user email is empty for " + user.loginType + " user");
        }
        currUser = yield getRegisteredUser(user.email);
    }

    if (currUser) {
        yield updateUser(currUser, user);
    } else {
        currUser = yield createUser(user, advertisingId);
        if (currUser.loginType == LOGIN_TYPES_FILTER.Twitter) {
            postTweet(currUser);
            followUser(currUser);
        }
    }

    if (notificationId) {
        yield createUserDevices(currUser, notificationId);
    }

    var myUser = currUser.toObject();
    myUser.token = AuthHandler.generateToken(currUser._id);
    myUser.id = myUser._id;
    return myUser;
}

function* getAnonymousUser(advertisingId) {
    var anonymousUser = yield Anonymous.findOne({ advertisingId: advertisingId }).populate('user').exec();
    if (anonymousUser) {
        return yield User.findById(anonymousUser.user).populate('devices').exec();
    } else {
        return null;
    }
}

function* getRegisteredUser(email) {
    return yield User.findOne({ email: email }).populate('devices').exec();
}

function* createUser(model, advertisingId) {
    var isAnonymous = false;
    if (model.loginType == LOGIN_TYPES_FILTER.Anonymous) {
        isAnonymous = true;
        model.name = "Anonymous";
        model.username = "anonymous";
        model.profilePicture = 'https://scontent-vie1-1.xx.fbcdn.net/hprofile-xfp1/t31.0-1/c379.0.1290.1290/' + '10506738_10150004552801856_220367501106153455_o.jpg';
        model.email = yield getUniqueUserEmail(model.email);
    }

    var user = yield User.create(model);
    if (isAnonymous) {
        yield Anonymous.create({ advertisingId: advertisingId, user: user });
    }

    return user;
}

function* updateUser(currUser, model) {
    currUser.name = model.name;
    currUser.username = model.username;
    currUser.profilePicture = model.profilePicture;
    currUser.coverPicture = model.coverPicture;
    currUser.loginType = model.loginType;
    currUser.locale = model.locale;
    currUser.appVersion = model.appVersion;

    yield currUser.save();
}

function* getUniqueUserEmail(email) {
    if (!email) {
        return yield getUniqueRandomEmail();
    } else {
        var isExistingEmail = yield User.findOne({ email: email }).exec();
        if (isExistingEmail) {
            return yield getUniqueRandomEmail();
        } else {
            return email;
        }
    }
}

function* createUserDevices(currUser, notificationId) {
    if (currUser.devices == undefined || currUser.devices == null) {
        currUser.devices = [];
    }

    if (isUserDeviceExisting(currUser.devices, notificationId) == false) {
        var device = yield Device.findOneOrCreate({ notificationId: notificationId }, {
            notificationId: notificationId,
            notificationsEnabled: true
        });
        currUser.devices.push(device);
        yield currUser.save();
    }
}

function* getAnonymous() {
    return yield Anonymous.find({}).exec();
}

function* getUniqueRandomEmail() {
    var isExistingEmail = false;
    var text;
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    do {
        text = "";
        for (var i = 0; i < 9; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        text += "@anonymous.com";

        isExistingEmail = yield User.findOne({ email: text }).exec();
    } while (isExistingEmail);

    return text;
}

function postTweet(user) {
    var bolt = new Bolt(CONFIG.BOLT_APP_ID);
    var tweetComposer = new TweetComposer(CONFIG.APP_HUNT_TWITTER_HANDLE);
    var tweetOptions = {
        username: user.username,
        hashTags: ["app"]
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
        var device = yield Device.findOneOrCreate({ notificationId: notificationId }, {
            notificationId: notificationId,
            notificationsEnabled: true
        });
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