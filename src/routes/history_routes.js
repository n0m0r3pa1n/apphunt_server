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
    }
]

module.exports.historyRoutes = historyRoutes