var Joi = require('joi')
Joi.objectId = require('joi-objectid')
import * as ChatHandler from '../handlers/chat_handler.js'

var chatRoutes = [
    {
        method: "GET",
        path: "/chat/rooms/{roomId}/messages",
        handler: function(req,reply) {
            reply.co({})
        },
        config: {
            validate: {
                params: {
                    roomId: Joi.string().required()
                }
            },
            auth: false,
            description: "Get room message history.",
            tags: ['api']
        }
    },
    {
        method: "GET",
        path: "/chat/rooms/history",
        handler: function(req, reply) {
            reply.co(ChatHandler.getMessagesForRoom(req.query.name, req.query.date))
        },
        config: {
            validate: {
                query: {
                    name: Joi.string().required(),
                    date: Joi.date().required()
                }
            },
            auth: false,
            description: "Get room message history by name",
            tags: ['api']
        }
    },
    {
        method: "POST",
        path: "/chat/rooms",
        handler: function(req, reply) {
            reply.co(ChatHandler.createChatRoom(req.payload.name))
        },
        config: {
            validate: {
                payload: {
                    name: Joi.string().required()
                }
            },
            auth: false,
            description: "Create a new chat room",
            tags: ['api']
        }
    },
]

module.exports.chatRoutes = chatRoutes