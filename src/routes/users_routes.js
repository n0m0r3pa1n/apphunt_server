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
			reply.co(UsersHandler.get(req.query.email, req.query.loginType))
		},
		config: {
			validate: {
				query: {
					email: Joi.string().optional(),
					loginType:  Joi.array().items(Joi.string()).valid(_.values(loginTypes)).optional()
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
					appVersion: Joi.string().optional(),
					following: Joi.array().items(Joi.string()).optional()
				}
			},
			description: 'Create a user registration',
			tags: ['api']
		}
	}
]

module.exports.userRoutes = routes