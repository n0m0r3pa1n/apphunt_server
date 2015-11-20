'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.getAllUsers = getAllUsers;
exports.getUserCommentsCount = getUserCommentsCount;
exports.getLoggedInUsersCount = getLoggedInUsersCount;
exports.getUsersVotesForApps = getUsersVotesForApps;
exports.getUsersActions = getUsersActions;

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
var _ = require("underscore");

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

function* getUsersActions(_ref) {
    var fromDate = _ref.fromDate;
    var toDate = _ref.toDate;

    var comments = yield CommentsHandler.getComments(fromDate, toDate);
    var votes = yield VotesHandler.getVotes(fromDate, toDate);

    var commentsResponse = {
        loginnedCommentsCount: 0,
        anonymousCommentsCount: 0,
        loginned: [],
        anonymous: []
    };

    var groupedComments = _.groupBy(comments, function (comment) {
        return comment.createdBy.id;
    });

    populateCommentsResponse(groupedComments, commentsResponse);

    var votesResponse = {
        loginned: [],
        anonymous: [],
        fake: [],
        loginnedVotesCount: 0,
        anonymousVotesCount: 0,
        fakeVotesCount: 0
    };

    var groupedVotes = _.groupBy(votes, function (vote) {
        return vote.user.id;
    });
    populateVotesResponse(groupedVotes, votesResponse);

    return {
        votes: votesResponse,
        comments: commentsResponse
    };
}

function populateVotesResponse(groupedVotes, votesResponse) {
    Object.keys(groupedVotes).forEach(function (userId) {
        var user = groupedVotes[userId][0].user;
        var votesCount = groupedVotes[userId].length;
        var obj = {
            user: user,
            votesCount: votesCount
        };

        if (user.loginType == LOGIN_TYPES.Anonymous) {
            votesResponse.anonymous.push(obj);
            votesResponse.anonymousVotesCount += votesCount;
        } else if (user.loginType == LOGIN_TYPES.Fake) {
            votesResponse.fake.push(obj);
            votesResponse.fakeVotesCount += votesCount;
        } else {
            votesResponse.loginned.push(obj);
            votesResponse.loginnedVotesCount += votesCount;
        }
    });
}

function populateCommentsResponse(groupedComments, commentsResponse) {
    Object.keys(groupedComments).forEach(function (userId) {
        var user = groupedComments[userId][0].createdBy;
        var commentsCount = groupedComments[userId].length;
        var obj = {
            user: user,
            comments: groupedComments[userId],
            commentsCount: commentsCount
        };

        if (user.loginType == LOGIN_TYPES.Anonymous) {
            commentsResponse.anonymous.push(obj);
            commentsResponse.anonymousCommentsCount += commentsCount;
        } else {
            commentsResponse.loginned.push(obj);
            commentsResponse.loginnedCommentsCount += commentsCount;
        }
    });
}

function objectIdWithTimestamp(timestamp) {
    // Convert date object to hex seconds since Unix epoch
    var hexSeconds = Math.floor(timestamp / 1000).toString(16);
    // Create an ObjectId with that hex timestamp
    var constructedObjectId = ObjectId(hexSeconds + "0000000000000000");

    return constructedObjectId;
}