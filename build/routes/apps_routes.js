'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _handlersApps_handlerJs = require('../handlers/apps_handler.js');

var AppsHandler = _interopRequireWildcard(_handlersApps_handlerJs);

var App = require('../models').App;
var Joi = require('joi');
var _ = require('underscore');
var Config = require('../config/config');
var PLATFORMS_ENUM = Config.PLATFORMS;
var APP_STATUSES_FILTER_ENUM = Config.APP_STATUSES_FILTER;
var LOGIN_TYPES_FILTER = Config.LOGIN_TYPES_FILTER;
var USER_TYPES = Config.USER_TYPES;
var PLATFORMS = [PLATFORMS_ENUM.Android, PLATFORMS_ENUM.iOS];
var APP_STATUSES = [APP_STATUSES_FILTER_ENUM.WAITING, APP_STATUSES_FILTER_ENUM.APPROVED, APP_STATUSES_FILTER_ENUM.ALL];

var routes = [{
    method: 'GET',
    path: '/apps',
    handler: function handler(req, reply) {
        var page = req.query.page === undefined ? 0 : req.query.page;
        var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize;
        var appStatus = APP_STATUSES_FILTER_ENUM.APPROVED;
        if (typeof req.query.status !== 'undefined') {
            appStatus = req.query.status;
        }
        var userId = req.query.userId;
        var date = req.query.date;
        var toDate = req.query.toDate;
        var platform = req.query.platform;
        var query = req.query.query;
        var userType = req.query.userType;
        reply.co(AppsHandler.getApps(date, toDate, platform, appStatus, page, pageSize, userId, userType, query));
    },
    config: {
        validate: {
            query: {
                platform: Joi.array().items(Joi.string()).valid(PLATFORMS).required(),
                page: Joi.number().integer().min(1).optional(),
                pageSize: Joi.number().integer().min(1).optional(),
                userId: Joi.string().optional(),
                date: Joi.date().optional(),
                status: Joi.string().valid(APP_STATUSES).optional(),
                userType: Joi.string().valid(_.values(USER_TYPES)).optional(),
                toDate: Joi.date().optional(),
                query: Joi.string().optional()
            }
        },
        auth: false,
        description: 'Get available apps by date. UserId is optional if you want to know if the user has voted for each app.',
        tags: ['api']
    }
}, {
    method: 'GET',
    path: '/apps/search',
    handler: function handler(req, reply) {
        var page = req.query.page === undefined ? 0 : req.query.page;
        var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize;
        var userId = req.query.userId;
        var platform = req.query.platform;
        var status = req.query.status;
        var q = req.query.q;

        reply.co(AppsHandler.searchApps(q, platform, status, page, pageSize, userId));
    },
    config: {
        validate: {
            query: {
                q: Joi.string().required(),
                status: Joi.string().valid(APP_STATUSES).optional(),
                page: Joi.number().integer().min(1).optional(),
                pageSize: Joi.number().integer().min(1).optional(),
                userId: Joi.string().optional(),
                platform: Joi.array().items(Joi.string()).valid(PLATFORMS).required()
            }
        },
        auth: false,
        description: 'Get available apps by date. UserId is optional if you want to know if the user has voted for each app.',
        tags: ['api']
    }
}, {
    method: 'POST',
    path: '/apps',
    handler: function handler(req, reply) {
        var app = new App(req.payload);
        reply.co(AppsHandler.create(app, req.payload.tags, req.payload.userId));
    },
    config: {
        validate: {
            payload: {
                shortUrl: Joi.string().optional(),
                'package': Joi.string().required(),
                userId: Joi.string().required(),
                description: Joi.string().required(),
                tags: Joi.array().items(Joi.string()).optional(),
                platform: Joi.array().items(Joi.string()).valid(PLATFORMS).required()
            }
        },
        auth: false,
        description: 'Create new app',
        tags: ['api']
    }
}, {
    method: 'PUT',
    path: '/apps',
    handler: function handler(req, reply) {
        var app = new App(req.payload.app);
        reply.co(AppsHandler.update(app));
    },
    config: {
        validate: {
            payload: {
                app: Joi.object().required()
            }
        },
        auth: false,
        description: 'Update existing app',
        tags: ['api']
    }
}, {
    method: 'DELETE',
    path: '/apps',
    handler: function handler(req, reply) {
        reply.co(AppsHandler.deleteApp(req.query['package']));
    },
    config: {
        validate: {
            query: {
                'package': Joi.string().required()
            }
        },
        auth: false,
        description: 'Delete app',
        tags: ['api']
    }
}, {
    method: 'POST',
    path: '/apps/packages',
    handler: function handler(req, reply) {
        reply.co(AppsHandler.getAppsByPackages(req.payload.packages));
    },
    config: {
        validate: {
            payload: {
                packages: Joi.array().items(Joi.string()).required()
            }
        },
        auth: false,
        description: 'Get apps by packages',
        tags: ['api']
    }
}, {
    method: 'GET',
    path: '/apps/{appId}',
    handler: function handler(req, reply) {
        reply.co(AppsHandler.getApp(req.params.appId, req.query.userId));
    },
    config: {
        validate: {
            params: {
                appId: Joi.string().required()
            },
            query: {
                userId: Joi.string().optional()
            }
        },
        auth: false,
        description: 'Get apps submissions for user',
        tags: ['api']
    }
}, {
    method: 'GET',
    path: '/apps/random',
    handler: function handler(req, reply) {
        reply.co(AppsHandler.getRandomApp(req.query.userId));
    },
    config: {
        validate: {
            query: {
                userId: Joi.string().optional()
            }
        },
        auth: false,
        description: 'Get random app',
        tags: ['api']
    }
}, {
    method: 'POST',
    path: '/apps/actions/filter',
    handler: function handler(req, reply) {
        reply.co(AppsHandler.filterApps(req.payload.packages, req.payload.platform));
    },
    config: {
        validate: {
            payload: {
                platform: Joi.string().valid(PLATFORMS).required(),
                packages: Joi.array().items(Joi.string()).required()
            }
        },
        auth: false
    }
}, {
    method: 'POST',
    path: '/apps/{appPackage}/status',
    handler: function handler(req, reply) {
        reply.co(AppsHandler.changeAppStatus(req.params.appPackage, req.payload.status));
    },
    config: {
        validate: {
            payload: {
                status: Joi.string().valid([APP_STATUSES_FILTER_ENUM.WAITING, APP_STATUSES_FILTER_ENUM.APPROVED, APP_STATUSES_FILTER_ENUM.REJECTED]).required()
            },
            params: {
                appPackage: Joi.string().required()
            }
        },
        auth: false
    }
}, {
    method: 'PUT',
    path: '/apps/{appId}/actions/favourite',
    handler: function handler(req, reply) {
        reply.co(AppsHandler.favourite(req.params.appId, req.query.userId));
    },
    config: {
        validate: {
            params: {
                appId: Joi.string().required()
            },
            query: {
                userId: Joi.string().optional()
            }
        },
        auth: false,
        description: 'Favourite app for user',
        tags: ['api']
    }
}, {
    method: 'DELETE',
    path: '/apps/{appId}/actions/favourite',
    handler: function handler(req, reply) {
        reply.co(AppsHandler.unfavourite(req.params.appId, req.query.userId));
    },
    config: {
        validate: {
            params: {
                appId: Joi.string().required()
            },
            query: {
                userId: Joi.string().optional()
            }
        },
        auth: false,
        description: 'Delete app from favourites for user',
        tags: ['api']
    }
}];

module.exports.appRoutes = routes;