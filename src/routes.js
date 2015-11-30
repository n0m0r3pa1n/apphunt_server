var userRoutes = require('./routes/users_routes').userRoutes
var followerRoutes = require('./routes/followers_routes').followerRoutes
var appRoutes = require('./routes/apps_routes').appRoutes
var notificationRoutes = require('./routes/notifications_routes').notificationRoutes
var commentRoutes = require('./routes/comments_routes').commentRoutes
var voteRoutes = require('./routes/votes_routes').voteRoutes
var collectionsRoutes = require('./routes/collections_routes').collectionsRoutes
var versionRoutes = require('./routes/version_routes').versionRoutes
var historyRoutes = require('./routes/history_routes').historyRoutes
import {tagRoutes} from "./routes/tags_routes.js"
import {adRoutes} from "./routes/ads_routes.js"
var statsRoutes = require('./routes/stats_routes').userStatsRoutes

var routes = []
routes = routes.concat(userRoutes)
routes = routes.concat(followerRoutes)
routes = routes.concat(appRoutes)
routes = routes.concat(notificationRoutes)
routes = routes.concat(commentRoutes)
routes = routes.concat(voteRoutes)
routes = routes.concat(statsRoutes)
routes = routes.concat(collectionsRoutes)
routes = routes.concat(versionRoutes)
routes = routes.concat(tagRoutes)
routes = routes.concat(historyRoutes)
routes = routes.concat(adRoutes)
module.exports.routes = routes
