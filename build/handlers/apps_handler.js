'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.create = create;
exports.update = update;
exports.deleteApp = deleteApp;
exports.changeAppStatus = changeAppStatus;
exports.getApps = getApps;
exports.filterApps = filterApps;
exports.getApp = getApp;
exports.searchApps = searchApps;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _statsPagination_stats_handlerJs = require('./stats/pagination_stats_handler.js');

var PaginationHandler = _interopRequireWildcard(_statsPagination_stats_handlerJs);

var _tags_handlerJs = require('./tags_handler.js');

var TagsHandler = _interopRequireWildcard(_tags_handlerJs);

var DevsHunter = require('./utils/devs_hunter_handler');
var Badboy = require('badboy');
var _ = require('underscore');
var Bolt = require('bolt-js');
var Boom = require('boom');
var TweetComposer = require('../utils/tweet_composer');
var CONFIG = require('../config/config');
var MESSAGES = require('../config/messages');

var DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

var PLATFORMS = CONFIG.PLATFORMS;
var BOLT_APP_ID = CONFIG.BOLT_APP_ID;

var APP_STATUSES = CONFIG.APP_STATUSES;
var APP_STATUS_FILTER = CONFIG.APP_STATUSES_FILTER;
var APP_HUNT_TWITTER_HANDLE = CONFIG.APP_HUNT_TWITTER_HANDLE;
var NOTIFICATION_TYPES = CONFIG.NOTIFICATION_TYPES;

var LOGIN_TYPES = CONFIG.LOGIN_TYPES;

var VotesHandler = require('./votes_handler');
var UrlsHandler = require('./utils/urls_handler');
var CommentsHandler = require('./comments_handler');
var NotificationsHandler = require('./notifications_handler');
var EmailsHandler = require('./utils/emails_handler');

var DateUtils = require('../utils/date_utils');

var Models = require('../models');
var App = Models.App;
var Developer = Models.Developer;
var User = Models.User;
var AppCategory = Models.AppCategory;

function* create(app, tags, userId) {
    app['package'] = getClearedAppPackage(app['package']);

    var existingApp = yield App.findOne({ 'package': app['package'] }).exec();
    if (existingApp) {
        return Boom.conflict('App already exists');
    }

    var parsedApp = {};
    try {
        if (app.platform == PLATFORMS.Android) {
            parsedApp = yield DevsHunter.getAndroidApp(app['package']);
            if (parsedApp === null) {
                return Boom.notFound('Non-existing app');
            }

            var d = parsedApp.developer;
            var developer = yield Developer.findOneOrCreate({ email: d.email }, { name: d.name, email: d.email });
            app.developer = developer;
        } else {
            parsedApp = yield Badboy.getiOSApp(app['package']);
        }
    } catch (e) {
        parsedApp = null;
    }

    if (parsedApp == null) {
        return Boom.notFound('Non-existing app');
    }

    var user = yield User.findOne({ _id: userId }).exec();

    app.status = APP_STATUSES.WAITING;
    app.createdBy = user;
    app.categories = yield getAppCategories(parsedApp);
    app.isFree = parsedApp.isFree;
    app.icon = parsedApp.icon;
    app.shortUrl = '';
    app.name = parsedApp.name;
    app.url = parsedApp.url;
    app.screenshots = parsedApp.screenshots;
    app.averageScore = parsedApp.score.total == undefined ? 0 : parsedApp.score.total;

    var parsedDescription = app.description;
    if (parsedDescription == '' || parsedDescription === undefined) {
        parsedDescription = parsedApp.description;
        app.description = parsedDescription.length > 100 ? parsedDescription.substring(0, 10) : parsedDescription;
    }

    var createdApp = yield App.create(app);
    yield VotesHandler.createAppVote(userId, createdApp.id);
    yield TagsHandler.saveTagsForApp(tags, createdApp.id, createdApp.name, [getFormattedCategory(parsedApp.category)]);

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

function* getAppCategories(parsedApp) {
    var categoryName = getFormattedCategory(parsedApp.category);
    var categories = [];
    var category = yield AppCategory.findOneOrCreate({ name: categoryName }, { name: categoryName });
    categories.push(category);

    return categories;
}

function getFormattedCategory(category) {
    var res = category.split('/');

    var newCategory = res[res.length - 1].toLowerCase();
    newCategory = newCategory.capitalizeFirstLetter();
    newCategory = newCategory.replace('and', '&');
    newCategory = newCategory.replaceAll('_', ' ');

    var finalCategory = newCategory;

    var split = newCategory.split(' ');
    if (split.length > 1) {
        finalCategory = '';
        for (var i = 0; i < split.length; i++) {
            var part = split[i];
            if (i == split.length - 1) {
                finalCategory += part.capitalizeFirstLetter();
            } else {
                if (part === 'Game') {
                    continue;
                }
                finalCategory += part.capitalizeFirstLetter() + ' ';
            }
        }
    }

    return finalCategory;
}

function* update(app) {
    var existingApp = yield App.findOne({ 'package': app['package'] }).populate('developer createdBy').exec();
    if (!existingApp) {
        return Boom.notFound('Non-existing app');
    }
    var isAppApproved = existingApp.status == APP_STATUSES.WAITING && app.status == APP_STATUSES.APPROVED;

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
        hashTag: 'app'
    };
    if (user.loginType !== LOGIN_TYPES.Fake) {
        tweetOptions.user = user.username;
    }
    bolt.postTweet(tweetComposer.compose(tweetOptions));
}

function* deleteApp(packageName) {
    var app = yield App.findOne({ 'package': packageName }).exec();
    yield VotesHandler.clearAppVotes(app.votes);
    yield CommentsHandler.clearAppComments(app._id);
    yield TagsHandler.removeAppFromTags(app._id);
    yield App.remove({ 'package': packageName }).exec();

    return Boom.OK();
}

function* changeAppStatus(appPackage, status) {
    var app = yield App.findOne({ 'package': appPackage }).exec();
    if (app == null) {
        return Boom.notFound('Non-existing app');
    }
    var createdBy = yield User.findOne(app.createdBy).populate('devices').exec();
    if (status === APP_STATUSES.REJECTED) {
        var title = String.format(MESSAGES.APP_REJECTED_TITLE, app.name);
        var message = MESSAGES.APP_REJECTED_MESSAGE;
        yield NotificationsHandler.sendNotificationToUser(createdBy, title, message, app.icon, NOTIFICATION_TYPES.APP_REJECTED);

        yield deleteApp(appPackage);
    } else if (status == APP_STATUSES.APPROVED) {
        var isAppApproved = app.status == APP_STATUSES.WAITING && status == APP_STATUSES.APPROVED;
        var links = [];
        if (isAppApproved) {
            links = [{
                url: app.url, platform: 'default'
            }];

            if (app.platform == PLATFORMS.Android) {
                links.push({
                    url: 'market://details?id=' + app['package'],
                    platform: 'android'
                });
            }
            app.shortUrl = yield UrlsHandler.getShortLink(links);

            if (createdBy.loginType == LOGIN_TYPES.Twitter) {
                postTweet(app, createdBy);
            }
            EmailsHandler.sendEmailToDeveloper(app);

            var title = String.format(MESSAGES.APP_APPROVED_TITLE, app.name);
            var message = String.format(MESSAGES.APP_APPROVED_MESSAGE, app.name, DateUtils.formatDate(app.createdAt));

            yield NotificationsHandler.sendNotificationToUser(createdBy, title, message, app.icon, NOTIFICATION_TYPES.APP_APPROVED);
        }
    }

    app.status = status;
    yield app.save();

    return Boom.OK();
}

function* getApps(dateStr, toDateStr, platform, appStatus, page, pageSize, userId, query) {

    var where = {};

    if (query !== undefined) {
        where.name = { $regex: query, $options: 'i' };
    }

    var responseDate = '';
    if (dateStr !== undefined) {
        var date = new Date(dateStr);
        var toDate = new Date(date.getTime() + DAY_MILLISECONDS);
        if (toDateStr !== undefined) {
            var toDateFromString = new Date(toDateStr);
            toDate = new Date(toDateFromString.getTime() + DAY_MILLISECONDS);
        }
        where.createdAt = { '$gte': new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()), '$lt': toDate.toISOString() };
        responseDate += date.getUTCFullYear() + '-' + (date.getUTCMonth() + 1) + '-' + date.getUTCDate();
    }

    where.platform = platform;

    if (appStatus !== APP_STATUS_FILTER.ALL) {
        where.status = appStatus;
    }

    var query = App.find(where).deepPopulate('votes.user').populate('categories').populate('createdBy');
    query.sort({ votesCount: 'desc', createdAt: 'desc' });

    var result = yield PaginationHandler.getPaginatedResultsWithName(query, 'apps', page, pageSize);
    result.apps = convertToArray(result.apps);
    yield formatApps(userId, result.apps);

    result.date = responseDate;
    return result;
}

function* filterApps(packages, platform) {
    var existingApps = yield App.find({ 'package': { $in: packages } }).exec();
    var existingAppsPackages = [];
    for (var i in existingApps) {
        existingAppsPackages.push(existingApps[i]['package']);
    }

    var appsToBeAdded = _.difference(packages, existingAppsPackages);
    var packagesResult = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = appsToBeAdded[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var app = _step.value;

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

    return { 'availablePackages': packagesResult, 'existingPackages': existingAppsPackages };
}

function* getApp(appId, userId) {
    var app = yield App.findById(appId).deepPopulate('votes.user').populate('createdBy categories').exec();
    if (!app) {
        return Boom.notFound('App can not be found!');
    }
    app = app.toObject();
    if (userId !== undefined) {
        app.hasVoted = VotesHandler.hasUserVotedForApp(app, userId);
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

    app.categories = categories;
    return app;
}

function* searchApps(q, platform, status, page, pageSize, userId) {
    var where = { name: { $regex: q, $options: 'i' } };
    where.platform = platform;
    if (status !== undefined) {
        where.status = status;
    } else {
        where.status = APP_STATUSES.APPROVED;
    }

    var query = App.find(where).deepPopulate('votes.user').populate('categories').populate('createdBy');
    query.sort({ votesCount: 'desc', createdAt: 'desc' });

    var result = yield PaginationHandler.getPaginatedResultsWithName(query, 'apps', page, pageSize);
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
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = apps[i].categories[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var category = _step3.value;

                categories.push(category.name);
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

        apps[i].categories = categories;
    }

    removeUnusedFields(apps);
}