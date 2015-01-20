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
            var app = new App(req.payload);
            reply.co(AppsHandler.create(app, req.payload.userId))
        },
        config: {
            validate: {
                payload: {
                    name: Joi.string().required(),
                    icon: Joi.string().required(),
                    url: Joi.string().required(),
                    package: Joi.string().required(),
                    userId: Joi.string().required()
                }
            }
        }
    },
    {
        method: "POST",
        path: "/apps/{appId}/votes",
        handler: function(req,reply) {
            var app = new App(req.payload);
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
    }
]

module.exports.appRoutes = routes