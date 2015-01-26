var userRoutes = require('./routes/users_routes').userRoutes
var appRoutes = require('./routes/apps_routes').appRoutes
var notificationRoutes = require('./routes/notifications_routes').notificationRoutes

var routes = []
routes = routes.concat(userRoutes)
routes = routes.concat(appRoutes)
routes = routes.concat(notificationRoutes)
module.exports.routes = routes
