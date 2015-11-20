var Models = require('../../models')
var User = Models.User
var Anonymous = Models.Anonymous
var Comment = Models.Comment
var Vote = Models.Vote
var ObjectId = require('mongodb').ObjectId
var _ = require("underscore")

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

export function* getUsersActions({fromDate, toDate}) {
    let comments = yield CommentsHandler.getComments(fromDate, toDate)
    let votes = yield VotesHandler.getVotes(fromDate, toDate)

    let commentsResponse = {
        loginnedCommentsCount: 0,
        anonymousCommentsCount: 0,
        loginned: [],
        anonymous: []
    }

    let groupedComments = _.groupBy(comments, (comment) => {
        return comment.createdBy.id
    })

    populateCommentsResponse(groupedComments, commentsResponse)

    let votesResponse = {
        loginned: [],
        anonymous: [],
        fake: [],
        loginnedVotesCount: 0,
        anonymousVotesCount: 0,
        fakeVotesCount: 0
    }

    var groupedVotes = _.groupBy(votes, function(vote){
        return vote.user.id;
    });
    populateVotesResponse(groupedVotes, votesResponse)

    return {
        votes: votesResponse,
        comments: commentsResponse
    }
}

function populateVotesResponse(groupedVotes, votesResponse) {
    Object.keys(groupedVotes).forEach(function(userId) {
        let user = groupedVotes[userId][0].user
        let votesCount = groupedVotes[userId].length
        let obj = {
            user: user,
            votesCount: votesCount
        }

        if(user.loginType == LOGIN_TYPES.Anonymous) {
            votesResponse.anonymous.push(obj)
            votesResponse.anonymousVotesCount += votesCount
        } else if(user.loginType == LOGIN_TYPES.Fake){
            votesResponse.fake.push(obj)
            votesResponse.fakeVotesCount += votesCount
        } else {
            votesResponse.loginned.push(obj)
            votesResponse.loginnedVotesCount += votesCount
        }
    });
}

function populateCommentsResponse(groupedComments, commentsResponse) {
    Object.keys(groupedComments).forEach(function(userId) {
        let user = groupedComments[userId][0].createdBy
        let commentsCount = groupedComments[userId].length
        let obj = {
            user: user,
            comments: groupedComments[userId],
            commentsCount: commentsCount
        }

        if(user.loginType == LOGIN_TYPES.Anonymous) {
            commentsResponse.anonymous.push(obj)
            commentsResponse.anonymousCommentsCount += commentsCount
        } else {
            commentsResponse.loginned.push(obj)
            commentsResponse.loginnedCommentsCount += commentsCount
        }
    });
}


function objectIdWithTimestamp(timestamp) {
    // Convert date object to hex seconds since Unix epoch
    var hexSeconds = Math.floor(timestamp/1000).toString(16);
    // Create an ObjectId with that hex timestamp
    var constructedObjectId = ObjectId(hexSeconds + "0000000000000000");

    return constructedObjectId
}

