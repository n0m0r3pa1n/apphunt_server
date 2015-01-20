var userRoutes = require('./routes/user').userRoutes
var appRoutes = require('./routes/app').appRoutes

var routes = []
routes = routes.concat(userRoutes)
routes = routes.concat(appRoutes)
module.exports.routes = routes
