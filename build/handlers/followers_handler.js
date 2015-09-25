'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.getFollowers = getFollowers;
exports.getFollowing = getFollowing;
exports.isFollowing = isFollowing;
exports.followUser = followUser;
exports.followUserWithMany = followUserWithMany;
exports.unfollowUser = unfollowUser;
exports.getFollowersIds = getFollowersIds;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _pagination_handlerJs = require('./pagination_handler.js');

var PaginationHandler = _interopRequireWildcard(_pagination_handlerJs);

var _users_handlerJs = require('./users_handler.js');

var UsersHandler = _interopRequireWildcard(_users_handlerJs);

var _history_handlerJs = require('./history_handler.js');

var HistoryHandler = _interopRequireWildcard(_history_handlerJs);

var _notifications_handlerJs = require('./notifications_handler.js');

var NotificationsHandler = _interopRequireWildcard(_notifications_handlerJs);

var Boom = require('boom');

var Mongoose = require('mongoose');
var User = require('../models').User;
var Follower = require('../models').Follower;

var CONFIG = require('../config/config');
var HISTORY_EVENT_TYPES = CONFIG.HISTORY_EVENT_TYPES;
var NOTIFICATION_TYPES = CONFIG.NOTIFICATION_TYPES;

function* getFollowers(userId) {
    var page = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
    var pageSize = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

    var query = Follower.find({ following: userId }).select("-_id follower").populate("follower");
    var result = yield PaginationHandler.getPaginatedResultsWithName(query, "followers", page, pageSize);
    var followers = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = result.followers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var item = _step.value;

            followers.push(item.follower);
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

    result.followers = followers;
    return result;
}

function* getFollowing(userId) {
    var page = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
    var pageSize = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

    var query = Follower.find({ follower: userId }).select("-_id following").populate("following");
    var result = yield PaginationHandler.getPaginatedResultsWithName(query, "following", page, pageSize);
    var following = [];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = result.following[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var item = _step2.value;

            following.push(item.following);
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

    result.following = following;
    return result;
}

function* isFollowing(user1Id, user2Id) {
    return (yield Follower.count({ following: user2Id, follower: user1Id }).exec()) > 0;
}

function* followUser(followingId, followerId) {
    var following = yield UsersHandler.find(followingId);
    if (following == null) {
        return Boom.notFound("User is not existing!");
    }

    var follower = yield UsersHandler.find(followerId);
    if (follower == null) {
        return Boom.notFound("User is not existing!");
    }

    yield followSingleUser(followingId, followerId);
    NotificationsHandler.sendNotificationsToUsers([followingId], "", "", "", NOTIFICATION_TYPES.USER_FOLLOWED, { followerId: followerId });
    return Boom.OK();
}

function* followUserWithMany(followingId, followerIds) {
    var following = yield UsersHandler.find(followingId);
    if (following == null) {
        return Boom.notFound("User is not existing!");
    }

    if (followerIds == undefined || followerIds.length == 0) {
        return Boom.badRequest("Follower ids are required");
    }

    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = followerIds[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var userId = _step3.value;

            var follower = yield UsersHandler.find(userId);
            if (follower == null) {
                continue;
            }

            yield followSingleUser(followingId, userId);
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

    NotificationsHandler.sendNotificationsToUsers([followingId], "Many users followed you!", "", "", NOTIFICATION_TYPES.USER_FOLLOWED);
    return Boom.OK();
}

function* followSingleUser(followingId, followerId) {
    yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.USER_FOLLOWED, followerId, { followingId: followingId });
    yield Follower.findOneOrCreate({ following: followingId, follower: followerId }, { following: followingId, follower: followerId });
}

function* unfollowUser(followingId, followerId) {
    var following = yield UsersHandler.find(followingId);
    if (following == null) {
        return Boom.notFound("User is not existing!");
    }

    var follower = yield UsersHandler.find(followerId);
    if (follower == null) {
        return Boom.notFound("User is not existing!");
    }

    yield Follower.remove({ following: followingId, follower: followerId }).exec();

    return Boom.OK();
}

function* getFollowersIds(userId) {
    var followers = (yield getFollowers(userId)).followers;
    var userIds = [];
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = followers[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var follower = _step4.value;

            userIds.push(follower._id);
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

    return userIds;
}