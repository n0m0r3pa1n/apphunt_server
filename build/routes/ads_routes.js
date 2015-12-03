'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _handlersAds_handlerJs = require('../handlers/ads_handler.js');

var AdsHandler = _interopRequireWildcard(_handlersAds_handlerJs);

var Joi = require('joi');

var adRoutes = [{
    method: 'GET',
    path: '/ad',
    handler: function handler(req, reply) {
        reply.co(AdsHandler.getAd());
    },
    config: {
        validate: {},
        auth: false
    }
}, {
    method: 'POST',
    path: '/ads',
    handler: function handler(req, reply) {
        reply.co(AdsHandler.createAd(req.payload));
    },
    config: {
        validate: {
            payload: {
                name: Joi.string().required(),
                picture: Joi.string().required(),
                link: Joi.string().required()
            }
        },
        auth: false
    }
}];
exports.adRoutes = adRoutes;