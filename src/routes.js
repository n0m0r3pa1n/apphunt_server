var userRoutes = require('./routes/users_routes').userRoutes
var appRoutes = require('./routes/apps_routes').appRoutes
var notificationRoutes = require('./routes/notifications_routes').notificationRoutes
var commentRoutes = require('./routes/comments_routes').commentRoutes


var routes = []
routes = routes.concat(userRoutes)
routes = routes.concat(appRoutes)
routes = routes.concat(notificationRoutes)
routes = routes.concat(commentRoutes)
module.exports.routes = routes
