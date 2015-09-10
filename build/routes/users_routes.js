'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _handlersUsers_handlerJs = require('../handlers/users_handler.js');

var UsersHandler = _interopRequireWildcard(_handlersUsers_handlerJs);

var _handlersApps_handlerJs = require('../handlers/apps_handler.js');

var AppsHandler = _interopRequireWildcard(_handlersApps_handlerJs);

var _handlersApps_collections_handlerJs = require('../handlers/apps_collections_handler.js');

var AppsCollectionsHandler = _interopRequireWildcard(_handlersApps_collections_handlerJs);

var _ = require('underscore');
var Joi = require('joi');
Joi.objectId = require('joi-objectid');

var UserScoreHandler = require('../handlers/user_score_handler');
var CommentsHandler = require('../handlers/comments_handler');
var User = require('../models').User;
var loginTypes = require('../config/config').LOGIN_TYPES;

var routes = [{
    method: 'GET',
    path: '/users',
    handler: function handler(req, reply) {
        var page = req.query.page === undefined ? 0 : req.query.page;
        var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize;
        reply.co(UsersHandler.get(req.query.q, req.query.loginType, page, pageSize));
    },
    config: {
        validate: {
            query: {
                q: Joi.string().optional(),
                loginType: Joi.array().items(Joi.string()).valid(_.values(loginTypes)).optional(),
                page: Joi.number().integer().min(1).optional(),
                pageSize: Joi.number().integer().min(1).optional()
            }
        },
        auth: false,
        description: 'Search users by query and login type',
        tags: ['api']
    }
}, {
    method: 'GET',
    path: '/users/{userId}',
    handler: function handler(req, reply) {
        reply.co(UsersHandler.getUserProfile(req.params.userId, req.query.fromDate, req.query.toDate));
    },
    config: {
        validate: {
            params: {
                userId: Joi.string().required()
            },
            query: {
                fromDate: Joi.date().required(),
                toDate: Joi.date().required()
            }
        },
        auth: false,
        description: 'Get user by id.',
        tags: ['api']
    }
}, {
    method: 'GET',
    path: '/users/scores',
    handler: function handler(req, reply) {
        var fromDate = req.query.fromDate;
        var toDate = req.query.toDate;
        reply.co(UserScoreHandler.getUsersScore(fromDate, toDate));
    },
    config: {
        validate: {
            query: {
                fromDate: Joi.date().required(),
                toDate: Joi.date().required()
            }
        },
        auth: false,
        description: 'Get a list of users with their scores.',
        tags: ['api']
    }
}, {
    method: 'GET',
    path: '/users/{creatorId}/apps',
    handler: function handler(req, reply) {
        var query = req.query;
        var params = req.params;
        var page = req.query.page === undefined ? 0 : req.query.page;
        var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize;
        reply.co(AppsHandler.getAppsForUser(params.creatorId, query.userId, page, pageSize));
    },
    config: {
        validate: {
            query: {
                userId: Joi.objectId().optional(),
                page: Joi.number().integer().min(1).optional(),
                pageSize: Joi.number().integer().min(1).optional()
            },
            params: {
                creatorId: Joi.string().required()
            }
        },
        auth: false,
        description: 'Get available apps by date. UserId is optional if you want to know if the user has voted for each app.',
        tags: ['api']
    }
}, {
    method: 'GET',
    path: '/users/{creatorId}/comments',
    handler: function handler(req, reply) {
        reply.co(CommentsHandler.getCommentsForUser(req.params.creatorId, req.query.userId, req.query.page, req.query.pageSize));
    },
    config: {
        validate: {
            query: {
                page: Joi.number().integer().min(1).optional(),
                pageSize: Joi.number().integer().min(1).optional(),
                userId: Joi.string().optional()
            },
            params: {
                creatorId: Joi.string().required()
            }
        },
        auth: false,
        description: 'Get comments for user',
        tags: ['api']
    }
}, {
    method: 'GET',
    path: '/users/{creatorId}/collections',
    handler: function handler(req, reply) {
        var page = req.query.page === undefined ? 0 : req.query.page;
        var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize;
        reply.co(AppsCollectionsHandler.getCollections(req.params.creatorId, req.query.userId, page, pageSize));
    },
    config: {
        validate: {
            query: {
                page: Joi.number().integer().min(1).optional(),
                pageSize: Joi.number().integer().min(1).optional(),
                userId: Joi.string().optional()
            },
            params: {
                creatorId: Joi.string().required()
            }
        },
        auth: false,
        description: 'Get all apps collections.',
        tags: ['api']
    }
}, {
    method: 'GET',
    path: '/users/{favouritedBy}/favourite-collections',
    handler: function handler(req, reply) {
        var page = req.query.page === undefined ? 0 : req.query.page;
        var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize;
        reply.co(AppsCollectionsHandler.getFavouriteCollections(req.params.favouritedBy, req.query.userId, page, pageSize));
    },
    config: {
        validate: {
            query: {
                page: Joi.number().integer().min(1).optional(),
                pageSize: Joi.number().integer().min(1).optional(),
                userId: Joi.string().optional()
            },
            params: {
                favouritedBy: Joi.string().required()
            }
        },
        auth: false,
        description: 'Get favourite apps collections for user.',
        tags: ['api']
    }
}, {
    method: 'GET',
    path: '/users/{creatorId}/favourite-apps',
    handler: function handler(req, reply) {
        var page = req.query.page === undefined ? 0 : req.query.page;
        var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize;
        reply.co(AppsHandler.getFavouriteApps(req.params.creatorId, req.query.userId, page, pageSize));
    },
    config: {
        validate: {
            query: {
                page: Joi.number().integer().min(1).optional(),
                pageSize: Joi.number().integer().min(1).optional(),
                userId: Joi.string().optional()
            },
            params: {
                creatorId: Joi.string().required()
            }
        },
        auth: false,
        description: 'Get favourite apps for user.',
        tags: ['api']
    }
}, {
    method: 'POST',
    path: '/users',
    handler: function handler(req, reply) {
        var user = new User(req.payload);
        var notificationId = req.payload.notificationId;
        reply.co(UsersHandler.create(user, notificationId));
    },
    config: {
        validate: {
            payload: {
                name: Joi.string().optional(),
                username: Joi.string().optional(),
                email: Joi.string().required(),
                profilePicture: Joi.string().optional(),
                notificationId: Joi.string().optional(),
                loginType: Joi.array().items(Joi.string()).valid(_.values(loginTypes)).required(),
                locale: Joi.string().optional(),
                coverPicture: Joi.string().optional(),
                appVersion: Joi.string().optional(),
                following: Joi.array().items(Joi.string()).optional()
            }
        },
        auth: false,
        description: 'Create a user registration',
        tags: ['api']
    }
}, {
    method: 'PUT',
    path: '/users/{userId}',
    handler: function handler(req, reply) {
        var userId = req.params.userId;
        var notificationId = req.payload.notificationId;
        reply.co(UsersHandler.update(userId, notificationId));
    },
    config: {
        validate: {
            payload: Joi.object({
                notificationId: Joi.string().required()
            }).unknown(),
            params: {
                userId: Joi.string().required()
            }

        },
        auth: false,
        description: 'Update user notification id',
        tags: ['api']
    }
}];

module.exports.userRoutes = routes;