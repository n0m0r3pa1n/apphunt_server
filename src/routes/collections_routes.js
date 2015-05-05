var Joi = require('joi')
var Collections = require('../handlers/collections_handler')
var collectionsRoutes = [
    {
        method: "GET",
        path: "/collections",
        handler: function(req,reply) {
            var model = req.query
            reply.co({})
        },
        config: {
            validate: {
                query: {
                    userId: Joi.string().optional(),
                    name: Joi.string().optional()
                }
            },
            description: '',
            tags: ['api']
        }
    },
    {
        method: "POST",
        path: "/collections",
        handler: function(req,reply) {
            var model = req.payload
            console.log(model)
            reply.co({})
        },
        config: {
            validate: {
                payload: {
                    userId: Joi.string().required(),
                    name: Joi.string().required(),
                    description: Joi.string().optional(),
                    apps: Joi.array().min(0).items(Joi.string()).unique().required()
                }
            },
            description: '',
            tags: ['api']
        }
    }
]

module.exports.collectionsRoutes = collectionsRoutes