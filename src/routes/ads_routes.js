var Joi = require('joi')

import * as AdsHandler from '../handlers/ads_handler.js'

export var adRoutes = [
    {
        method: "GET",
        path: "/ad",
        handler: function (req, reply) {
            reply.co(AdsHandler.getAd())
        },
        config: {
            validate: {
            },
            auth: false
        }
    },
    {
        method: "POST",
        path: "/ads",
        handler: function (req, reply) {
            reply.co(AdsHandler.createAd(req.payload))
        },
        config: {
            validate: {
                payload: {
                    name: Joi.string().required(),
                    picture: Joi.string().required(),
                    link: Joi.string().required(),
                }
            },
            auth: false
        }
    }
]