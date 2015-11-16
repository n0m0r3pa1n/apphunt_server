'use strict';

var Mongoose = require('mongoose');
var JSExtensions = require('../utils/extension_utils');
//var dbURI = 'mongodb://localhost/apphunt'
var ObjectId = require('mongodb').ObjectId;
// Dev DB URI
//var dbURI = 'mongodb://NaSp:fmi123@ds031877.mongolab.com:31877/heroku_948fv92g'
// Prod DB URI
var dbURI = 'mongodb://NaughtySpirit:fmi123@ds031531.mongolab.com:31531/heroku_app33343837';

Mongoose.connect(dbURI);

var Co = require('co');
var Anonymous = require('../models').Anonymous;

var CONFIG = require('../config/config');
var PLATFORMS = CONFIG.PLATFORMS;
var APP_STATUS_FILTER = CONFIG.APP_STATUSES_FILTER;

Co(function* () {

    var anonymous = yield Anonymous.find({});
    var i = 0;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = anonymous[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var anon = _step.value;

            if (anon.createdAt == undefined) {
                i++;
                anon.createdAt = ObjectId(anon.id).getTimestamp();
                anon.updatedAt = ObjectId(anon.id).getTimestamp();
                yield anon.save();
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

    console.log("AAAAAAAAAAAAAAAAAAAAAAA", i);
});