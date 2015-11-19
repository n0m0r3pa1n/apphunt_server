var Models = require('../../models')
var User = Models.User
var Anonymous = Models.Anonymous
var Comment = Models.Comment
var Vote = Models.Vote
var ObjectId = require('mongodb').ObjectId

var LOGIN_TYPES = require('../../config/config').LOGIN_TYPES

import * as CommentsHandler from './../comments_handler'
import * as VotesHandler from './../votes_handler'
import * as PaginationHandler from './../pagination_handler'

export function* getAllUsers(username, loginType, page, pageSize) {
    var where = {};
    if(username !== undefined) {
        where = {username: {$regex: username, $options: 'i'}};
    }

    if(loginType !== undefined && loginType == 'real') {
        where.loginType = { "$ne": 'fake'}
    } else if(loginType !== undefined) {
        where.loginType = loginType
    }

    var query = User.find(where)
    return yield PaginationHandler.getPaginatedResults(query, page, pageSize)
}

export function* getUserCommentsCount(fromDate, toDate) {
    var where = {}
    where.createdAt = {"$gte": fromDate, "$lt": toDate};
    var comments = yield Comment.find(where).populate('createdBy').exec()
    var size = 0;
    for(var i=0; i < comments.length; i++) {
        if(comments[i].createdBy.loginType !== 'fake') {
            size++;
        }
    }

    return size;
}

export function* getLoggedInUsersCount(fromDate, toDate) {
    var where = {}
    where.createdAt = {"$gte": fromDate, "$lt": toDate};
    where.loginType = {"$ne": "fake"}

    return yield User.count(where).exec()
}

export function* getUsersVotesForApps(fromDate, toDate) {
    var where = {}
    where.createdAt = {"$gte": fromDate, "$lt": toDate};
    where.loginType = {"$ne": "fake"}

    // TODO: figure out the logic for finding votes for apps
}

export function* getAnonymousUserActions({fromDate, toDate}) {
    let comments = yield CommentsHandler.getComments(fromDate, toDate)
    let votes = yield VotesHandler.getVotes(fromDate, toDate)

    let anonymousComments = comments.reduce(function(acc, obj) {
        if(obj.createdBy.loginType == LOGIN_TYPES.Anonymous) {
            if(!acc["votesCount"]) {
                acc["votesCount"] = 1
            } else {
                acc["votesCount"] = acc["votesCount"]+ 1;
            }
        }

        return acc
    }, {})

    let anonymousVotes = votes.reduce(function(acc, obj) {
        if(obj.user.loginType == LOGIN_TYPES.Anonymous) {
            if(!acc["votesCount"]) {
                acc["votesCount"] = 1
            } else {
                acc["votesCount"] = acc["votesCount"]+ 1;
            }
        }

        return acc
    }, {})

    return {
        votesCount: anonymousVotes.votesCount == undefined ? 0 : anonymousVotes.votesCount,
        commentsCount: anonymousComments.votesCount == undefined ? 0 : anonymousComments.votesCount,
    }
}


function objectIdWithTimestamp(timestamp) {
    // Convert date object to hex seconds since Unix epoch
    var hexSeconds = Math.floor(timestamp/1000).toString(16);
    // Create an ObjectId with that hex timestamp
    var constructedObjectId = ObjectId(hexSeconds + "0000000000000000");

    return constructedObjectId
}

