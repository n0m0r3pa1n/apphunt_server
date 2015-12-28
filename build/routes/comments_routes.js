'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _handlersComments_handlerJs = require('../handlers/comments_handler.js');

var CommentsHandler = _interopRequireWildcard(_handlersComments_handlerJs);

var Comment = require('../models').Comment;
var Joi = require('joi');

var routes = [{
    method: "POST",
    path: "/comments",
    handler: function handler(req, reply) {
        var comment = new Comment(req.payload);
        reply.co(CommentsHandler.create(comment, req.payload.appId, req.payload.userId, req.payload.parentId, req.payload.mentionedUserId));
    },
    config: {
        validate: {
            payload: {
                appId: Joi.string().required(),
                userId: Joi.string().required(),
                text: Joi.string().required(),
                parentId: Joi.string().optional(),
                mentionedUserId: Joi.string().optional()
            }
        },
        auth: false,
        description: 'Create comment for app',
        tags: ['api']
    }
}, {
    method: "GET",
    path: "/comments/{appId}",
    handler: function handler(req, reply) {
        reply.co(CommentsHandler.get(req.params.appId, req.query.userId, req.query.page, req.query.pageSize));
    },
    config: {
        validate: {
            query: {
                page: Joi.number().integer().min(1).optional(),
                pageSize: Joi.number().integer().min(1).optional(),
                userId: Joi.string().optional()
            }
        },
        auth: false,
        description: 'Get comments for app',
        tags: ['api']
    }
}, {
    method: "DELETE",
    path: "/comments",
    handler: function handler(req, reply) {
        reply.co(CommentsHandler.deleteComment(req.query.commentId));
    },
    config: {
        validate: {
            query: {
                commentId: Joi.string().required()
            }
        },
        auth: false,
        description: 'Delete comment',
        tags: ['api']
    }
}];

module.exports.commentRoutes = routes;