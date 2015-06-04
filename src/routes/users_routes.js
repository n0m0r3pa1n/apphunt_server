var UsersHandler = require('../handlers/users_handler')
var UserScoreHandler = require('../handlers/user_score_handler')
var User = require('../models').User
var loginTypes = require('../config/config').LOGIN_TYPES
var _ = require("underscore")
var Joi = require('joi')

var routes = [
    {
        method: "GET",
        path: "/users",
        handler: function(req,reply) {
            reply.co(UsersHandler.get(req.query.email, req.query.loginType))
        },
        config: {
            validate: {
                query: {
                    email: Joi.string().optional(),
                    loginType:  Joi.array().items(Joi.string()).valid(_.values(loginTypes)).optional(),

                }
            },
            description: 'Get a list of all registered users.',
            tags: ['api']
        }
    },
    {
        method: "GET",
        path: "/users/scores",
        handler: function(req,reply) {
            var fromDate = req.query.fromDate
            var toDate = req.query.toDate
            reply.co(UserScoreHandler.getUsersScore(fromDate, toDate))
        },
        config: {
            validate: {
                query: {
                    fromDate: Joi.date().required(),
                    toDate: Joi.date().required(),
                }
            },
            description: 'Get a list of users with their scores.',
            tags: ['api']
        }
    },
    {
        method: "POST",
        path: "/users",
        handler: function(req,reply) {
            var user = new User(req.payload);
            var notificationId = req.payload.notificationId
            reply.co(UsersHandler.create(user, notificationId))
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
            description: 'Create a user registration',
            tags: ['api']
        }
    },
    {
        method: "PUT",
        path: "/users/{userId}",
        handler: function(req,reply) {
            var userId = req.params.userId;
            var notificationId = req.payload.notificationId
            reply.co(UsersHandler.update(userId, notificationId))
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
            description: 'Update user notification id',
            tags: ['api']
        }
    }
]

module.exports.userRoutes = routes