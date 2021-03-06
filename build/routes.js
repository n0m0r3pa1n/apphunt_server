'use strict';

var _routesTags_routesJs = require("./routes/tags_routes.js");

var _routesAds_routesJs = require("./routes/ads_routes.js");

var userRoutes = require('./routes/users_routes').userRoutes;
var followerRoutes = require('./routes/followers_routes').followerRoutes;
var appRoutes = require('./routes/apps_routes').appRoutes;
var notificationRoutes = require('./routes/notifications_routes').notificationRoutes;
var commentRoutes = require('./routes/comments_routes').commentRoutes;
var voteRoutes = require('./routes/votes_routes').voteRoutes;
var collectionsRoutes = require('./routes/collections_routes').collectionsRoutes;
var versionRoutes = require('./routes/version_routes').versionRoutes;
var historyRoutes = require('./routes/history_routes').historyRoutes;

var statsRoutes = require('./routes/stats_routes').userStatsRoutes;

var routes = [];
routes = routes.concat(userRoutes);
routes = routes.concat(followerRoutes);
routes = routes.concat(appRoutes);
routes = routes.concat(notificationRoutes);
routes = routes.concat(commentRoutes);
routes = routes.concat(voteRoutes);
routes = routes.concat(statsRoutes);
routes = routes.concat(collectionsRoutes);
routes = routes.concat(versionRoutes);
routes = routes.concat(_routesTags_routesJs.tagRoutes);
routes = routes.concat(historyRoutes);
routes = routes.concat(_routesAds_routesJs.adRoutes);
module.exports.routes = routes;