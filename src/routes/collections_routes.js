var Joi = require('joi')
var AppsCollection = require("../models").AppsCollection
var UsersCollection = require("../models").UsersCollection
var AppsCollectionsHandler = require('../handlers/apps_collections_handler')
var UsersCollectionsHandler = require('../handlers/users_collections_handler')

var collectionsRoutes = [
    {
        method: "GET",
        path: "/app-collections",
        handler: function(req,reply) {
            var page = req.query.page === undefined  ? 0 : req.query.page
            var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize
            reply.co(AppsCollectionsHandler.getCollections(page, pageSize))
        },
        config: {
            validate: {
                query: {
                    page: Joi.number().integer().min(1).optional(),
                    pageSize: Joi.number().integer().min(1).optional(),
                }
            },
            description: 'Get all apps collections.',
            tags: ['api']
        }
    },
    {
        method: "GET",
        path:"/app-collections/{collectionId}",
        handler: function(req, reply) {
            reply.co(AppsCollectionsHandler.get(req.params.collectionId, req.query.userId))
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
        method: "GET",
        path: "/app-collections/search",
        handler: function(req,reply) {
            var page = req.query.page === undefined  ? 0 : req.query.page
            var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize
            var userId = req.query.userId
            var q = req.query.q;

            reply.co(AppsCollectionsHandler.search(q, page, pageSize, userId))
        },
        config: {
            validate: {
                query: {
                    q: Joi.string().required(),
                    page: Joi.number().integer().min(1).optional(),
                    pageSize: Joi.number().integer().min(1).optional(),
                    userId: Joi.string().optional()
                }
            },
            description: 'Search app collection by name. UserId is optional if you want to know if the user has voted for each app.',
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
                    picture: Joi.string().optional()
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
            description: 'Add app(s) to collection',
            tags: ['api']
        }
    },
    {
        method: "POST",
        path: "/user-collections",
        handler: function(req,reply) {
            var usersCollection = UsersCollection(req.payload)
            reply.co(UsersCollectionsHandler.create(usersCollection, req.payload.userId))
        },
        config: {
            validate: {
                payload: {
                    userId: Joi.string().required(),
                    name: Joi.string().required(),
                    description: Joi.string().optional(),
                    picture: Joi.string().optional()
                }
            },
            description: 'Create new users collection',
            tags: ['api']
        }
    },
    {
        method: "PUT",
        path: "/user-collections/{collectionId}",
        handler: function(req,reply) {
            var collectionId = req.params.collectionId
            var users = req.payload.users
            reply.co(UsersCollectionsHandler.addUsers(collectionId, users))
        },
        config: {
            validate: {
                params: {
                    collectionId: Joi.string().required()
                },
                payload: {
                    users: Joi.array().min(1).items(Joi.string()).unique().required()
                }
            },
            description: 'Add user(s) to collection',
            tags: ['api']
        }
    },
    {
        method: "GET",
        path:"/user-collections/{collectionId}",
        handler: function(req, reply) {
            reply.co(UsersCollectionsHandler.get(req.params.collectionId, req.query.userId))
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
            description: 'Get users collection',
            tags: ['api']
        }
    }
]

module.exports.collectionsRoutes = collectionsRoutes
