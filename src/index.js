var Mongoose = require('mongoose')
var Hapi = require('hapi')
var Co = require('co')
var Routes = require('./routes').routes
var Client = require('./models').Client

var dbURI = process.env.MONGOLAB_URI || 'mongodb://localhost/appspice'

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

server.ext('onRequest', function (request, reply) {
    var appSpiceId = request.query.appSpiceId
    if(appSpiceId) {
        var client = Client.findOne({appSpiceId: appSpiceId}).exec()
        client.then(function(client) {
            if(client) {
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
        console.log(statusCode)
        reply(source).code(statusCode)
    } else {
    	return reply.continue()
    }

});


server.route(Routes)

if (!module.parent) {
    server.start(function() {
        console.log('AppSpice is rocking your world at port %s', serverPort)
    })
}

module.exports = server
