'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _handlersApps_handlerJs = require('../handlers/apps_handler.js');

var AppsHandler = _interopRequireWildcard(_handlersApps_handlerJs);

var _handlersApps_collections_handlerJs = require('../handlers/apps_collections_handler.js');

var AppCollectionsHandler = _interopRequireWildcard(_handlersApps_collections_handlerJs);

var _handlersTags_handlerJs = require('../handlers/tags_handler.js');

var TagsHandler = _interopRequireWildcard(_handlersTags_handlerJs);

var Mongoose = require('mongoose');
var dbURI = 'mongodb://localhost/apphunt';
// Dev DB URI
//var dbURI = 'mongodb://NaSp:fmi123@ds031877.mongolab.com:31877/heroku_948fv92g'
// Prod DB URI
//var dbURI = 'mongodb://NaughtySpirit:fmi123@ds031531.mongolab.com:31531/heroku_app33343837'

Mongoose.connect(dbURI, function (err, obj) {});
var db = Mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

var Co = require('co');
var _ = require('underscore');
var CONFIG = require('../config/config');
var PLATFORMS = CONFIG.PLATFORMS;
var APP_STATUS_FILTER = CONFIG.APP_STATUSES_FILTER;
var TAG_TYPES = CONFIG.TAG_TYPES;

var Tag = require('../models').Tag;
var App = require('../models').App;

Co(function* () {
    var tags = yield Tag.find({}).exec();
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = tags[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var tag = _step.value;

            if (tag.type == TAG_TYPES.COLLECTION) {
                continue;
            }
            var itemIdsToRemove = [];
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = tag.itemIds[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var itemId = _step2.value;

                    var result = yield App.findById(itemId).exec();
                    if (result == null || result.platform == PLATFORMS.iOS) {
                        console.log(itemId);
                        itemIdsToRemove.push(itemId);
                    }
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

            if (itemIdsToRemove.length > 0) {
                console.log(itemIdsToRemove);
            }

            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = itemIdsToRemove[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var i = _step3.value;

                    yield TagsHandler.removeAppFromTags(i);
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