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
        path: "/apps/tags",
        handler: function (req, reply) {
            reply.co(TagsHandler.getAppsForTags(req.query.names))
        },
        config: {
            validate: {
                query: {
                    names: Joi.array().items(Joi.string()).required()
                }
            },
            auth: false
        }
    }
]