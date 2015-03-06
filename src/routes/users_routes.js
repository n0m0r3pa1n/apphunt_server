var UsersHandler = require('../handlers/users_handler')
var User = require('../models').User
var loginTypes = require('../config').loginTypes
var _ = require("underscore")
var Joi = require('joi')

var routes = [
    {
        method: "GET",
        path: "/users",
        handler: function(req,reply) {
            reply.co(UsersHandler.get(req.query.email))
        },
        config: {
            validate: {
                query: {
                    email: Joi.string().optional()
                }
            },
            description: 'Get a list of all registered users.',
            tags: ['api']
        }
    },
    {
        method: "POST",
        path: "/users",
        handler: function(req,reply) {
            var user = new User(req.payload);
            var deviceNotificationId = req.payload.deviceNotificationId
            reply.co(UsersHandler.create(user, deviceNotificationId))
        },
        config: {
            validate: {
                payload: {
                    name: Joi.string().optional(),
                    username: Joi.string().optional(),
                    email: Joi.string().required(),
                    profilePicture: Joi.string().optional(),
                    deviceNotificationId: Joi.string().optional(),
                    loginType: Joi.array().items(Joi.string()).valid(_.values(loginTypes)).required(),
                    locale: Joi.string().optional(),
                    appVersion: Joi.string().optional()
                }
            },
            description: 'Create a user registration',
            tags: ['api']
        }
    }
]

module.exports.userRoutes = routes