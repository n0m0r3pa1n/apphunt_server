var Joi = require('joi')
Joi.objectId = require('joi-objectid')

import * as FollowersHandler from '../handlers/followers_handler.js'

var routes = [
    {
        method: "GET",
        path: "/users/{userId}/followers",
        handler: function(req,reply) {
            var page = req.query.page === undefined  ? 0 : req.query.page
            var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize
            reply.co(FollowersHandler.getFollowers(req.params.userId, page, pageSize))
        },
        config: {
            validate: {
                query: {
                    page: Joi.number().integer().min(1).optional(),
                    pageSize: Joi.number().integer().min(1).optional()
                },
                params: {
                    userId: Joi.objectId().required()
                }
            },
            auth: false,
            description: 'Search users by query and login type',
            tags: ['api']
        }
    },
    {
        method: "GET",
        path: "/users/{userId}/following",
        handler: function(req,reply) {
            var page = req.query.page === undefined  ? 0 : req.query.page
            var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize
            reply.co(FollowersHandler.getFollowing(req.params.userId, page, pageSize))
        },
        config: {
            validate: {
                query: {
                    page: Joi.number().integer().min(1).optional(),
                    pageSize: Joi.number().integer().min(1).optional()
                },
                params: {
                    userId: Joi.objectId().required()
                }
            },
            auth: false,
            description: 'Search users by query and login type',
            tags: ['api']
        }
    },
    {
        method: "DELETE",
        path: "/users/{followingId}/followers",
        handler: function(req,reply) {
            reply.co(FollowersHandler.unfollowUser(req.params.followingId, req.payload.followerId))
        },
        config: {
            validate: {
                payload: {
                    followerId: Joi.objectId().required()
                },
                params: {
                    followingId: Joi.objectId().required()
                }
            },
            auth: false,
            description: 'Follow user',
            tags: ['api']
        }
    },
    {
        method: "POST",
        path: "/users/{followingId}/followers",
        handler: function(req,reply) {
            reply.co(FollowersHandler.followUser(req.params.followingId, req.payload.followerId))
        },
        config: {
            validate: {
                payload: {
                    followerId: Joi.objectId().required()
                },
                params: {
                    followingId: Joi.objectId().required()
                }
            },
            auth: false,
            description: 'Follow user',
            tags: ['api']
        }
    }
]

module.exports.followerRoutes = routes