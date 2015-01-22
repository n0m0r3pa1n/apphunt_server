var AppsHandler = require('../handlers/apps_handler')
var App = require('../models').App
var Joi = require('joi')

var routes = [
    {
        method: "GET",
        path: "/apps",
        handler: function(req,reply) {
            reply.co(AppsHandler.getAll())
        }
    },
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
                    name: Joi.string().required(),
                    icon: Joi.string().required(),
                    url: Joi.string().required(),
                    package: Joi.string().required(),
                    userId: Joi.string().required(),
                    description: Joi.string().optional(),
                    categories: Joi.array().optional(),
                    isFree: Joi.boolean().optional(),
                    platform: Joi.string().optional()
                }
            }
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
        path: "/apps/{date}",
        handler: function(req,reply) {
            var page = req.query.page === undefined  ? 0 : req.query.page
            var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize
            var userId = req.query.userId
            var date = req.params.date
            reply.co(AppsHandler.getApps(date, page, pageSize, userId))
        },
        config: {
            validate: {
                query: {
                    page: Joi.number().integer().min(1).optional(),
                    pageSize: Joi.number().integer().min(1).optional(),
                    userId: Joi.string().optional()
                },
                params: {
                    date: Joi.string().required()
                }
            }
        }
    }
]

module.exports.appRoutes = routes