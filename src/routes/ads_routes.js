var Joi = require('joi')
Joi.objectId = require('joi-objectid')
import * as AdsHandler from '../handlers/ads_handler.js'

export var adRoutes = [
    {
        method: "GET",
        path: "/ad",
        handler: function (req, reply) {
            reply.co(AdsHandler.getAd())
        },
        config: {
            validate: {},
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
    },
    {
        method: 'GET',
        path: '/ads/status',
        handler: function (req, reply) {
            reply.co(AdsHandler.shouldShowAd(req.query.userId, req.query.adLoadNumber))
        },
        config: {
            validate: {
                query: {
                    userId: Joi.objectId().required(),
                    adLoadNumber: Joi.number().optional()
                }
            },
            auth: false
        }
    },
    {
        method: 'GET',
        path: '/users/{userId}/ads/status',
        handler: function (req, reply) {
            reply.co(AdsHandler.getUserAdStatus(req.params.userId))
        },
        config: {
            validate: {
                params: {
                    userId: Joi.objectId().required()
                }
            },
            auth: false
        }
    }
]