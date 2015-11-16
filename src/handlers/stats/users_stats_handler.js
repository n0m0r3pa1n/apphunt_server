var Models = require('../../models')
var User = Models.User
var Anonymous = Models.Anonymous
var Comment = Models.Comment
var Vote = Models.Vote
var ObjectId = require('mongodb').ObjectId

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

export function* getAnonymousUserActions({fromDate, toDate, page=0, pageSize=0}) {
    var where = {}
    where._id = {"$gte": objectIdWithTimestamp(fromDate.getTime()), "$lt": objectIdWithTimestamp(toDate.getTime())};
    var query = Anonymous.find(where)
    let results = yield PaginationHandler.getPaginatedResults(query, page, pageSize)

    return results
}


function objectIdWithTimestamp(timestamp) {
    // Convert date object to hex seconds since Unix epoch
    var hexSeconds = Math.floor(timestamp/1000).toString(16);
    // Create an ObjectId with that hex timestamp
    var constructedObjectId = ObjectId(hexSeconds + "0000000000000000");

    return constructedObjectId
}

