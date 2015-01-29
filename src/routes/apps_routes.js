var AppsHandler = require('../handlers/apps_handler')
var App = require('../models').App
var Joi = require('joi')
var platformsEnum = require('../config').platforms
var appStatusesFilterEnum = require('../config').appStatusesFilter
var platforms = [platformsEnum.Android, platformsEnum.iOS]
var appStatuses = [appStatusesFilterEnum.WAITING, appStatusesFilterEnum.APPROVED, appStatusesFilterEnum.ALL]

var routes = [
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
                    description: Joi.string().optional(),
                    platform: Joi.array().includes(Joi.string()).valid(platforms).required()
                }
            },
            description: 'Create new app',
            tags: ['api']
        }
    },
    {
        method: "POST",
        path: "/apps/votes",
        handler: function(req,reply) {
            reply.co(AppsHandler.createVote(req.query.userId, req.query.appId))
        },
        config: {
            validate: {
                query: {
                    userId: Joi.string().required(),
                    appId: Joi.string().required()
                }
            },
            description: 'Vote for an app',
            tags: ['api']
        }
    },
    {
        method: "DELETE",
        path: "/apps/votes",
        handler: function(req,reply) {
            reply.co(AppsHandler.deleteVote(req.query.userId, req.query.appId))
        },
        config: {
            validate: {
                query: {
                    userId: Joi.string().required(),
                    appId: Joi.string().required()
                }
            },
            description: 'Downvote for an app',
            tags: ['api']
        }
    },
    {
        method: "GET",
        path: "/apps",
        handler: function(req,reply) {
            var page = req.query.page === undefined  ? 0 : req.query.page
            var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize
            var appStatus = req.query.status === undefined ? appStatuses.APPROVED : req.query.status
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
                    status: Joi.array().includes(Joi.string()).valid(appStatuses).optional(),
                    platform: Joi.array().includes(Joi.string()).valid(platforms).required()
                }
            },
            description: 'Get available apps by date. UserId is optional if you want to know if the user has voted for each app.',
            tags: ['api']
        }
    },
    {
        method: "POST",
        path: "/apps/actions/filter",
        handler: function(req, reply) {

            reply.co(AppsHandler.filterApps(req.payload.packages))
        } ,
        config: {
            validate: {
                payload: {
                    packages: Joi.array().includes(Joi.string()).required()
                }
            }
        }
    }


]

module.exports.appRoutes = routes