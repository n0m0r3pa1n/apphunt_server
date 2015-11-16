'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.getAllUsers = getAllUsers;
exports.getUserCommentsCount = getUserCommentsCount;
exports.getLoggedInUsersCount = getLoggedInUsersCount;
exports.getUsersVotesForApps = getUsersVotesForApps;
exports.getAnonymousUserActions = getAnonymousUserActions;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _pagination_handler = require('./../pagination_handler');

var PaginationHandler = _interopRequireWildcard(_pagination_handler);

var Models = require('../../models');
var User = Models.User;
var Anonymous = Models.Anonymous;
var Comment = Models.Comment;
var Vote = Models.Vote;
var ObjectId = require('mongodb').ObjectId;

function* getAllUsers(username, loginType, page, pageSize) {
    var where = {};
    if (username !== undefined) {
        where = { username: { $regex: username, $options: 'i' } };
    }

    if (loginType !== undefined && loginType == 'real') {
        where.loginType = { "$ne": 'fake' };
    } else if (loginType !== undefined) {
        where.loginType = loginType;
    }

    var query = User.find(where);
    return yield PaginationHandler.getPaginatedResults(query, page, pageSize);
}

function* getUserCommentsCount(fromDate, toDate) {
    var where = {};
    where.createdAt = { "$gte": fromDate, "$lt": toDate };
    var comments = yield Comment.find(where).populate('createdBy').exec();
    var size = 0;
    for (var i = 0; i < comments.length; i++) {
        if (comments[i].createdBy.loginType !== 'fake') {
            size++;
        }
    }

    return size;
}

function* getLoggedInUsersCount(fromDate, toDate) {
    var where = {};
    where.createdAt = { "$gte": fromDate, "$lt": toDate };
    where.loginType = { "$ne": "fake" };

    return yield User.count(where).exec();
}

function* getUsersVotesForApps(fromDate, toDate) {
    var where = {};
    where.createdAt = { "$gte": fromDate, "$lt": toDate };
    where.loginType = { "$ne": "fake" };

    // TODO: figure out the logic for finding votes for apps
}

function* getAnonymousUserActions(_ref) {
    var fromDate = _ref.fromDate;
    var toDate = _ref.toDate;
    var _ref$page = _ref.page;
    var page = _ref$page === undefined ? 0 : _ref$page;
    var _ref$pageSize = _ref.pageSize;
    var pageSize = _ref$pageSize === undefined ? 0 : _ref$pageSize;

    var where = {};
    where._id = { "$gte": objectIdWithTimestamp(fromDate.getTime()), "$lt": objectIdWithTimestamp(toDate.getTime()) };
    var query = Anonymous.find(where);
    var results = yield PaginationHandler.getPaginatedResults(query, page, pageSize);

    return results;
}

function objectIdWithTimestamp(timestamp) {
    // Convert date object to hex seconds since Unix epoch
    var hexSeconds = Math.floor(timestamp / 1000).toString(16);
    // Create an ObjectId with that hex timestamp
    var constructedObjectId = ObjectId(hexSeconds + "0000000000000000");

    return constructedObjectId;
}