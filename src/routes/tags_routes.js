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
        path: "/app-collections/tags",
        handler: function (req, reply) {
            var page = req.query.page === undefined  ? 0 : req.query.page
            var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize
            reply.co(TagsHandler.getCollectionsForTags(req.query.names, req.query.userId, page, pageSize))
        },
        config: {
            validate: {
                query: {
                    names: Joi.array().items(Joi.string()).required(),
                    page: Joi.number().integer().min(1).optional(),
                    pageSize: Joi.number().integer().min(1).optional(),
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
            var page = req.query.page === undefined  ? 0 : req.query.page
            var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize
            reply.co(TagsHandler.getAppsForTags(req.query.names, req.query.userId, page, pageSize))
        },
        config: {
            validate: {
                query: {
                    names: Joi.array().items(Joi.string()).required(),
                    page: Joi.number().integer().min(1).optional(),
                    pageSize: Joi.number().integer().min(1).optional(),
                    userId: Joi.string().optional()
                }
            },
            auth: false
        }
    }
]