var Models = require('../../models')
var User = Models.User
var Comment = Models.Comment
var Vote = Models.Vote

var PaginationHandler = require('./pagination_stats_handler')

function* getAllUsers(username, loginType, page, pageSize) {
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

function* getUserCommentsCount(fromDate, toDate) {
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

function* getLoggedInUsersCount(fromDate, toDate) {
    var where = {}
    where.createdAt = {"$gte": fromDate, "$lt": toDate};
    where.loginType = {"$ne": "fake"}

    return yield User.count(where).exec()
}

function* getUsersVotesForApps(fromDate, toDate) {
    var where = {}
    where.createdAt = {"$gte": fromDate, "$lt": toDate};
    where.loginType = {"$ne": "fake"}

    // TODO: figure out the logic for finding votes for apps
}


module.exports.getAllUsers = getAllUsers
module.exports.getUserCommentsCount = getUserCommentsCount
module.exports.getLoggedInUsersCount = getLoggedInUsersCount
module.exports.getUsersVotesForApps = getUsersVotesForApps