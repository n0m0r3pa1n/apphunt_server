var Joi = require('joi')

import * as TagsHandler from '../handlers/tags_handler.js'

export var tagRoutes = [
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