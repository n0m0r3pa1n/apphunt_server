'use strict';

var userRoutes = require('./routes/users_routes').userRoutes;
var appRoutes = require('./routes/apps_routes').appRoutes;
var notificationRoutes = require('./routes/notifications_routes').notificationRoutes;
var commentRoutes = require('./routes/comments_routes').commentRoutes;
var voteRoutes = require('./routes/votes_routes').voteRoutes;
var collectionsRoutes = require('./routes/collections_routes').collectionsRoutes;

var statsRoutes = require('./routes/stats_routes').userStatsRoutes;

var routes = [];
routes = routes.concat(userRoutes);
routes = routes.concat(appRoutes);
routes = routes.concat(notificationRoutes);
routes = routes.concat(commentRoutes);
routes = routes.concat(voteRoutes);
routes = routes.concat(statsRoutes);
routes = routes.concat(collectionsRoutes);
module.exports.routes = routes;