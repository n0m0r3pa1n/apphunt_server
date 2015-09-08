import * as NotificationsHandler from "../handlers/notifications_handler.js"
var Notification = require('../models').Notification
var Joi = require('joi')

var routes = [
    {
        method: "GET",
        path: "/notifications",
        handler: function(req,reply) {
            reply.co(NotificationsHandler.get(req.query.type))
        },
        config: {
            validate: {
                query: {
                    type: Joi.string().required()
                }
            },
            auth: false,
            description: 'Get all available notifications.',
            tags: ['api']
        }
    },
    {
        method: "GET",
        path: "/notifications/types",
        handler: function(req,reply) {
            reply.co(NotificationsHandler.getNotificationTypes())
        },
        config: {
            auth: false,
            description: 'Get all notification types.',
            tags: ['api']
        }
    },
    {
        method: "POST",
        path: "/notifications",
        handler: function(req,reply) {
            var notification = new Notification(req.payload);
            reply.co(NotificationsHandler.create(notification))
        },
        config: {
            validate: {
                payload: {
                    message: Joi.string().required(),
                    type: Joi.string().required(),
                    title: Joi.string().required(),
                    sendTime: Joi.date().optional()
                }
            },
            auth: false,
            description: 'Create a new notification to be send to devices.',
            tags: ['api']
        }
    },
    {
        method: "POST",
        path: "/notifications/actions/send",
        handler: function(req,reply) {
            let message = req.payload.message
            let type = req.payload.type
            let title = req.payload.title
            let users = req.payload.users
            let image = req.payload.image
            reply.co(NotificationsHandler.sendNotificationsToUsers(users, title, message, image, type))
        },
        config: {
            validate: {
                payload: {
                    message: Joi.string().required(),
                    type: Joi.string().required(),
                    title: Joi.string().required(),
                    image: Joi.string().allow('').required(),
                    users: Joi.array().items(Joi.string()).required()
                }
            },
            auth: false,
            description: 'Create a new notification to be send to devices.',
            tags: ['api']
        }
    }

]

module.exports.notificationRoutes = routes
