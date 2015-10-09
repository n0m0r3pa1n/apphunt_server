'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.getFollowers = getFollowers;
exports.getPopulatedFollowers = getPopulatedFollowers;
exports.getPopulatedFollowing = getPopulatedFollowing;
exports.getFollowing = getFollowing;
exports.isFollowing = isFollowing;
exports.followUser = followUser;
exports.addFollowings = addFollowings;
exports.addFollowers = addFollowers;
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

function* getFollowers(profileId, userId) {
    var page = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
    var pageSize = arguments.length <= 3 || arguments[3] === undefined ? 0 : arguments[3];

    var query = Follower.find({ following: profileId }).select("-_id follower").populate("follower");
    var result = yield PaginationHandler.getPaginatedResultsWithName(query, "followers", page, pageSize);
    var followers = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = result.followers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var item = _step.value;

            var follower = item.follower.toObject();
            follower.id = item.follower._id;
            follower.isFollowing = yield isFollowing(userId, follower._id);
            followers.push(follower);
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

function* getPopulatedFollowers(userProfileId, currentUserId) {
    var followers = (yield getFollowers(userProfileId)).followers;
    return yield getPopulatedIsFollowing(currentUserId, followers);
}

function* getPopulatedFollowing(userProfileId, currentUserId) {
    var followings = (yield getFollowing(userProfileId)).following;
    return yield getPopulatedIsFollowing(currentUserId, followings);
}

function* getPopulatedIsFollowing(followerId, users) {
    var result = [];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = users[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var user = _step2.value;

            if (user instanceof User) {
                user = user.toObject();
            }
            user.isFollowing = yield isFollowing(followerId, user._id);
            result.push(user);
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

    return result;
}

function* getFollowing(profileId) {
    var userId = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];
    var page = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
    var pageSize = arguments.length <= 3 || arguments[3] === undefined ? 0 : arguments[3];

    var query = Follower.find({ follower: profileId }).select("-_id following").populate("following");
    var result = yield PaginationHandler.getPaginatedResultsWithName(query, "following", page, pageSize);
    var followings = [];
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = result.following[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var item = _step3.value;

            var following = item.following.toObject();
            following.id = item.following._id;
            following.isFollowing = yield isFollowing(userId, following._id);
            followings.push(following);
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

    result.following = followings;
    return result;
}

function* isFollowing(followerId, followingId) {
    if (followerId == undefined || followingId == undefined) {
        return false;
    }
    return (yield Follower.count({ following: followingId, follower: followerId }).exec()) > 0;
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

function* addFollowings(userId, followingIds) {
    var user = yield UsersHandler.find(userId);
    if (user == null) {
        return Boom.notFound("User is not existing!");
    }

    if (followingIds == undefined || followingIds.length == 0) {
        return Boom.badRequest("Following ids are required");
    }

    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = followingIds[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var followingId = _step4.value;

            var following = yield UsersHandler.find(followingId);
            if (following == null) {
                continue;
            }

            yield followSingleUser(followingId, userId);
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

    return Boom.OK();
}

function* addFollowers(followingId, followerIds) {
    var following = yield UsersHandler.find(followingId);
    if (following == null) {
        return Boom.notFound("User is not existing!");
    }

    if (followerIds == undefined || followerIds.length == 0) {
        return Boom.badRequest("Follower ids are required");
    }

    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
        for (var _iterator5 = followerIds[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var userId = _step5.value;

            var follower = yield UsersHandler.find(userId);
            if (follower == null) {
                continue;
            }

            yield followSingleUser(followingId, userId);
        }
    } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion5 && _iterator5['return']) {
                _iterator5['return']();
            }
        } finally {
            if (_didIteratorError5) {
                throw _iteratorError5;
            }
        }
    }

    NotificationsHandler.sendNotificationsToUsers([followingId], "Many users followed you!", "", "", NOTIFICATION_TYPES.USER_FOLLOWED);
    return Boom.OK();
}

function* followSingleUser(followingId, followerId) {
    var user = yield UsersHandler.find(followerId);
    if (user == null) {
        return Boom.notFound('Follower cannot be found!');
    }
    var test = yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.USER_FOLLOWED, followerId, { followingId: followingId, userName: user.name });
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
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
        for (var _iterator6 = followers[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var follower = _step6.value;

            userIds.push(follower._id);
        }
    } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion6 && _iterator6['return']) {
                _iterator6['return']();
            }
        } finally {
            if (_didIteratorError6) {
                throw _iteratorError6;
            }
        }
    }

    return userIds;
}