var Joi = require('joi')
var AppsCollectionsHandler = require('../handlers/apps_collections_handler')
var AppsCollection = require("../models").AppsCollection

var collectionsRoutes = [
    {
        method: "GET",
        path:"/app-collections/{collectionId}",
        handler: function(req, reply) {
            reply.co(AppsCollectionsHandler.getCollection(req.params.collectionId, req.query.userId))
        },
        config: {
            validate: {
                params: {
                    collectionId: Joi.string().required()
                },
                query: {
                    userId: Joi.string().optional()
                }
            },
            description: 'Get apps collection',
            tags: ['api']
        }
    },
    {
        method: "POST",
        path: "/app-collections",
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
    },
    {
        method: "PUT",
        path: "/app-collections/{collectionId}",
        handler: function(req,reply) {
            var collectionId = req.params.collectionId
            var apps = req.payload.apps
            reply.co(AppsCollectionsHandler.addApps(collectionId, apps))
        },
        config: {
            validate: {
                params: {
                    collectionId: Joi.string().required()
                },
                payload: {
                    apps: Joi.array().min(1).items(Joi.string()).unique().required()
                }
            },
            description: 'Add app to collection',
            tags: ['api']
        }
    }
]

module.exports.collectionsRoutes = collectionsRoutes