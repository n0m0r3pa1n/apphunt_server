var CommentsHandler = require('../handlers/comments_handler')
var Comment = require('../models').Comment
var Joi = require('joi')

var routes = [
    {
        method: "POST",
        path: "/comments",
        handler: function(req, reply) {
            var comment = new Comment(req.payload)
            reply.co(CommentsHandler.create(comment, req.payload.appId, req.payload.userId, req.payload.parentId))
        },
        config: {
            validate: {
                payload: {
                    appId: Joi.string().required(),
                    userId: Joi.string().required(),
                    text: Joi.string().required(),
                    parentId: Joi.string().optional()
                }
            },
            description: 'Create comment for app',
            tags: ['api']
        }
    },
    {
        method: "GET",
        path: "/comments/{appId}",
        handler: function(req, reply) {
            reply.co(CommentsHandler.get(req.params.appId, req.query.userId, req.query.page, req.query.pageSize))
        },
        config: {
            validate: {
                query: {
                    page: Joi.number().integer().min(1).optional(),
                    pageSize: Joi.number().integer().min(1).optional(),
                    userId: Joi.string().required()
                }
            },
            description: 'Get comments for app',
            tags: ['api']
        }
    },
    {
        method: "POST",
        path: "/comments/votes",
        handler: function(req,reply) {
            reply.co(CommentsHandler.createVote(req.query.commentId, req.query.userId))
        },
        config: {
            validate: {
                query: {
                    userId: Joi.string().required(),
                    commentId: Joi.string().required()
                }
            },
            description: 'Vote for a comment',
            tags: ['api']
        }
    },
    {
        method: "DELETE",
        path: "/comments/votes",
        handler: function(req,reply) {
            reply.co(CommentsHandler.deleteVote(req.query.userId, req.query.commentId))
        },
        config: {
            validate: {
                query: {
                    userId: Joi.string().required(),
                    commentId: Joi.string().required()
                }
            },
            description: 'Downvote for a comment',
            tags: ['api']
        }
    }
]

module.exports.commentRoutes = routes