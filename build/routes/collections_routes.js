"use strict";

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

var _handlersApps_collections_handlerJs = require("../handlers/apps_collections_handler.js");

var AppsCollectionsHandler = _interopRequireWildcard(_handlersApps_collections_handlerJs);

var Joi = require("joi");
var AppsCollection = require("../models").AppsCollection;
var UsersCollection = require("../models").UsersCollection;
var UsersCollectionsHandler = require("../handlers/users_collections_handler");
var COLLECTION_STATUSES = require("../config/config").COLLECTION_STATUSES;

var collectionsRoutes = [{
    method: "GET",
    path: "/app-collections",
    handler: function handler(req, reply) {
        var page = req.query.page === undefined ? 0 : req.query.page;
        var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize;
        reply.co(AppsCollectionsHandler.getCollections(req.query.status, req.query.sortBy, page, pageSize));
    },
    config: {
        validate: {
            query: {
                page: Joi.number().integer().min(1).optional(),
                pageSize: Joi.number().integer().min(1).optional(),
                status: Joi.array().items(Joi.string()).valid([COLLECTION_STATUSES.DRAFT, COLLECTION_STATUSES.PUBLIC]).optional(),
                sortBy: Joi.string().optional()
            }
        },
        description: "Get all apps collections.",
        tags: ["api"]
    }
}, {
    method: "GET",
    path: "/app-collections/mine",
    handler: function handler(req, reply) {
        var page = req.query.page === undefined ? 0 : req.query.page;
        var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize;
        reply.co(AppsCollectionsHandler.getCollectionsForUser(req.query.userId, page, pageSize));
    },
    config: {
        validate: {
            query: {
                page: Joi.number().integer().min(1).optional(),
                pageSize: Joi.number().integer().min(1).optional(),
                userId: Joi.string().required()
            }
        },
        description: "Get all apps collections.",
        tags: ["api"]
    }
}, {
    method: "GET",
    path: "/app-collections/{collectionId}",
    handler: function handler(req, reply) {
        reply.co(AppsCollectionsHandler.get(req.params.collectionId, req.query.userId));
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
        description: "Get apps collection",
        tags: ["api"]
    }
}, {
    method: "GET",
    path: "/app-collections/favourites",
    handler: function handler(req, reply) {
        var page = req.query.page === undefined ? 0 : req.query.page;
        var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize;
        reply.co(AppsCollectionsHandler.getFavouriteCollections(req.query.userId, page, pageSize));
    },
    config: {
        validate: {
            query: {
                page: Joi.number().integer().min(1).optional(),
                pageSize: Joi.number().integer().min(1).optional(),
                userId: Joi.string().required()
            }
        },
        description: "Get favourite apps for user.",
        tags: ["api"]
    }
}, {
    method: "PUT",
    path: "/app-collections/{collectionId}/actions/favourite",
    handler: function handler(req, reply) {
        reply.co(AppsCollectionsHandler.favourite(req.params.collectionId, req.query.userId));
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
        description: "Get apps collection",
        tags: ["api"]
    }
}, {
    method: "GET",
    path: "/app-collections/search",
    handler: function handler(req, reply) {
        var page = req.query.page === undefined ? 0 : req.query.page;
        var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize;
        var userId = req.query.userId;
        var q = req.query.q;

        reply.co(AppsCollectionsHandler.search(q, page, pageSize, userId));
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
        description: "Search app collection by name. UserId is optional if you want to know if the user has voted for each app.",
        tags: ["api"]
    }
}, {
    method: "POST",
    path: "/app-collections",
    handler: function handler(req, reply) {
        var appsCollection = AppsCollection(req.payload);
        reply.co(AppsCollectionsHandler.create(appsCollection, req.payload.userId));
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
        description: "Create new apps collection",
        tags: ["api"]
    }
}, {
    method: "PUT",
    path: "/app-collections/{collectionId}",
    handler: function handler(req, reply) {
        var collectionId = req.params.collectionId;
        var apps = req.payload.apps;
        reply.co(AppsCollectionsHandler.addApps(collectionId, apps));
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
        description: "Add app(s) to collection",
        tags: ["api"]
    }
}, {
    method: "DELETE",
    path: "/app-collections",
    handler: function handler(req, reply) {
        reply.co(AppsCollectionsHandler.removeCollection(req.query.collectionId));
    },
    config: {
        validate: {
            query: {
                collectionId: Joi.string().required()
            }
        },
        description: "Remove app collection",
        tags: ["api"]
    }
}, {
    method: "DELETE",
    path: "/app-collections/apps",
    handler: function handler(req, reply) {
        reply.co(AppsCollectionsHandler.removeApp(req.query.collectionId, req.query.appId));
    },
    config: {
        validate: {
            query: {
                collectionId: Joi.string().required(),
                appId: Joi.string().required()
            }
        },
        description: "Remove app from a collection",
        tags: ["api"]
    }
}, {
    method: "GET",
    path: "/user-collections",
    handler: function handler(req, reply) {
        var page = req.query.page === undefined ? 0 : req.query.page;
        var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize;
        reply.co(UsersCollectionsHandler.getCollections(page, pageSize));
    },
    config: {
        validate: {
            query: {
                page: Joi.number().integer().min(1).optional(),
                pageSize: Joi.number().integer().min(1).optional()
            }
        },
        description: "Get all users collections.",
        tags: ["api"]
    }
}, {
    method: "POST",
    path: "/user-collections",
    handler: function handler(req, reply) {
        var usersCollection = UsersCollection(req.payload);
        reply.co(UsersCollectionsHandler.create(usersCollection, req.payload.userId));
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
        description: "Create new users collection",
        tags: ["api"]
    }
}, {
    method: "PUT",
    path: "/user-collections/{collectionId}",
    handler: function handler(req, reply) {
        var collectionId = req.params.collectionId;
        var users = req.payload.users;
        reply.co(UsersCollectionsHandler.addUsers(collectionId, users, req.payload.fromDate, req.payload.toDate));
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
        description: "Add user(s) to collection",
        tags: ["api"]
    }
}, {
    method: "GET",
    path: "/user-collections/{collectionId}",
    handler: function handler(req, reply) {
        reply.co(UsersCollectionsHandler.get(req.params.collectionId, req.query.userId));
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
        description: "Get users collection",
        tags: ["api"]
    }
}, {
    method: "GET",
    path: "/user-collections/search",
    handler: function handler(req, reply) {
        var page = req.query.page === undefined ? 0 : req.query.page;
        var pageSize = req.query.pageSize === undefined ? 0 : req.query.pageSize;
        var q = req.query.q;
        reply.co(UsersCollectionsHandler.search(q, page, pageSize));
    },
    config: {
        validate: {
            query: {
                q: Joi.string().required(),
                page: Joi.number().integer().min(1).optional(),
                pageSize: Joi.number().integer().min(1).optional()
            }
        },
        description: "Search user collection by name.",
        tags: ["api"]
    }
}, {
    method: "GET",
    path: "/user-collections/available",
    handler: function handler(req, reply) {
        reply.co(UsersCollectionsHandler.getAvailableCollectionsForUser(req.query.userId));
    },
    config: {
        validate: {
            query: {
                userId: Joi.string().required()
            }
        },
        description: "Get collections in which the user does not exist.",
        tags: ["api"]
    }
}, {
    method: "DELETE",
    path: "/user-collections/users",
    handler: function handler(req, reply) {
        reply.co(UsersCollectionsHandler.removeUser(req.query.collectionId, req.query.userDetailsId));
    },
    config: {
        validate: {
            query: {
                collectionId: Joi.string().required(),
                userDetailsId: Joi.string().required()
            }
        },
        description: "Remove user from a collection",
        tags: ["api"]
    }
}, {
    method: "DELETE",
    path: "/user-collections",
    handler: function handler(req, reply) {
        reply.co(UsersCollectionsHandler.remove(req.query.collectionId));
    },
    config: {
        validate: {
            query: {
                collectionId: Joi.string().required()
            }
        },
        description: "Remove users collection",
        tags: ["api"]
    }
}];

module.exports.collectionsRoutes = collectionsRoutes;