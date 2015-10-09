'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _pagination_handler = require('./../pagination_handler');

var PaginationHandler = _interopRequireWildcard(_pagination_handler);

var Models = require('../../models');
var User = Models.User;
var Comment = Models.Comment;
var Vote = Models.Vote;

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

module.exports.getAllUsers = getAllUsers;
module.exports.getUserCommentsCount = getUserCommentsCount;
module.exports.getLoggedInUsersCount = getLoggedInUsersCount;
module.exports.getUsersVotesForApps = getUsersVotesForApps;