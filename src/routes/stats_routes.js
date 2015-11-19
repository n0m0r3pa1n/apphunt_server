var _ = require('underscore')
var Joi = require('joi')
import * as UsersStatsHandler from '../handlers/stats/users_stats_handler'
var periodSchema = require('../schemas/stats_period_schema').periodSchema
var userStatsRoutes = [
    {
        method: "GET",
        path: "/stats/users",
        handler: function(req,reply) {
            var model = req.query
            reply.co(UsersStatsHandler.getAllUsers(model.username, model.loginType, model.page, model.pageSize))
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
    },
    {
        method: "GET",
        path: "/stats/users/comments",
        handler: function(req,reply) {
            var model = req.query
            reply.co(UsersStatsHandler.getUserCommentsCount(model.fromDate, model.toDate))
        },
        config: {
            validate: {
                query: periodSchema
            },
            description: 'Get a list of all registered users.',
            tags: ['api']
        }
    },
    {
        method: "GET",
        path: "/stats/users/login",
        handler: function(req,reply) {
            var model = req.query
            reply.co(UsersStatsHandler.getLoggedInUsersCount(model.fromDate, model.toDate))
        },
        config: {
            validate: {
                query: periodSchema
            },
            description: 'Get a list of all registered users.',
            tags: ['api']
        }
    },
    {
        method: "GET",
        path: "/stats/users/app/votes",
        handler: function(req,reply) {
            var model = req.query
            reply.co(UsersStatsHandler.getLoggedInUsersCount(model.fromDate, model.toDate))
        },
        config: {
            validate: {
                query: periodSchema
            },
            description: 'Get a list of all registered users.',
            tags: ['api']
        }
    },
    {
        method: "GET",
        path: "/stats/users/anonymous/actions",
        handler: function(req,reply) {
            var model = req.query
            reply.co(UsersStatsHandler.getAnonymousUserActions(model))
        },
        config: {
            validate: {
                query: periodSchema
            },
            auth: false,
            description: 'Get a list of all registered users.',
            tags: ['api']
        }
    }

]

module.exports.userStatsRoutes = userStatsRoutes