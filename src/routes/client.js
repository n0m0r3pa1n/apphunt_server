var ClientsHandler = require('../handlers/clients_handler')
var Joi = require('joi')

var routes = [
    {
        method: 'POST',
        path: '/clients',
        handler: function (req, reply) {
            var username = req.payload.username
            var password = req.payload.password
            reply.co(ClientsHandler.create(username, password))
        },
        config: {
            validate: {
                payload: {
                    username: Joi.string().required(),
                    password: Joi.string().required()
                }
            }
        }
    },
    {
        method: "POST",
        path: '/clients/actions/login',
        handler: function (req, reply) {
            var username = req.payload.username
            var password = req.payload.password
            reply.co(ClientsHandler.getClientAppSpiceId(username, password))
        },
        config: {
            validate: {
                payload: {
                    username: Joi.string().required(),
                    password: Joi.string().required()
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/clients/{appSpiceId}',
        handler: function(req, reply) {
            var appSpiceId = req.params.appSpiceId
            reply.co(ClientsHandler.get(appSpiceId))
        },
        config: {
            validate: {
                params: {
                    appSpiceId: Joi.string().required()
                }
            }
        }
    }
]
module.exports.clientRoutes = routes