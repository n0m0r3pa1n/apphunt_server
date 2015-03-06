var AppsHandler = require('../handlers/apps_handler')
var App = require('../models').App
var Joi = require('joi')
var platformsEnum = require('../config').platforms
var appStatusesFilterEnum = require('../config').appStatusesFilter
var platforms = [platformsEnum.Android, platformsEnum.iOS]
var appStatuses = [appStatusesFilterEnum.WAITING, appStatusesFilterEnum.APPROVED, appStatusesFilterEnum.ALL]


var routes = [
    {
        method: "GET",
        path: "/apps",
        handler: function(req,reply) {
            var page = req.query.page === undefined  ? 0 : req.query.page
            var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize
            var appStatus = appStatusesFilterEnum.APPROVED
            if(typeof req.query.status !== 'undefined') {
                appStatus = req.query.status
            }
            var userId = req.query.userId
            var date = req.query.date
            var platform = req.query.platform
            reply.co(AppsHandler.getApps(date, platform, appStatus, page, pageSize, userId))
        },
        config: {
            validate: {
                query: {
                    page: Joi.number().integer().min(1).optional(),
                    pageSize: Joi.number().integer().min(1).optional(),
                    userId: Joi.string().optional(),
                    date: Joi.date().optional(),
                    status: Joi.string().valid(appStatuses).optional(),
                    platform: Joi.array().items(Joi.string()).valid(platforms).required()
                }
            },
            description: 'Get available apps by date. UserId is optional if you want to know if the user has voted for each app.',
            tags: ['api']
        }
    },
    {
        method: "POST",
        path: "/apps",
        handler: function(req,reply) {
            var app = new App(req.payload);

            reply.co(AppsHandler.create(app, req.payload.userId))
        },
        config: {
            validate: {
                payload: {
                    shortUrl: Joi.string().optional(),
                    package: Joi.string().required(),
                    userId: Joi.string().required(),
                    description: Joi.string().required(),
                    platform: Joi.array().items(Joi.string()).valid(platforms).required()
                }
            },
            description: 'Create new app',
            tags: ['api']
        }
    },
    {
        method: "PUT",
        path: "/apps",
        handler: function(req,reply) {
            var app = new App(req.payload.app);
            reply.co(AppsHandler.update(app))
        },
        config: {
            validate: {
                payload: {
                    app: Joi.object().required()
                }
            },
            description: 'Create new app',
            tags: ['api']
        }
    },
    {
      method: "DELETE",
        path:"/apps",
        handler: function(req, reply) {
            reply.co(AppsHandler.deleteApp(req.query.package))
        },
        config: {
            validate: {
                query: {
                    package: Joi.string().required()
                }
            },
            description: 'Delete app',
            tags: ['api']
        }
    },
    {
        method: "GET",
        path:"/apps/{appId}",
        handler: function(req, reply) {
            reply.co(AppsHandler.getApp(req.params.appId, req.query.userId))
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
            description: 'Get apps submissions for user',
            tags: ['api']
        }
    },
    {
        method: "POST",
        path: "/apps/actions/filter",
        handler: function(req, reply) {
            reply.co(AppsHandler.filterApps(req.payload.packages, req.payload.platform))
        } ,
        config: {
            validate: {
                payload: {
                    platform: Joi.string().valid(platforms).required(),
                    packages: Joi.array().items(Joi.string()).required()
                }
            }
        }
    }


]

module.exports.appRoutes = routes