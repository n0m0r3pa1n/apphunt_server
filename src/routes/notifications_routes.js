var NotificationsHandler = require('../handlers/notifications_handler')
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

]

module.exports.notificationRoutes = routes
