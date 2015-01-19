var UsersHandler = require('../handlers/users_handler')
var Joi = require('joi')

var routes = [
    {
        method: "GET",
        path: "/users",
        handler: function(req,reply) {
            reply.co(UsersHandler.getAll())
        }
    },
    {
        method: "POST",
        path: "/users",
        handler: function(req,reply) {
            reply.co(UsersHandler.create(req.payload.advertisingId))
        },
        config: {
            validate: {
                payload: {
                    advertisingId: Joi.string().required()
                }
            }
        }
    }
]

module.exports.userRoutes = routes