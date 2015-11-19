'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _handlersStatsUsers_stats_handler = require('../handlers/stats/users_stats_handler');

var UsersStatsHandler = _interopRequireWildcard(_handlersStatsUsers_stats_handler);

var _ = require('underscore');
var Joi = require('joi');

var periodSchema = require('../schemas/stats_period_schema').periodSchema;
var userStatsRoutes = [{
    method: "GET",
    path: "/stats/users",
    handler: function handler(req, reply) {
        var model = req.query;
        reply.co(UsersStatsHandler.getAllUsers(model.username, model.loginType, model.page, model.pageSize));
    },
    config: {
        validate: {
            query: {
                username: Joi.string().optional(),
                loginType: Joi.string().optional(),
                page: Joi.number().optional(),
                pageSize: Joi.number().optional()
            }
        },
        auth: false,
        description: 'Get a list of all registered users.',
        tags: ['api']
    }
}, {
    method: "GET",
    path: "/stats/users/comments",
    handler: function handler(req, reply) {
        var model = req.query;
        reply.co(UsersStatsHandler.getUserCommentsCount(model.fromDate, model.toDate));
    },
    config: {
        validate: {
            query: periodSchema
        },
        description: 'Get a list of all registered users.',
        tags: ['api']
    }
}, {
    method: "GET",
    path: "/stats/users/login",
    handler: function handler(req, reply) {
        var model = req.query;
        reply.co(UsersStatsHandler.getLoggedInUsersCount(model.fromDate, model.toDate));
    },
    config: {
        validate: {
            query: periodSchema
        },
        description: 'Get a list of all registered users.',
        tags: ['api']
    }
}, {
    method: "GET",
    path: "/stats/users/app/votes",
    handler: function handler(req, reply) {
        var model = req.query;
        reply.co(UsersStatsHandler.getLoggedInUsersCount(model.fromDate, model.toDate));
    },
    config: {
        validate: {
            query: periodSchema
        },
        description: 'Get a list of all registered users.',
        tags: ['api']
    }
}, {
    method: "GET",
    path: "/stats/users/anonymous/actions",
    handler: function handler(req, reply) {
        var model = req.query;
        reply.co(UsersStatsHandler.getAnonymousUserActions(model));
    },
    config: {
        validate: {
            query: periodSchema
        },
        auth: false,
        description: 'Get a list of all registered users.',
        tags: ['api']
    }
}];

module.exports.userStatsRoutes = userStatsRoutes;