var VotesHandler = require('../handlers/votes_handler')
var Joi = require('joi')
Joi.objectId = require('joi-objectid')

var routes = [
    {
        method: "POST",
        path: "/apps/votes",
        handler: function(req,reply) {
            reply.co(VotesHandler.createAppVote(req.query.userId, req.query.appId))
        },
        config: {
            validate: {
                query: {
                    userId: Joi.objectId().required(),
                    appId: Joi.objectId().required()
                }
            },
            auth: false,
            description: 'Vote for an app',
            tags: ['api']
        }
    },
    {
        method: "DELETE",
        path: "/apps/votes",
        handler: function(req,reply) {
            reply.co(VotesHandler.deleteAppVote(req.query.userId, req.query.appId))
        },
        config: {
            validate: {
                query: {
                    userId: Joi.objectId().required(),
                    appId: Joi.objectId().required()
                }
            },
            auth: false,
            description: 'Downvote for an app',
            tags: ['api']
        }
    },
    {
        method: "POST",
        path: "/comments/votes",
        handler: function(req,reply) {
            reply.co(VotesHandler.createCommentVote(req.query.commentId, req.query.userId))
        },
        config: {
            validate: {
                query: {
                    userId: Joi.objectId().required(),
                    commentId: Joi.objectId().required()
                }
            },
            auth: false,
            description: 'Vote for a comment',
            tags: ['api']
        }
    },
    {
        method: "DELETE",
        path: "/comments/votes",
        handler: function(req,reply) {
            reply.co(VotesHandler.deleteCommentVote(req.query.userId, req.query.commentId))
        },
        config: {
            validate: {
                query: {
                    userId: Joi.objectId().required(),
                    commentId: Joi.objectId().required()
                }
            },
            auth: false,
            description: 'Downvote for a comment',
            tags: ['api']
        }
    },
    {
        method: "POST",
        path: "/app-collections/votes",
        handler: function(req,reply) {
            reply.co(VotesHandler.createCollectionVote(req.query.collectionId, req.query.userId))
        },
        config: {
            validate: {
                query: {
                    userId: Joi.objectId().required(),
                    collectionId: Joi.objectId().required()
                }
            },
            auth: false,
            description: 'Vote for a app collection',
            tags: ['api']
        }
    },
    {
        method: "DELETE",
        path: "/app-collections/votes",
        handler: function(req,reply) {
            reply.co(VotesHandler.deleteCollectionVote(req.query.collectionId, req.query.userId))
        },
        config: {
            validate: {
                query: {
                    userId: Joi.objectId().required(),
                    collectionId: Joi.objectId().required()
                }
            },
            auth: false,
            description: 'Vote for a app collection',
            tags: ['api']
        }
    }
]

module.exports.voteRoutes = routes