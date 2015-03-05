var VotesHandler = require('../handlers/votes_handler')
var Joi = require('joi')

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
                    userId: Joi.string().required(),
                    appId: Joi.string().required()
                }
            },
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
                    userId: Joi.string().required(),
                    appId: Joi.string().required()
                }
            },
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
            reply.co(VotesHandler.deleteCommentVote(req.query.userId, req.query.commentId))
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

module.exports.voteRoutes = routes