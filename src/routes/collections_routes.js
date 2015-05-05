var Joi = require('joi')
var AppsCollectionsHandler = require('../handlers/apps_collections_handler')
var AppsCollection = require("../models").AppsCollection

var collectionsRoutes = [
    //{
    //    method: "GET",
    //    path: "/collections",
    //    handler: function(req,reply) {
    //        var model = req.query
    //        reply.co({})
    //    },
    //    config: {
    //        validate: {
    //            query: {
    //                userId: Joi.string().optional(),
    //                name: Joi.string().optional()
    //            }
    //        },
    //        description: '',
    //        tags: ['api']
    //    }
    //},
    {
        method: "POST",
        path: "/collections/apps",
        handler: function(req,reply) {
            var appsCollection = AppsCollection(req.payload)
            reply.co(AppsCollectionsHandler.create(appsCollection, req.payload.userId))
        },
        config: {
            validate: {
                payload: {
                    userId: Joi.string().required(),
                    name: Joi.string().required(),
                    description: Joi.string().optional(),
                    picture: Joi.string().optional(),
                    apps: Joi.array().min(0).items(Joi.string()).unique().required()
                }
            },
            description: 'Create new apps collection',
            tags: ['api']
        }
    }
]

module.exports.collectionsRoutes = collectionsRoutes