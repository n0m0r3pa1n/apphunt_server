'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.getFollowers = getFollowers;
exports.getFollowing = getFollowing;
exports.followUser = followUser;
exports.unfollowUser = unfollowUser;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _pagination_handlerJs = require('./pagination_handler.js');

var PaginationHandler = _interopRequireWildcard(_pagination_handlerJs);

var _users_handlerJs = require('./users_handler.js');

var UsersHandler = _interopRequireWildcard(_users_handlerJs);

var Boom = require('boom');

var Mongoose = require('mongoose');
var User = require('../models').User;
var Follower = require('../models').Follower;

function* getFollowers(userId, page, pageSize) {
    var query = Follower.find({ following: userId }).select('-_id follower').populate('follower');
    var result = yield PaginationHandler.getPaginatedResultsWithName(query, 'followers', page, pageSize);
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

function* getFollowing(userId, page, pageSize) {
    var query = Follower.find({ follower: userId }).select('-_id following').populate('following');
    var result = yield PaginationHandler.getPaginatedResultsWithName(query, 'following', page, pageSize);
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

function* followUser(followingId, followerId) {
    var following = yield UsersHandler.find(followingId);
    if (following == null) {
        return Boom.notFound('User is not existing!');
    }

    var follower = yield UsersHandler.find(followerId);
    if (follower == null) {
        return Boom.notFound('User is not existing!');
    }

    yield Follower.findOneOrCreate({ following: followingId, follower: followerId }, { following: followingId, follower: followerId });
    return Boom.OK();
}

function* unfollowUser(followingId, followerId) {
    var following = yield UsersHandler.find(followingId);
    if (following == null) {
        return Boom.notFound('User is not existing!');
    }

    var follower = yield UsersHandler.find(followerId);
    if (follower == null) {
        return Boom.notFound('User is not existing!');
    }

    yield Follower.remove({ following: followingId, follower: followerId }).exec();

    return Boom.OK();
}