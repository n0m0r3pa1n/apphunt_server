'use strict';

var Mongoose = require('mongoose');
var dbURI = 'mongodb://localhost/apphunt';

Mongoose.connect(dbURI);

var Co = require('co');
var App = require('../models').App;
var DevsHunter = require('../handlers/utils/devs_hunter_handler');

Co(function* () {
    var apps = yield App.find({ $or: [{ screenshots: [] }, { screenshots: undefined }] }).exec();
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = apps[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var app = _step.value;

            var parsedApp = yield DevsHunter.getAndroidApp(app['package']);
            if (parsedApp == null) {
                continue;
            }
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