var userRoutes = require('./routes/user').userRoutes

var routes = []
routes = routes.concat(userRoutes)

module.exports.routes = routes
