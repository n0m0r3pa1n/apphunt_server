"use strict";

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

var _handlersVersion_handlerJs = require("../handlers/version_handler.js");

var VersionHandler = _interopRequireWildcard(_handlersVersion_handlerJs);

var Joi = require('joi');

var versionRoutes = [{
    method: "GET",
    path: "/app/version",
    handler: function handler(req, reply) {
        reply.co(VersionHandler.getLatestVersionCode());
    },
    config: {
        auth: false,
        description: 'Get latest android app version code',
        tags: ['api']
    }
}, {
    method: "PUT",
    path: "/app/version",
    handler: function handler(req, reply) {
        reply.co(VersionHandler.updateLatestVersion(req.payload.versionCode));
    },
    config: {
        validate: {
            payload: {
                versionCode: Joi.number().integer().min(1).required()
            }
        },
        auth: false,
        description: 'Get latest android app version code',
        tags: ['api']
    }
}];

module.exports.versionRoutes = versionRoutes;