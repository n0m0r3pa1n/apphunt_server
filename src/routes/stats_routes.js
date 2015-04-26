var Joi = require('joi')
var UsersStatsHandler = require('../handlers/stats/users_stats_handler')
var userStatsRoutes = [
    {
        method: "GET",
        path: "/stats/users",
        handler: function(req,reply) {
            var model = req.query
            reply.co(UsersStatsHandler.getAllUsers(model.username, model.loginType, model.page, model.pageSize))
        },
        config: {
            validate: {
                query: {
                    username: Joi.string().optional(),
                    loginType: Joi.string().optional(),
                    page: Joi.number().optional(),
                    pageSize: Joi.number().optional()
                }
            },
            description: 'Get a list of all registered users.',
            tags: ['api']
        }
    }
]

module.exports.userStatsRoutes = userStatsRoutes