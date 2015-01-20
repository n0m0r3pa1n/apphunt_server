var Mongoose = require('mongoose')
var Hapi = require('hapi')
var Co = require('co')
var Routes = require('./routes').routes
var Client = require('./models').Client

var dbURI = process.env.MONGOLAB_URI || 'mongodb://localhost/apphunt'

Mongoose.connect(dbURI)
var serverPort = process.env.PORT || 8080


var server = new Hapi.Server()

server.connection({ 
    port: serverPort,
    routes: {
      cors: true
    }
})

server.decorate('reply', 'co', function (handler) {
    this.response(Co(handler))
})

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
