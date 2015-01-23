var Mongoose = require('mongoose')
var Hapi = require('hapi')
var Co = require('co')
var Routes = require('./routes').routes
var User = require('./models').User

var dbURI = process.env.MONGOLAB_URI || 'mongodb://localhost/apphunt'

Mongoose.connect(dbURI)
var serverPort = process.env.PORT || 8080

var pack = require('../package'),
    swaggerOptions = {
        basePath: 'http://localhost:' + serverPort,
        apiVersion: pack.version
    };

var server = new Hapi.Server()

server.connection({
    port: serverPort,
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

server.ext('onPreHandler', function (request, reply) {
    var userId = request.payload !== null ? request.payload.userId : request.query.userId
    if(userId) {
        var user = User.findOne({_id: userId}).exec()
        user.then(function(user) {
            if(user) {
                reply.continue();
            } else {
                reply().code(400).takeover()
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
