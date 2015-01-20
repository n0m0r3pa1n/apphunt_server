var UsersHandler = require('../handlers/users_handler')
var User = require('../models').User
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
            var user = new User();
            user.name = req.payload.name;
            user.email = req.payload.email;

            reply.co(UsersHandler.create(user))
        },
        config: {
            validate: {
                payload: {
                    name: Joi.string().required(),
                    email: Joi.string().required()
                }
            }
        }
    }
]

module.exports.userRoutes = routes