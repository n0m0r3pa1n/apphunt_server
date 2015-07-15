'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _pagination_stats_handler = require('./pagination_stats_handler');

var PaginationHandler = _interopRequireWildcard(_pagination_stats_handler);

var Models = require('../../models');
var User = Models.User;

function* getAllUsers(username, loginType, page, pageSize) {
    var where = {};
    if (username !== undefined) {
        where = { username: { $regex: username, $options: 'i' } };
    }

    if (loginType !== undefined && loginType == 'real') {
        where.loginType = { '$ne': 'fake' };
    } else if (loginType !== undefined) {
        where.loginType == loginType;
    }

    var query = User.find(where);
    return yield PaginationHandler.getPaginatedResults(query, page, pageSize);
}

module.exports.getAllUsers = getAllUsers;