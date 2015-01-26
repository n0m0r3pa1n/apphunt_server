var AppsHandler = require('../handlers/apps_handler')
var App = require('../models').App
var Joi = require('joi')
var platformsEnum = require('../config').platforms
var platforms = [platformsEnum.Android, platformsEnum.iOS]

var routes = [
    {
        method: "POST",
        path: "/apps",
        handler: function(req,reply) {
            var categories = req.payload.categories;
            var app = new App(req.payload);

            reply.co(AppsHandler.create(app, req.payload.userId, categories))
        },
        config: {
            validate: {
                payload: {
                    name: Joi.string().optional(),
                    icon: Joi.string().optional(),
                    url: Joi.string().optional(),
                    shortUrl: Joi.string().optional(),
                    package: Joi.string().required(),
                    userId: Joi.string().required(),
                    description: Joi.string().required(),
                    categories: Joi.array().includes(Joi.string()).optional(),
                    isFree: Joi.boolean().optional(),
                    platform: Joi.array().includes(Joi.string()).valid(platforms).required()
                }
            },
            description: 'Get all apps',
            tags: ['api']
        }
    },
    {
        method: "POST",
        path: "/apps/{appId}/votes",
        handler: function(req,reply) {
            reply.co(AppsHandler.createVote(req.payload.userId, req.params.appId))
        },
        config: {
            validate: {
                payload: {
                    userId: Joi.string().required()
                },
                params: {
                    appId: Joi.string().required()
                }
            }
        }
    },
    {
        method: "DELETE",
        path: "/apps/{appId}/votes",
        handler: function(req,reply) {
            reply.co(AppsHandler.deleteVote(req.payload.userId, req.params.appId))
        },
        config: {
            validate: {
                payload: {
                    userId: Joi.string().required()
                },
                params: {
                    appId: Joi.string().required()
                }
            }
        }
    },
    {
        method: "GET",
        path: "/apps",
        handler: function(req,reply) {
            var page = req.query.page === undefined  ? 0 : req.query.page
            var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize
            var userId = req.query.userId
            var date = req.query.date
            var platform = req.query.platform
            reply.co(AppsHandler.getApps(date, platform, page, pageSize, userId))
        },
        config: {
            validate: {
                query: {
                    page: Joi.number().integer().min(1).optional(),
                    pageSize: Joi.number().integer().min(1).optional(),
                    userId: Joi.string().optional(),
                    date: Joi.date().optional(),
                    platform: Joi.array().includes(Joi.string()).valid(platforms).required()
                }
            },
            description: 'Get apps by date',
            tags: ['api']
        }
    }
]

module.exports.appRoutes = routes