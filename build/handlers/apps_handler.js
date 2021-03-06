'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.create = create;
exports.getRandomApp = getRandomApp;
exports.update = update;
exports.deleteApp = deleteApp;
exports.changeAppStatus = changeAppStatus;
exports.getTrendingApps = getTrendingApps;
exports.getApps = getApps;
exports.getAppsForUser = getAppsForUser;
exports.filterApps = filterApps;
exports.getApp = getApp;
exports.getFavouriteAppsCount = getFavouriteAppsCount;
exports.getAppsByPackages = getAppsByPackages;
exports.searchApps = searchApps;
exports.favourite = favourite;
exports.unfavourite = unfavourite;
exports.getFavouriteApps = getFavouriteApps;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _history_handlerJs = require('./history_handler.js');

var HistoryHandler = _interopRequireWildcard(_history_handlerJs);

var _pagination_handlerJs = require('./pagination_handler.js');

var PaginationHandler = _interopRequireWildcard(_pagination_handlerJs);

var _tags_handlerJs = require('./tags_handler.js');

var TagsHandler = _interopRequireWildcard(_tags_handlerJs);

var _notifications_handlerJs = require('./notifications_handler.js');

var NotificationsHandler = _interopRequireWildcard(_notifications_handlerJs);

var _followers_handlerJs = require('./followers_handler.js');

var FollowersHandler = _interopRequireWildcard(_followers_handlerJs);

var _users_handlerJs = require('./users_handler.js');

var UsersHandler = _interopRequireWildcard(_users_handlerJs);

var _comments_handlerJs = require('./comments_handler.js');

var CommentsHandler = _interopRequireWildcard(_comments_handlerJs);

var DevsHunter = require('./utils/devs_hunter_handler');
var Badboy = require('badboy');
var _ = require("underscore");
var Bolt = require("bolt-js");
var Boom = require('boom');
var TweetComposer = require('../utils/tweet_composer');
var CONFIG = require('../config/config');
var MESSAGES = require('../config/messages');
var NodeCache = require("node-cache");
var myCache = new NodeCache();

var DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

var PLATFORMS = CONFIG.PLATFORMS;
var BOLT_APP_ID = CONFIG.BOLT_APP_ID;

var APP_STATUSES = CONFIG.APP_STATUSES;
var APP_STATUS_FILTER = CONFIG.APP_STATUSES_FILTER;
var APP_HUNT_TWITTER_HANDLE = CONFIG.APP_HUNT_TWITTER_HANDLE;
var NOTIFICATION_TYPES = CONFIG.NOTIFICATION_TYPES;
var HISTORY_EVENT_TYPES = CONFIG.HISTORY_EVENT_TYPES;
var TrendingAppsPoints = CONFIG.TrendingAppsPoints;

var LOGIN_TYPES = CONFIG.LOGIN_TYPES;
var LOGIN_TYPES_FILTER = CONFIG.LOGIN_TYPES_FILTER;

var VotesHandler = require('./votes_handler');
var UrlsHandler = require('./utils/urls_handler');
var EmailsHandler = require('./utils/emails_handler');

var FlurryHandler = require('./utils/flurry_handler.js');
var DateUtils = require('../utils/date_utils');
var LanguageDetect = require('languagedetect');
var lngDetector = new LanguageDetect();

var Models = require('../models');
var App = Models.App;
var Developer = Models.Developer;
var User = Models.User;
var AppCategory = Models.AppCategory;

function* create(app, tags, userId) {
    // TODO: Add language recognition
    //let languages = lngDetector.detect(app.description)

    app['package'] = getClearedAppPackage(app['package']);

    var existingApp = yield App.findOne({ 'package': app['package'] }).exec();
    if (existingApp) {
        return Boom.conflict('App already exists');
    }
    var comparisonDate = new Date('2015-01-01');
    var parsedApp = {};
    try {
        if (app.platform == PLATFORMS.Android) {
            parsedApp = yield DevsHunter.updateAndroidApp(app['package']);

            if (parsedApp === null) {
                return Boom.notFound("Non-existing app");
            }

            var d = parsedApp.developer;
            var developer = yield Developer.findOneOrCreate({ email: d.email }, { name: d.name, email: d.email });
            app.developer = developer;
        } else {
            parsedApp = yield Badboy.getiOSApp(app['package']);
            parsedApp.category = parsedApp.categories == null || parsedApp.categories == undefined || parsedApp.categories.length == 0 ? "" : parsedApp.categories[0];
        }
    } catch (e) {
        parsedApp = null;
    }

    if (parsedApp == null) {
        return Boom.notFound("Non-existing app");
    }

    var user = yield User.findOne({ _id: userId }).exec();
    if (user == null) {
        return Boom.notFound("Non-existing user");
    }

    app.status = APP_STATUSES.WAITING;
    app.createdBy = user;
    app.categories = yield getAppCategories(parsedApp.category);
    app.isFree = parsedApp.isFree;
    app.icon = parsedApp.icon;
    app.shortUrl = '';
    app.name = parsedApp.name;
    app.url = parsedApp.url;

    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    app.createdAt = tomorrow;

    if (app.platform == PLATFORMS.Android) {
        app.screenshots = parsedApp.screenshots;
        app.averageScore = parsedApp.score.total == undefined ? 0 : parsedApp.score.total;
    }

    var parsedDescription = app.description;
    if (parsedDescription == '' || parsedDescription === undefined) {
        parsedDescription = parsedApp.description;
        app.description = parsedDescription.length > 100 ? parsedDescription.substring(0, 10) : parsedDescription;
    }

    var createdApp = yield App.create(app);
    yield VotesHandler.createAppVote(userId, createdApp.id);
    yield TagsHandler.saveTagsForApp(tags, createdApp.id, createdApp.name, [getFormattedCategory(parsedApp.category)]);
    yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.APP_SUBMITTED, userId, { appName: app.name, appPackage: app['package'] });

    if (parsedApp.score.total >= 4 && new Date(parsedApp.publicationDate) > comparisonDate) {
        yield changeAppStatus(createdApp['package'], APP_STATUSES.APPROVED);
    }

    return createdApp;
}

function getClearedAppPackage(packageName) {
    var splitByAmpersandRegEx = /^.*(?=(\&))/;
    var appPackage = packageName.match(splitByAmpersandRegEx);
    if (appPackage !== undefined && appPackage !== null && appPackage.length > 1) {
        packageName = appPackage[0];
    }

    return packageName;
}

function* getAppCategories(appCategories) {
    var categoryName = getFormattedCategory(appCategories);
    var categories = [];
    var category = yield AppCategory.findOneOrCreate({ name: categoryName }, { name: categoryName });
    categories.push(category);

    return categories;
}

function getFormattedCategory(category) {
    var res = category.split("/");

    var newCategory = res[res.length - 1].toLowerCase();
    newCategory = newCategory.capitalizeFirstLetter();
    newCategory = newCategory.replace('and', '&');
    newCategory = newCategory.replaceAll('_', ' ');

    var finalCategory = newCategory;

    var split = newCategory.split(' ');
    if (split.length > 1) {
        finalCategory = "";
        for (var i = 0; i < split.length; i++) {
            var part = split[i];
            if (i == split.length - 1) {
                finalCategory += part.capitalizeFirstLetter();
            } else {
                if (part === "Game") {
                    continue;
                }
                finalCategory += part.capitalizeFirstLetter() + " ";
            }
        }
    }

    return finalCategory;
}

function* getPopulatedApp(app, userId) {
    app = app.toObject();
    app.isFavourite = false;
    if (userId !== undefined) {
        app.hasVoted = VotesHandler.hasUserVotedForApp(app, userId);
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = app.favouritedBy[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var favouritedBy = _step.value;

                if (String(favouritedBy) == String(userId)) {
                    app.isFavourite = true;
                    break;
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator['return']) {
                    _iterator['return']();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    }

    var categories = [];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = app.categories[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var category = _step2.value;

            categories.push(category.name);
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                _iterator2['return']();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }

    app.tags = yield TagsHandler.getTagsForApp(app._id);
    app.categories = categories;

    return app;
}

function* getRandomApp(userId) {
    var where = { platform: PLATFORMS.Android, status: APP_STATUSES.APPROVED };
    var count = yield App.find(where).count().exec();
    var rand = Math.floor(Math.random() * count);

    var app = yield App.findOne(where).deepPopulate('votes.user').populate('createdBy categories').skip(rand).exec();
    return yield getPopulatedApp(app, userId);
}

function* update(app) {
    var existingApp = yield App.findOne({ 'package': app['package'] }).populate('developer createdBy').exec();
    if (!existingApp) {
        return Boom.notFound("Non-existing app");
    }

    existingApp.createdAt = app.createdAt;
    existingApp.description = app.description;
    existingApp.status = app.status;

    var savedApp = yield existingApp.save();
    return savedApp;
}

function postTweet(app, user) {
    var bolt = new Bolt(BOLT_APP_ID);
    var tweetComposer = new TweetComposer(APP_HUNT_TWITTER_HANDLE);
    var tweetOptions = {
        name: app.name,
        description: app.description,
        url: app.shortUrl,
        hashTag: "app"
    };
    if (user.loginType == LOGIN_TYPES.Twitter) {
        tweetOptions.user = user.username;
    }

    bolt.postTweet(tweetComposer.compose(tweetOptions));
}

function* deleteApp(packageName) {
    var app = yield App.findOne({ 'package': packageName }).exec();

    yield VotesHandler.clearAppVotes(app.votes);
    var clearCommentsResult = yield CommentsHandler.clearAppComments(app._id);
    yield TagsHandler.removeAppFromTags(app._id);
    yield HistoryHandler.deleteEventsForApp(app._id);
    yield App.remove({ 'package': packageName }).exec();

    return Boom.OK();
}

function* changeAppStatus(appPackage, status) {
    var app = yield App.findOne({ 'package': appPackage }).populate('developer createdBy').exec();
    if (app == null) {
        return Boom.notFound("Non-existing app");
    }

    if (app.developer == null) {
        var parsedApp = yield DevsHunter.getAndroidApp(appPackage);
        if (parsedApp != null && parsedApp.developer != null && parsedApp.developer != undefined) {
            var d = parsedApp.developer;
            app.developer = yield Developer.findOneOrCreate({ email: d.email }, { name: d.name, email: d.email });
        }
    }

    var createdBy = yield User.findById(app.createdBy._id).populate('devices').exec();
    var devices = createdBy.devices;
    if (status === APP_STATUSES.REJECTED) {
        var title = String.format(MESSAGES.APP_REJECTED_TITLE, app.name);
        var message = MESSAGES.APP_REJECTED_MESSAGE;
        NotificationsHandler.sendNotifications(devices, title, message, app.icon, NOTIFICATION_TYPES.APP_REJECTED);
        yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.APP_REJECTED, createdBy._id, { appName: app.name });
        yield deleteApp(appPackage);
    } else if (status == APP_STATUSES.APPROVED) {
        var isAppApproved = app.status == APP_STATUSES.WAITING && status == APP_STATUSES.APPROVED;

        if (isAppApproved) {
            EmailsHandler.sendEmailToDeveloper(app);
            var _title = String.format(MESSAGES.APP_APPROVED_TITLE, app.name);
            var _message = String.format(MESSAGES.APP_APPROVED_MESSAGE, app.name, DateUtils.formatDate(app.createdAt));
            NotificationsHandler.sendNotifications(devices, _title, _message, app.icon, NOTIFICATION_TYPES.APP_APPROVED);
            yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.APP_APPROVED, createdBy._id, {
                appId: app._id,
                appName: app.name
            });

            yield sendNotificationsToFollowers(createdBy, app.name, app.icon);
        }
    }

    app.status = status;
    yield app.save();

    return Boom.OK();
}

function* sendNotificationsToFollowers(createdBy, appName, icon) {
    var followers = (yield FollowersHandler.getFollowers(createdBy._id)).followers;
    if (followers.length == 0) {
        return;
    }

    var devices = [];
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = followers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var follower = _step3.value;

            var followerDevices = yield UsersHandler.getDevicesForUser(follower._id);
            if (followerDevices != undefined && followerDevices != null && followerDevices.length > 0) {
                devices = devices.concat(followerDevices);
            }
        }
    } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion3 && _iterator3['return']) {
                _iterator3['return']();
            }
        } finally {
            if (_didIteratorError3) {
                throw _iteratorError3;
            }
        }
    }

    var message = String.format(MESSAGES.FOLLOWING_APP_APPROVED_MESSAGE, appName);
    var title = String.format(MESSAGES.FOLLOWER_APP_APPROVED_TITLE, createdBy.name);
    NotificationsHandler.sendNotifications(devices, title, message, icon, NOTIFICATION_TYPES.FOLLOWING_ADDED_APP);
}

function* setAppShortUrl(app) {
    var links = [{
        url: app.url, platform: "default"
    }];

    if (app.platform == PLATFORMS.Android) {
        links.push({
            url: "market://details?id=" + app['package'],
            platform: "android"
        });
    }
    app.shortUrl = yield UrlsHandler.getShortLink(links);
    console.log(app.shortUrl);
}

function* getTrendingApps(userId, page, pageSize) {
    var totalCount = 150;
    if (page == 0 || pageSize == 0) {
        page = 1;
        pageSize = totalCount;
    }

    var skip = (page - 1) * pageSize;
    var limit = skip + pageSize > totalCount ? totalCount - skip : pageSize;

    if (skip > totalCount) {
        return { apps: [], page: page };
    }

    var flurryCacheKey = "flurryCacheKey";
    console.time("Total");
    var toDate = new Date();
    var fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 31);

    console.time("Events Request");
    var votesAndCommentsEvents = yield HistoryHandler.getEvents(fromDate, toDate, HISTORY_EVENT_TYPES.APP_FAVOURITED, HISTORY_EVENT_TYPES.APP_VOTED, HISTORY_EVENT_TYPES.APP_UNVOTED, HISTORY_EVENT_TYPES.USER_COMMENT, HISTORY_EVENT_TYPES.USER_MENTIONED);
    console.timeEnd("Events Request");
    var appsPoints = [];
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = votesAndCommentsEvents[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var eventItem = _step4.value;

            var appId = eventItem.appId;
            var points = 0;
            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
                for (var _iterator8 = eventItem.events[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                    var _event = _step8.value;

                    if (_event.type == HISTORY_EVENT_TYPES.USER_COMMENT || _event.type == HISTORY_EVENT_TYPES.USER_MENTIONED) {
                        points += TrendingAppsPoints.comment;
                    } else if (_event.type == HISTORY_EVENT_TYPES.APP_VOTED) {
                        points += TrendingAppsPoints.vote;
                    } else if (_event.type == HISTORY_EVENT_TYPES.APP_UNVOTED) {
                        points -= TrendingAppsPoints.vote;
                    } else if (_event.type == HISTORY_EVENT_TYPES.APP_FAVOURITED) {
                        points += TrendingAppsPoints.favourite;
                    }
                }
            } catch (err) {
                _didIteratorError8 = true;
                _iteratorError8 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion8 && _iterator8['return']) {
                        _iterator8['return']();
                    }
                } finally {
                    if (_didIteratorError8) {
                        throw _iteratorError8;
                    }
                }
            }

            appsPoints.push({ appId: appId, points: points });
        }
    } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion4 && _iterator4['return']) {
                _iterator4['return']();
            }
        } finally {
            if (_didIteratorError4) {
                throw _iteratorError4;
            }
        }
    }

    console.time("Flurry");
    var sixHours = 21600;

    var flurryAppsWithPoints = myCache.get(flurryCacheKey);

    if (flurryAppsWithPoints == undefined || flurryAppsWithPoints == null) {
        console.log("FLURRY REQUEST");
        var installedPackages = yield FlurryHandler.getInstalledPackages(DateUtils.formatDate(fromDate), DateUtils.formatDate(toDate));
        if (installedPackages.length > totalCount) {
            installedPackages = installedPackages.slice(0, totalCount);
        }
        flurryAppsWithPoints = yield getAppsWithInstallsPoints(installedPackages);
        myCache.set(flurryCacheKey, flurryAppsWithPoints, sixHours, function (err, success) {
            if (err) {
                console.log(err);
            }
        });
    }
    console.timeEnd("Flurry");

    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
        for (var _iterator5 = flurryAppsWithPoints[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var fluryAppPoints = _step5.value;

            var currentAppPoints = getTrendingAppPoints(fluryAppPoints.appId, appsPoints);
            if (currentAppPoints != null) {
                currentAppPoints.points += fluryAppPoints.points;
            } else {
                appsPoints.push(fluryAppPoints);
            }
        }
    } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion5 && _iterator5['return']) {
                _iterator5['return']();
            }
        } finally {
            if (_didIteratorError5) {
                throw _iteratorError5;
            }
        }
    }

    var sortedAppsByPoints = _.sortBy(appsPoints, function (item) {
        return item.points;
    });
    sortedAppsByPoints.reverse();
    if (sortedAppsByPoints.length > totalCount) {
        sortedAppsByPoints = sortedAppsByPoints.slice(0, totalCount);
    }
    sortedAppsByPoints = sortedAppsByPoints.slice(skip, skip + limit);
    var appIds = [];
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
        for (var _iterator6 = sortedAppsByPoints[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var appPoints = _step6.value;

            appIds.push(appPoints.appId);
        }
    } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion6 && _iterator6['return']) {
                _iterator6['return']();
            }
        } finally {
            if (_didIteratorError6) {
                throw _iteratorError6;
            }
        }
    }

    console.time("Populate Apps");
    var apps = [];
    var populatedApps = yield App.find({ _id: { $in: appIds } }).populate('createdBy categories votes');

    var _iteratorNormalCompletion7 = true;
    var _didIteratorError7 = false;
    var _iteratorError7 = undefined;

    try {
        var _loop = function* () {
            var id = _step7.value;

            var app = _.find(populatedApps, function (item) {
                return String(item._id) == String(id);
            });
            if (app == null) {
                return 'continue';
            }
            var populatedApp = yield getPopulatedApp(app, userId);
            populatedApp.commentsCount = yield setCommentsCount(id);
            apps.push(populatedApp);
        };

        for (var _iterator7 = appIds[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            var _ret = yield* _loop();

            if (_ret === 'continue') continue;
        }
    } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion7 && _iterator7['return']) {
                _iterator7['return']();
            }
        } finally {
            if (_didIteratorError7) {
                throw _iteratorError7;
            }
        }
    }

    console.timeEnd("Populate Apps");
    console.timeEnd("Total");

    return { apps: apps, totalCount: totalCount, page: page, pageSize: pageSize, totalPages: getTotalPages(totalCount, pageSize) };
}

function getTotalPages(totalRecordsCount, pageSize) {
    if (pageSize == 0 || totalRecordsCount == 0) {
        return 0;
    }

    return Math.ceil(totalRecordsCount / pageSize);
}

function* getAppsWithInstallsPoints(installedPackages) {
    var appsPoints = [];
    var _iteratorNormalCompletion9 = true;
    var _didIteratorError9 = false;
    var _iteratorError9 = undefined;

    try {
        for (var _iterator9 = installedPackages[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
            var installedPackage = _step9.value;

            var app = yield App.findOne({ 'package': installedPackage["@name"] }).exec();
            if (app == null) {
                continue;
            }

            appsPoints.push({
                appId: app._id,
                points: installedPackage["@totalCount"] * TrendingAppsPoints.install
            });
        }
    } catch (err) {
        _didIteratorError9 = true;
        _iteratorError9 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion9 && _iterator9['return']) {
                _iterator9['return']();
            }
        } finally {
            if (_didIteratorError9) {
                throw _iteratorError9;
            }
        }
    }

    return appsPoints;
}

function getTrendingAppPoints(appId, appPoints) {
    var result = null;
    var _iteratorNormalCompletion10 = true;
    var _didIteratorError10 = false;
    var _iteratorError10 = undefined;

    try {
        for (var _iterator10 = appPoints[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
            var item = _step10.value;

            if (String(item.appId) == String(appId)) {
                result = item;
                break;
            }
        }
    } catch (err) {
        _didIteratorError10 = true;
        _iteratorError10 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion10 && _iterator10['return']) {
                _iterator10['return']();
            }
        } finally {
            if (_didIteratorError10) {
                throw _iteratorError10;
            }
        }
    }

    return result;
}

function* getApps(dateStr, toDateStr, platform, appStatus, page, pageSize, userId, userType, query) {
    var where = {};

    if (query !== undefined) {
        where.name = { $regex: query, $options: 'i' };
    }

    var responseDate = "";
    if (dateStr !== undefined) {
        var date = new Date(dateStr);
        var toDate = new Date(date.getTime() + DAY_MILLISECONDS);
        if (toDateStr !== undefined) {
            var toDateFromString = new Date(toDateStr);
            toDate = new Date(toDateFromString.getTime() + DAY_MILLISECONDS);
        }
        where.createdAt = {
            "$gte": new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
            "$lt": toDate.toISOString()
        };
        responseDate += date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate();
    }

    where.platform = platform;

    if (appStatus !== APP_STATUS_FILTER.ALL) {
        where.status = appStatus;
    }

    var query = App.find(where).deepPopulate("votes.user").populate("categories").populate("createdBy");
    query.sort({ votesCount: 'desc', createdAt: 'desc' });
    var result = yield PaginationHandler.getPaginatedResultsWithName(query, "apps", page, pageSize);
    result.apps = convertToArray(result.apps);
    if (userType != undefined) {
        var _iteratorNormalCompletion11 = true;
        var _didIteratorError11 = false;
        var _iteratorError11 = undefined;

        try {
            for (var _iterator11 = result.apps[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                var app = _step11.value;

                app.votes = getAppVotesForUserType(app.votes, userType);
                app.votesCount = app.votes.length;
            }
        } catch (err) {
            _didIteratorError11 = true;
            _iteratorError11 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion11 && _iterator11['return']) {
                    _iterator11['return']();
                }
            } finally {
                if (_didIteratorError11) {
                    throw _iteratorError11;
                }
            }
        }

        result.apps = _.sortBy(result.apps, 'votesCount');
        result.apps.reverse();
    }
    yield formatApps(userId, result.apps);

    result.date = responseDate;

    return result;
}

function getAppVotesForUserType(userVotes, userType) {
    return _.filter(userVotes, function (vote) {
        var pass = false;
        if (vote.user == null) {
            return true;
        }
        if (userType == LOGIN_TYPES_FILTER.Fake) {
            pass = vote.user.loginType == LOGIN_TYPES.Fake ? true : false;
        } else if (userType == LOGIN_TYPES_FILTER.Real) {
            pass = vote.user.loginType != LOGIN_TYPES.Fake ? true : false;
        } else {
            pass = true;
        }
        return pass;
    });
}

function* getAppsForUser(creatorId) {
    var userId = arguments.length <= 1 || arguments[1] === undefined ? creatorId : arguments[1];
    var page = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
    var pageSize = arguments.length <= 3 || arguments[3] === undefined ? 0 : arguments[3];
    return yield* (function* () {
        var query = App.find({
            createdBy: creatorId,
            status: APP_STATUSES.APPROVED
        }).deepPopulate("votes.user").populate("categories").populate("createdBy");
        query.sort({ votesCount: 'desc', createdAt: 'desc' });
        var result = yield PaginationHandler.getPaginatedResultsWithName(query, "apps", page, pageSize);
        result.apps = convertToArray(result.apps);
        yield formatApps(userId, result.apps);

        return result;
    })();
}

function* filterApps(packages, platform) {
    var existingApps = yield App.find({ 'package': { $in: packages } }).exec();
    var existingAppsPackages = [];
    for (var i in existingApps) {
        existingAppsPackages.push(existingApps[i]['package']);
    }

    var appsToBeAdded = _.difference(packages, existingAppsPackages);
    var packagesResult = [];
    var _iteratorNormalCompletion12 = true;
    var _didIteratorError12 = false;
    var _iteratorError12 = undefined;

    try {
        for (var _iterator12 = appsToBeAdded[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
            var app = _step12.value;

            var parsedApp = null;
            try {
                parsedApp = yield DevsHunter.getAndroidApp(app);
            } catch (e) {
                continue;
            }

            if (parsedApp != null) {
                packagesResult.push(app);
            }
        }
    } catch (err) {
        _didIteratorError12 = true;
        _iteratorError12 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion12 && _iterator12['return']) {
                _iterator12['return']();
            }
        } finally {
            if (_didIteratorError12) {
                throw _iteratorError12;
            }
        }
    }

    return { "availablePackages": packagesResult, "existingPackages": existingAppsPackages };
}

function* getApp(appId, userId) {
    var app = yield App.findById(appId).deepPopulate('votes.user createdBy.devices').populate('createdBy categories').exec();
    if (!app) {
        return Boom.notFound('App can not be found!');
    }
    var populatedApp = yield getPopulatedApp(app, userId);
    populatedApp.commentsCount = yield setCommentsCount(appId);

    return populatedApp;
}

function* getFavouriteAppsCount(userId) {
    return yield App.count({ favouritedBy: userId }).exec();
}

function* getAppsByPackages(packages) {
    var apps = [];
    var _iteratorNormalCompletion13 = true;
    var _didIteratorError13 = false;
    var _iteratorError13 = undefined;

    try {
        for (var _iterator13 = packages[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
            var pack = _step13.value;

            var app = yield App.findOne({ 'package': pack }).populate('createdBy categories').exec();
            if (app != null) {
                apps.push((yield getPopulatedApp(app)));
            }
        }
    } catch (err) {
        _didIteratorError13 = true;
        _iteratorError13 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion13 && _iterator13['return']) {
                _iterator13['return']();
            }
        } finally {
            if (_didIteratorError13) {
                throw _iteratorError13;
            }
        }
    }

    return apps;
}

function* searchApps(q, platform, status, page, pageSize, userId) {
    var where = { name: { $regex: q, $options: 'i' } };
    where.platform = platform;
    if (status !== undefined) {
        where.status = status;
    } else {
        where.status = APP_STATUSES.APPROVED;
    }

    var query = App.find(where).deepPopulate('votes.user').populate("categories").populate("createdBy");
    query.sort({ votesCount: 'desc', createdAt: 'desc' });

    var result = yield PaginationHandler.getPaginatedResultsWithName(query, "apps", page, pageSize);
    result.apps = convertToArray(result.apps);
    yield formatApps(userId, result.apps);
    return result;
}

function* favourite(appId, userId) {
    var app = yield App.findById(appId).exec();
    if (!app) {
        return Boom.notFound('App cannot be found!');
    }

    var user = yield User.findById(userId).exec();
    if (user == null) {
        return Boom.notFound('User cannot be found!');
    }

    for (var favouritedBy in app.favouritedBy) {
        if (favouritedBy == userId) {
            return Boom.conflict("User has already favourited app!");
        }
    }
    app.favouritedBy.push(userId);
    yield app.save();

    yield HistoryHandler.createEvent(HISTORY_EVENT_TYPES.APP_FAVOURITED, userId, {
        appId: app._id,
        appName: app.name,
        userName: user.name
    });
    var isFollowing = yield FollowersHandler.isFollowing(app.createdBy, userId);
    if (isFollowing) {
        var title = "Check this cool app";
        var messages = HistoryHandler.getText(HISTORY_EVENT_TYPES.APP_FAVOURITED, {
            appName: app.name,
            userName: user.name
        });
        yield NotificationsHandler.sendNotificationsToUsers([app.createdBy], title, messages, app.icon, NOTIFICATION_TYPES.FOLLOWING_FAVOURITED_APP, {
            appId: app._id
        });
    }

    return Boom.OK();
}

function* unfavourite(appId, userId) {
    var app = yield App.findById(appId).exec();
    if (!app) {
        return Boom.notFound('App cannot be found!');
    }

    var size = app.favouritedBy.length;
    for (var i = 0; i < size; i++) {
        var currentFavouritedId = app.favouritedBy[i];
        if (currentFavouritedId == userId) {
            app.favouritedBy.splice(i, 1);
            break;
        }
    }

    yield app.save();

    return Boom.OK();
}

function* getFavouriteApps(creatorId, userId, page, pageSize) {
    var query = App.find({ favouritedBy: creatorId }).deepPopulate('votes.user').populate("categories").populate("createdBy");

    var result = yield PaginationHandler.getPaginatedResultsWithName(query, "apps", page, pageSize);
    result.apps = convertToArray(result.apps);
    yield formatApps(userId, result.apps);
    return result;
}

//==========================================================
// Helper functions
//==========================================================
function removeUnusedFields(apps) {
    if (apps !== undefined) {
        for (var i = 0; i < apps.length; i++) {
            delete apps[i].votes;
        }
    }
}

function* setCommentsCount(appId) {
    return yield CommentsHandler.getCount(appId);
}

function convertToArray(apps) {
    var resultApps = [];
    for (var i = 0; i < apps.length; i++) {
        var app = apps[i].toObject();
        resultApps.push(app);
    }

    return resultApps;
}

function* formatApps(userId, apps) {
    if (userId !== undefined && apps !== undefined) {
        apps = VotesHandler.setHasUserVotedForAppField(apps, userId);
    }

    for (var i = 0; i < apps.length; i++) {
        apps[i].commentsCount = yield setCommentsCount(apps[i]._id);
        var categories = [];
        var _iteratorNormalCompletion14 = true;
        var _didIteratorError14 = false;
        var _iteratorError14 = undefined;

        try {
            for (var _iterator14 = apps[i].categories[Symbol.iterator](), _step14; !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
                var category = _step14.value;

                categories.push(category.name);
            }
        } catch (err) {
            _didIteratorError14 = true;
            _iteratorError14 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion14 && _iterator14['return']) {
                    _iterator14['return']();
                }
            } finally {
                if (_didIteratorError14) {
                    throw _iteratorError14;
                }
            }
        }

        apps[i].categories = categories;
    }

    removeUnusedFields(apps);
}