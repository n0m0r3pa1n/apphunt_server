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

var _comments_handler = require('./../comments_handler');

var CommentsHandler = _interopRequireWildcard(_comments_handler);

var _votes_handler = require('./../votes_handler');

var VotesHandler = _interopRequireWildcard(_votes_handler);

var _pagination_handler = require('./../pagination_handler');

var PaginationHandler = _interopRequireWildcard(_pagination_handler);

var Models = require('../../models');
var User = Models.User;
var Anonymous = Models.Anonymous;
var Comment = Models.Comment;
var Vote = Models.Vote;
var ObjectId = require('mongodb').ObjectId;

var LOGIN_TYPES = require('../../config/config').LOGIN_TYPES;

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

    var comments = yield CommentsHandler.getComments(fromDate, toDate);
    var votes = yield VotesHandler.getVotes(fromDate, toDate);

    var anonymousComments = comments.reduce(function (acc, obj) {
        if (obj.createdBy.loginType == LOGIN_TYPES.Anonymous) {
            if (!acc["votesCount"]) {
                acc["votesCount"] = 1;
            } else {
                acc["votesCount"] = acc["votesCount"] + 1;
            }
        }

        return acc;
    }, {});

    var anonymousVotes = votes.reduce(function (acc, obj) {
        if (obj.user.loginType == LOGIN_TYPES.Anonymous) {
            if (!acc["votesCount"]) {
                acc["votesCount"] = 1;
            } else {
                acc["votesCount"] = acc["votesCount"] + 1;
            }
        }

        return acc;
    }, {});

    return {
        votesCount: anonymousVotes.votesCount == undefined ? 0 : anonymousVotes.votesCount,
        commentsCount: anonymousComments.votesCount == undefined ? 0 : anonymousComments.votesCount
    };
}

function objectIdWithTimestamp(timestamp) {
    // Convert date object to hex seconds since Unix epoch
    var hexSeconds = Math.floor(timestamp / 1000).toString(16);
    // Create an ObjectId with that hex timestamp
    var constructedObjectId = ObjectId(hexSeconds + "0000000000000000");

    return constructedObjectId;
}