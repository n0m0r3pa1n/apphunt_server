'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _handlersFollowers_handlerJs = require('../handlers/followers_handler.js');

var FollowersHandler = _interopRequireWildcard(_handlersFollowers_handlerJs);

var Joi = require('joi');
Joi.objectId = require('joi-objectid');

var routes = [{
    method: "GET",
    path: "/users/{profileId}/followers",
    handler: function handler(req, reply) {
        var page = req.query.page === undefined ? 0 : req.query.page;
        var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize;
        reply.co(FollowersHandler.getFollowers(req.params.profileId, req.query.userId, page, pageSize));
    },
    config: {
        validate: {
            query: {
                userId: Joi.objectId().optional(),
                page: Joi.number().integer().min(1).optional(),
                pageSize: Joi.number().integer().min(1).optional()
            },
            params: {
                profileId: Joi.objectId().required()
            }
        },
        auth: false,
        description: 'Get the followers for user profile id',
        tags: ['api']
    }
}, {
    method: "GET",
    path: "/users/{profileId}/following",
    handler: function handler(req, reply) {
        var page = req.query.page === undefined ? 0 : req.query.page;
        var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize;
        reply.co(FollowersHandler.getFollowing(req.params.profileId, req.query.userId, page, pageSize));
    },
    config: {
        validate: {
            query: {
                userId: Joi.objectId().optional(),
                page: Joi.number().integer().min(1).optional(),
                pageSize: Joi.number().integer().min(1).optional()
            },
            params: {
                profileId: Joi.objectId().required()
            }
        },
        auth: false,
        description: 'Get the following for user profile id',
        tags: ['api']
    }
}, {
    method: "DELETE",
    path: "/users/{followingId}/followers/{followerId}",
    handler: function handler(req, reply) {
        reply.co(FollowersHandler.unfollowUser(req.params.followingId, req.params.followerId));
    },
    config: {
        validate: {
            params: {
                followerId: Joi.objectId().required(),
                followingId: Joi.objectId().required()
            }
        },
        auth: false,
        description: 'Follow user',
        tags: ['api']
    }
}, {
    method: "POST",
    path: "/users/{userId}/followers",
    handler: function handler(req, reply) {
        reply.co(FollowersHandler.addFollowers(req.params.userId, req.payload.followerIds));
    },
    config: {
        validate: {
            params: {
                userId: Joi.objectId().required()
            },
            payload: {
                followerIds: Joi.array().items(Joi.string()).required()
            }
        },
        auth: false,
        description: 'Follow many users',
        tags: ['api']
    }
}, {
    method: "POST",
    path: "/users/{userId}/following",
    handler: function handler(req, reply) {
        reply.co(FollowersHandler.addFollowings(req.params.userId, req.payload.followingIds));
    },
    config: {
        validate: {
            params: {
                userId: Joi.objectId().required()
            },
            payload: {
                followingIds: Joi.array().items(Joi.string()).required()
            }
        },
        auth: false,
        description: 'Follow many users',
        tags: ['api']
    }
}, {
    method: "POST",
    path: "/users/{followingId}/followers/{followerId}",
    handler: function handler(req, reply) {
        reply.co(FollowersHandler.followUser(req.params.followingId, req.params.followerId));
    },
    config: {
        validate: {
            params: {
                followingId: Joi.objectId().required(),
                followerId: Joi.objectId().required()
            }
        },
        auth: false,
        description: 'Follow single user',
        tags: ['api']
    }
}];

module.exports.followerRoutes = routes;