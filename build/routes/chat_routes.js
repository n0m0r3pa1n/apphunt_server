'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _handlersChat_handlerJs = require('../handlers/chat_handler.js');

var ChatHandler = _interopRequireWildcard(_handlersChat_handlerJs);

var Joi = require('joi');
Joi.objectId = require('joi-objectid');

var chatRoutes = [{
    method: 'GET',
    path: '/chat/rooms/{roomId}/messages',
    handler: function handler(req, reply) {
        reply.co({});
    },
    config: {
        validate: {
            params: {
                roomId: Joi.string().required()
            }
        },
        auth: false,
        description: 'Get room message history.',
        tags: ['api']
    }
}, {
    method: 'GET',
    path: '/chat/rooms/history',
    handler: function handler(req, reply) {
        reply.co(ChatHandler.getMessagesForRoom(req.query.name, req.query.date));
    },
    config: {
        validate: {
            query: {
                name: Joi.string().required(),
                date: Joi.date().required()
            }
        },
        auth: false,
        description: 'Get room message history by name',
        tags: ['api']
    }
}, {
    method: 'POST',
    path: '/chat/rooms',
    handler: function handler(req, reply) {
        reply.co(ChatHandler.createChatRoom(req.payload.name));
    },
    config: {
        validate: {
            payload: {
                name: Joi.string().required()
            }
        },
        auth: false,
        description: 'Create a new chat room',
        tags: ['api']
    }
}];

module.exports.chatRoutes = chatRoutes;