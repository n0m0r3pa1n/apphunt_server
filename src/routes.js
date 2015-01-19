var userRoutes = require('./routes/user').userRoutes
var clientRoutes = require('./routes/client').clientRoutes

var routes = []
routes = routes.concat(userRoutes)
routes = routes.concat(clientRoutes)

module.exports.routes = routes
