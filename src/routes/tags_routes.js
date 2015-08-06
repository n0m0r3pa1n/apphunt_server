var Joi = require('joi')

import * as TagsHandler from '../handlers/tags_handler.js'

export var tagRoutes = [
    {
        method: "GET",
        path: "/tags/suggest",
        handler: function (req, reply) {
            reply.co(TagsHandler.getTagSuggestions(req.query.name))
        },
        config: {
            validate: {
                query: {
                    name: Joi.string().required()
                }
            },
            auth: false
        }
    },
    {
        method: "GET",
        path: "/tags",
        handler: function (req, reply) {
            reply.co(TagsHandler.getItemsForTag(req.query.names, req.query.userId))
        },
        config: {
            validate: {
                query: {
                    names: Joi.array().items(Joi.string()).required(),
                    userId: Joi.string().optional()
                }
            },
            auth: false
        }
    },
    {
        method: "GET",
        path: "/collections/tags",
        handler: function (req, reply) {
            reply.co(TagsHandler.getCollectionsForTags(req.query.names, req.query.userId))
        },
        config: {
            validate: {
                query: {
                    names: Joi.array().items(Joi.string()).required(),
                    userId: Joi.string().optional()
                }
            },
            auth: false
        }
    },
    {
        method: "GET",
        path: "/apps/tags",
        handler: function (req, reply) {
            reply.co(TagsHandler.getAppsForTags(req.query.names, req.query.userId))
        },
        config: {
            validate: {
                query: {
                    names: Joi.array().items(Joi.string()).required(),
                    userId: Joi.string().optional()
                }
            },
            auth: false
        }
    }
]