var Joi = require('joi')
Joi.objectId = require('joi-objectid')
import * as HistoryHandler from '../handlers/history_handler'

var historyRoutes = [
    {
        method: "GET",
        path: "/users/{userId}/history",
        handler: function(req,reply) {
            reply.co(HistoryHandler.getHistory(req.params.userId, req.query.date))
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
            description: "Get history for user.",
            tags: ['api']
        }
    },
    {
        method: "GET",
        path: "/users/{userId}/history/refresh",
        handler: function(req, reply) {
            //TODO: Remove route
            reply.co(HistoryHandler.postRefreshEvent(req.params.userId))
        },
        config: {
            validate: {
                params: {
                    userId: Joi.string().required()
                }
            },
            auth: false,
            description: "Make user id history refresh.",
            tags: ['api']
        }
    }
]

module.exports.historyRoutes = historyRoutes