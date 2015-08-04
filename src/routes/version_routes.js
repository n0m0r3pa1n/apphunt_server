var Joi = require('joi')
import * as VersionHandler from "../handlers/version_handler.js"
var versionRoutes = [
    {
        method: "GET",
        path: "/app/version",
        handler: function(req,reply) {
            reply.co(VersionHandler.getLatestVersionCode())
        },
        config: {
            auth: false,
            description: 'Get latest android app version code',
            tags: ['api']
        }
    }
]

module.exports.versionRoutes = versionRoutes