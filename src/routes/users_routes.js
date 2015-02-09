var UsersHandler = require('../handlers/users_handler')
var User = require('../models').User
var Joi = require('joi')

var routes = [
    {
        method: "GET",
        path: "/users",
        handler: function(req,reply) {
            reply.co(UsersHandler.getAll())
        },
        config: {
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
                    name: Joi.string().required(),
                    email: Joi.string().required(),
                    profilePicture: Joi.string().optional(),
                    advertisingId: Joi.string().optional(),
                    deviceNotificationId: Joi.string().optional(),
                    loginType: Joi.string().optional(),
                    locale: Joi.string().optional()
                }
            },
            description: 'Create a user registration',
            tags: ['api']
        }
    }
]

module.exports.userRoutes = routes