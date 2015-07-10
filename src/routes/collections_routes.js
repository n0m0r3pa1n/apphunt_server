var Joi = require('joi')
var AppsCollection = require("../models").AppsCollection
var UsersCollection = require("../models").UsersCollection
var UsersCollectionsHandler = require('../handlers/users_collections_handler')
var COLLECTION_STATUSES = require('../config/config').COLLECTION_STATUSES
import * as AppsCollectionsHandler from '../handlers/apps_collections_handler.js'

var collectionsRoutes = [
    {
        method: "GET",
        path: "/app-collections",
        handler: function(req,reply) {
            var page = req.query.page === undefined  ? 0 : req.query.page
            var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize
            reply.co(AppsCollectionsHandler.getCollections(req.query.status, req.query.userId, req.query.sortBy, page, pageSize))
        },
        config: {
            validate: {
                query: {
                    page: Joi.number().integer().min(1).optional(),
                    pageSize: Joi.number().integer().min(1).optional(),
                    userId: Joi.string().optional(),
                    status: Joi.array().items(Joi.string()).valid([COLLECTION_STATUSES.DRAFT, COLLECTION_STATUSES.PUBLIC]).optional(),
                    sortBy: Joi.string().optional()
                }
            },
            auth: false,
            description: 'Get all apps collections.',
            tags: ['api']
        }
    },
    {
        method: "GET",
        path: "/app-collections/mine",
        handler: function(req,reply) {
            var page = req.query.page === undefined  ? 0 : req.query.page
            var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize
            reply.co(AppsCollectionsHandler.getCollectionsForUser(req.query.userId, page, pageSize))
        },
        config: {
            validate: {
                query: {
                    page: Joi.number().integer().min(1).optional(),
                    pageSize: Joi.number().integer().min(1).optional(),
                    userId: Joi.string().required()
                }
            },
            auth: false,
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
            auth: false,
            description: 'Get apps collection',
            tags: ['api']
        }
    },
    {
        method: "GET",
        path: "/app-collections/favourites",
        handler: function(req,reply) {
            var page = req.query.page === undefined  ? 0 : req.query.page
            var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize
            reply.co(AppsCollectionsHandler.getFavouriteCollections(req.query.userId, page, pageSize))
        },
        config: {
            validate: {
                query: {
                    page: Joi.number().integer().min(1).optional(),
                    pageSize: Joi.number().integer().min(1).optional(),
                    userId: Joi.string().required()
                }
            },
            auth: false,
            description: 'Get favourite apps for user.',
            tags: ['api']
        }
    },
    {
        method: "PUT",
        path:"/app-collections/{collectionId}/actions/favourite",
        handler: function(req, reply) {
            reply.co(AppsCollectionsHandler.favourite(req.params.collectionId, req.query.userId))
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
            auth: false,
            description: 'Favourite collection for user',
            tags: ['api']
        }
    },
    {
        method: "DELETE",
        path:"/app-collections/{collectionId}/actions/favourite",
        handler: function(req, reply) {
            reply.co(AppsCollectionsHandler.unfavourite(req.params.collectionId, req.query.userId))
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
            auth: false,
            description: 'Delete collections from favourites for user',
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
            auth: false,
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
            auth: false,
            description: 'Create new apps collection',
            tags: ['api']
        }
    },
    {
        method: "PUT",
        path: "/app-collections/{collectionId}",
        handler: function(req,reply) {
            var collectionId = req.params.collectionId
            var collection = req.payload.collection
            var userId = req.query.userId
            reply.co(AppsCollectionsHandler.update(collectionId, collection, userId))
        },
        config: {
            validate: {
                query: {
                    userId: Joi.string().required()
                },
                params: {
                    collectionId: Joi.string().required()
                },
                payload: {
                    collection: Joi.object({
                        name: Joi.string().required(),
                        picture: Joi.string().required(),
                        description: Joi.string().required(),
                        apps: Joi.array().items(Joi.string()).unique().required()}).unknown()
                }
            },
            auth: false,
            description: 'Update apps collection',
            tags: ['api']
        }
    },
    {
        method: "DELETE",
        path: "/app-collections",
        handler: function(req,reply) {
            reply.co(AppsCollectionsHandler.removeCollection(req.query.collectionId))
        },
        config: {
            validate: {
                query: {
                    collectionId: Joi.string().required()
                }
            },
            auth: false,
            description: 'Remove app collection',
            tags: ['api']
        }
    },
    {
        method: "DELETE",
        path: "/app-collections/apps",
        handler: function(req,reply) {
            reply.co(AppsCollectionsHandler.removeApp(req.query.collectionId, req.query.appId))
        },
        config: {
            validate: {
                query: {
                    collectionId: Joi.string().required(),
                    appId: Joi.string().required()
                }
            },
            auth: false,
            description: 'Remove app from a collection',
            tags: ['api']
        }
    },
    {
        method: "GET",
        path: "/user-collections",
        handler: function(req,reply) {
            var page = req.query.page === undefined  ? 0 : req.query.page
            var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize
            reply.co(UsersCollectionsHandler.getCollections(page, pageSize))
        },
        config: {
            validate: {
                query: {
                    page: Joi.number().integer().min(1).optional(),
                    pageSize: Joi.number().integer().min(1).optional()
                }
            },
            auth: false,
            description: 'Get all users collections.',
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
            auth: false,
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
            reply.co(UsersCollectionsHandler.addUsers(collectionId, users, req.payload.fromDate, req.payload.toDate))
        },
        config: {
            validate: {
                params: {
                    collectionId: Joi.string().required()
                },
                payload: {
                    users: Joi.array().min(1).items(Joi.string()).unique().required(),
                    fromDate: Joi.date().required(),
                    toDate: Joi.date().required()
                }
            },
            auth: false,
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
            auth: false,
            description: 'Get users collection',
            tags: ['api']
        }
    },
    {
        method: "GET",
        path: "/user-collections/search",
        handler: function(req,reply) {
            var page = req.query.page === undefined  ? 0 : req.query.page
            var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize
            var q = req.query.q;
            reply.co(UsersCollectionsHandler.search(q, page, pageSize))
        },
        config: {
            validate: {
                query: {
                    q: Joi.string().required(),
                    page: Joi.number().integer().min(1).optional(),
                    pageSize: Joi.number().integer().min(1).optional()
                }
            },
            auth: false,
            description: 'Search user collection by name.',
            tags: ['api']
        }
    },
    {
        method: "GET",
        path: "/user-collections/available",
        handler: function(req,reply) {
            reply.co(UsersCollectionsHandler.getAvailableCollectionsForUser(req.query.userId))
        },
        config: {
            validate: {
                query: {
                    userId: Joi.string().required()
                }
            },
            auth: false,
            description: 'Get collections in which the user does not exist.',
            tags: ['api']
        }
    },
    {
        method: "DELETE",
        path: "/user-collections/users",
        handler: function(req,reply) {
            reply.co(UsersCollectionsHandler.removeUser(req.query.collectionId, req.query.userDetailsId))
        },
        config: {
            validate: {
                query: {
                    collectionId: Joi.string().required(),
                    userDetailsId: Joi.string().required()
                }
            },
            auth: false,
            description: 'Remove user from a collection',
            tags: ['api']
        }
    },
    {
        method: "DELETE",
        path: "/user-collections",
        handler: function(req,reply) {
            reply.co(UsersCollectionsHandler.remove(req.query.collectionId))
        },
        config: {
            validate: {
                query: {
                    collectionId: Joi.string().required(),
                }
            },
            auth: false,
            description: 'Remove users collection',
            tags: ['api']
        }
    },
    {
        method: "GET",
        path: "/app-collections/banners",
        handler: function(req, reply) {
            reply.co(AppsCollectionsHandler.getBanners())
        },
        config: {
            auth: false,
            description: "Get collection banners",
            tags: ['api']
        }
    },
    {
        method: "POST",
        path: "/app-collections/banners",
        handler: function(req, reply) {
            reply.co(AppsCollectionsHandler.createBanner(req.payload.url))
        },
        config: {
            validate: {
                payload: {
                    url: Joi.string().required()
                }
            },
            auth: false,
            description: "Create collection banner",
            tags: ['api']
        }
    }
]

module.exports.collectionsRoutes = collectionsRoutes
