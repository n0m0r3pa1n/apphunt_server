'use strict';

var Mongoose = require('mongoose');
//var dbURI = 'mongodb://localhost/apphunt'
// Dev DB URI
//var dbURI = 'mongodb://NaSp:fmi123@ds031877.mongolab.com:31877/heroku_948fv92g'
// Prod DB URI
var dbURI = 'mongodb://NaughtySpirit:fmi123@ds031531.mongolab.com:31531/heroku_app33343837';

Mongoose.connect(dbURI);

var Co = require('co');
var App = require('../models').App;
var DevsHunter = require('../handlers/utils/devs_hunter_handler');

Co(function* () {
    var apps = yield App.find({ $or: [{ screenshots: [] }, { screenshots: undefined }] }).exec();
    var size = apps.length;
    console.log('Updating ' + apps.length);
    var i = 0;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = apps[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var app = _step.value;

            i++;
            var parsedApp = yield DevsHunter.getAndroidApp(app['package']);
            if (parsedApp == null) {
                console.log('Null ' + i);
                continue;
            }
            console.log('Update ' + i + ' of ' + size);
            app.screenshots = parsedApp.screenshots;
            yield app.save();
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