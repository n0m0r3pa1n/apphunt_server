'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _handlersNotifications_handlerJs = require('../handlers/notifications_handler.js');

var NotificationsHandler = _interopRequireWildcard(_handlersNotifications_handlerJs);

var Notification = require('../models').Notification;
var Joi = require('joi');

var routes = [{
    method: 'GET',
    path: '/notifications',
    handler: function handler(req, reply) {
        reply.co(NotificationsHandler.get(req.query.type));
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
}, {
    method: 'GET',
    path: '/notifications/types',
    handler: function handler(req, reply) {
        reply.co(NotificationsHandler.getNotificationTypes());
    },
    config: {
        auth: false,
        description: 'Get all notification types.',
        tags: ['api']
    }
}, {
    method: 'POST',
    path: '/notifications',
    handler: function handler(req, reply) {
        var notification = new Notification(req.payload);
        reply.co(NotificationsHandler.create(notification));
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
}, {
    method: 'POST',
    path: '/notifications/actions/send',
    handler: function handler(req, reply) {
        var message = req.payload.message;
        var type = req.payload.type;
        var title = req.payload.title;
        var users = req.payload.users;
        var image = req.payload.image;
        reply.co(NotificationsHandler.sendNotificationsToUsers(users, title, message, image, type));
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
}];

module.exports.notificationRoutes = routes;