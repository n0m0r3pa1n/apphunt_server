var AppsHandler = require('../handlers/apps_handler')
var UsersHandler = require('../handlers/users_handler')
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

            reply.co(AppsHandler.create(app, req.payload.email))
        },
        config: {
            validate: {
                payload: {
                    title: Joi.string().required(),
                    icon: Joi.string().required(),
                    url: Joi.string().required(),
                    package: Joi.string().required(),
                    email: Joi.string().required()
                }
            }
        }
    }
]

module.exports.appRoutes = routes