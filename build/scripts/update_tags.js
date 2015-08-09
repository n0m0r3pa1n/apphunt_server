'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _handlersApps_handlerJs = require('../handlers/apps_handler.js');

var AppsHandler = _interopRequireWildcard(_handlersApps_handlerJs);

var _handlersApps_collections_handlerJs = require('../handlers/apps_collections_handler.js');

var AppCollectionsHandler = _interopRequireWildcard(_handlersApps_collections_handlerJs);

var _handlersTags_handlerJs = require('../handlers/tags_handler.js');

var TagsHandler = _interopRequireWildcard(_handlersTags_handlerJs);

var Mongoose = require('mongoose');
//var dbURI = 'mongodb://localhost/apphunt'
// Dev DB URI
var dbURI = 'mongodb://NaSp:fmi123@ds031877.mongolab.com:31877/heroku_948fv92g';
// Prod DB URI
//var dbURI = 'mongodb://NaughtySpirit:fmi123@ds031531.mongolab.com:31531/heroku_app33343837'

Mongoose.connect(dbURI, function (err, obj) {
    console.log(err);
    console.log(obj);
});

var Co = require('co');
var CONFIG = require('../config/config');
var PLATFORMS = CONFIG.PLATFORMS;
var APP_STATUS_FILTER = CONFIG.APP_STATUSES_FILTER;

var App = require('../models').App;

Co(function* () {
    console.log('AAAAAAAAAA');
    var appps2 = yield App.findOne();
    console.log(appps2);
    var i = 0;
    var result = yield AppsHandler.getApps(undefined, undefined, 'Android', APP_STATUS_FILTER.ALL, 0, 0, undefined, undefined);
    console.log(result);
    var appLength = result.apps.length;
    var collections = yield AppCollectionsHandler.getCollections(undefined, undefined, undefined, 0, 0);
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = result.apps[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var app = _step.value;

            var appTags = yield TagsHandler.getTagsForApp(app._id);
            if (appTags.length > 0) {
                continue;
            }
            i++;
            yield TagsHandler.saveTagsForApp([], app._id, app.name, app.categories);
            console.log('Updating ' + i + ' of ' + appLength);
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
});