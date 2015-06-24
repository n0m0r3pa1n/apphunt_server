var Mongoose = require('mongoose')
var Hapi = require('hapi')
var Co = require('co')
var Routes = require('./routes').routes
var User = require('./models').User

var STATUS_CODES = require('./config/config').STATUS_CODES
var JSExtensions = require('./utils/js_extension_utils')

var dbURI = process.env.MONGOLAB_URI || 'mongodb://localhost/apphunt'

Mongoose.connect(dbURI)
var serverPort = process.env.PORT || 8080

var pack = require('../package'),
    swaggerOptions = {
        basePath: (dbURI.contains('localhost') ? ('http://localhost:' + serverPort ) : 'http://apphunt.herokuapp.com') ,
        apiVersion: pack.version
    };

var server = new Hapi.Server()

server.connection({
    port: serverPort,
    routes: {
        cors: true
    }
})

server.register({
    register: require('hapi-swagger'),
    options: swaggerOptions
}, function (err) {
    if (err) {
        server.log(['error'], 'hapi-swagger load error: ' + err)
    }else{
        server.log(['start'], 'hapi-swagger interface loaded')
    }
});

server.decorate('reply', 'co', function (handler) {
    this.response(Co(handler))
})

server.ext('onRequest', function (request, reply) {
    var path = request.path
    var query = request.query
    path = path.replace('/v1','')
    request.setUrl(path);
    request.query = query
    return reply.continue();
});

server.ext('onPreHandler', function (request, reply) {
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

server.ext('onPreResponse', function (request, reply) {
    
    var source = request.response.source
    if(source && source.statusCode) {
        var statusCode = source.statusCode
        reply(source).code(statusCode)
    } else {
    	return reply.continue()
    }

});

server.route(Routes)

if (!module.parent) {
    server.start(function() {
        console.log('AppHunt is rocking your world at port %s', serverPort)
    })
}

module.exports = server
