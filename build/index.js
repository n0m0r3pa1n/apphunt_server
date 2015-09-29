'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _handlersAuthentication_handlerJs = require('./handlers/authentication_handler.js');

var AuthenticationHandler = _interopRequireWildcard(_handlersAuthentication_handlerJs);

var _handlersUtilsEvent_emitterJs = require('./handlers/utils/event_emitter.js');

var _ioHistory_socketJs = require('./io/history_socket.js');

var History = _interopRequireWildcard(_ioHistory_socketJs);

var _configConfigJs = require('./config/config.js');

var Mongoose = require('mongoose');
var Hapi = require('hapi'),
    Inert = require('inert'),
    Vision = require('vision'),
    HapiSwagger = require('hapi-swagger'),
    Pack = require('../package');

var Co = require('co');
var Routes = require('./routes').routes;
var User = require('./models').User;

var STATUS_CODES = require('./config/config').STATUS_CODES;
var JSExtensions = require('./utils/extension_utils');

var dbURI = process.env.MONGOLAB_URI || 'mongodb://localhost/apphunt';

Mongoose.connect(dbURI);
var serverPort = process.env.PORT || 8080;

var swaggerOptions = {
    basePath: dbURI.indexOf('localhost') > 0 ? 'http://localhost:' + serverPort : 'http://apphunt-dev.herokuapp.com',
    apiVersion: Pack.version
};

var server = new Hapi.Server();

server.connection({
    port: serverPort,
    routes: {
        cors: true
    }
});

History.setup(server, serverPort);

server.register([Inert, Vision, {
    register: HapiSwagger,
    options: swaggerOptions
}], function (err) {});

server.register(require('hapi-auth-jwt2'), function (err) {
    if (err) {
        console.log(err);
    }

    server.auth.strategy('jwt', 'jwt', true, {
        key: _configConfigJs.PRIVATE_KEY, // Never Share your secret key
        validateFunc: AuthenticationHandler.validate // validate function defined above
    });
});

server.decorate('reply', 'co', function (handler) {
    this.response(Co(handler));
});

server.ext('onRequest', function (request, reply) {
    var path = request.path;
    var query = request.query;
    path = path.replace('/v1', '');
    request.setUrl(path);
    request.query = query;
    return reply['continue']();
});

server.ext('onPreHandler', function (request, reply) {
    var userId = request.payload !== null ? request.payload.userId : request.query.userId;
    if (userId) {
        var user = User.findOne({ _id: userId }).exec();
        user.then(function (user) {
            if (user) {
                reply['continue']();
            } else {
                reply().code(STATUS_CODES.BAD_REQUEST).takeover();
            }
        });
    } else {
        reply['continue']();
    }
});

server.ext('onPreResponse', function (request, reply) {

    var source = request.response.source;
    if (source && source.statusCode) {
        var statusCode = source.statusCode;
        reply(source).code(statusCode);
    } else {
        return reply['continue']();
    }
});

server.route(Routes);
server.start(function () {
    console.log('AppHunt is rocking your world at port %s', serverPort);
});

module.exports = server;