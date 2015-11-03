var Mongoose = require('mongoose')
var Hapi = require('hapi'),
    Inert           = require('inert'),
    Vision          = require('vision'),
    HapiSwagger     = require('hapi-swagger'),
    Pack = require('../package')

var Co = require('co')
var Routes = require('./routes').routes
var User = require('./models').User

import * as AuthenticationHandler from './handlers/authentication_handler.js'
import {EventEmitter} from './handlers/utils/event_emitter.js'
import * as History from './io/history_socket.js'
import {PRIVATE_KEY} from './config/config.js'

var STATUS_CODES = require('./config/config').STATUS_CODES
var JSExtensions = require('./utils/extension_utils')

var dbURI = process.env.MONGOLAB_URI || 'mongodb://localhost/apphunt'

Mongoose.connect(dbURI)
var serverPort = process.env.PORT || 8080

var swaggerOptions = {
    basePath: (dbURI.indexOf('localhost') > 0 ? ('http://localhost:' + serverPort ) : 'http://apphunt-dev.herokuapp.com') ,
    apiVersion: Pack.version
};

var server = new Hapi.Server()

server.connection({
    port: serverPort,
    labels: ['api', 'ws'],
    routes: {
        cors: true
    }
})

var apiServer = server.select('api')
var wsServer = server.select('ws')

History.setup(wsServer)

apiServer.register([
    Inert,
    Vision,
    {
        register: HapiSwagger,
        options: swaggerOptions
    }], function (err) {
});

apiServer.register(require('hapi-auth-jwt2'), function (err) {
    if (err) {
        console.log(err);
    }

    apiServer.auth.strategy('jwt', 'jwt', true,
        {
            key: PRIVATE_KEY, // Never Share your secret key
            validateFunc: AuthenticationHandler.validate       // validate function defined above
        });
})

apiServer.decorate('reply', 'co', function (handler) {
    this.response(Co(handler))
})

apiServer.ext('onRequest', function (request, reply) {
    var path = request.path
    var query = request.query
    path = path.replace('/v1','')
    request.setUrl(path);
    request.query = query
    return reply.continue();
});

apiServer.ext('onPreHandler', function (request, reply) {
    var userId = request.payload !== null ? request.payload.userId : request.query.userId

    if(userId) {
        var user = User.findOne({_id: userId}).exec()
        user.then(function(user) {
            if(user) {
                reply.continue();
            } else {
                reply().code(STATUS_CODES.BAD_REQUEST).takeover()
            }
        })
    } else {
        reply.continue()
    }
});

apiServer.ext('onPreResponse', function (request, reply) {

    var source = request.response.source
    if(source && source.statusCode) {
        var statusCode = source.statusCode
        reply(source).code(statusCode)
    } else {
        return reply.continue()
    }

});

apiServer.route(Routes)
server.start(function() {
    console.log('AppHunt is rocking your world at port %s', serverPort)
})

module.exports = server

