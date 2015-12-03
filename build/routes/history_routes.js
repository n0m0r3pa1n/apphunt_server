'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _handlersHistory_handler = require('../handlers/history_handler');

var HistoryHandler = _interopRequireWildcard(_handlersHistory_handler);

var Joi = require('joi');
Joi.objectId = require('joi-objectid');

var historyRoutes = [{
    method: 'GET',
    path: '/users/{userId}/history',
    handler: function handler(req, reply) {
        reply.co(HistoryHandler.getHistory(req.params.userId, req.query.date));
    },
    config: {
        validate: {
            query: {
                date: Joi.date().required()
            },
            params: {
                userId: Joi.string().required()
            }
        },
        auth: false,
        description: 'Get history for user.',
        tags: ['api']
    }
}, {
    method: 'GET',
    path: '/users/{userId}/history/refresh',
    handler: function handler(req, reply) {
        //TODO: Remove route
        reply.co(HistoryHandler.postRefreshEvent(req.params.userId));
    },
    config: {
        validate: {
            params: {
                userId: Joi.string().required()
            }
        },
        auth: false,
        description: 'Make user id history refresh.',
        tags: ['api']
    }
}];

module.exports.historyRoutes = historyRoutes;