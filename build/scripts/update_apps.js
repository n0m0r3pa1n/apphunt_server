'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _handlersApps_handlerJs = require('../handlers/apps_handler.js');

var AppsHandler = _interopRequireWildcard(_handlersApps_handlerJs);

var _handlersVotes_handlerJs = require('../handlers/votes_handler.js');

var VotesHandler = _interopRequireWildcard(_handlersVotes_handlerJs);

var Mongoose = require('mongoose');
var JSExtensions = require('../utils/extension_utils');
//var dbURI = 'mongodb://localhost/apphunt'
// Dev DB URI
//var dbURI = 'mongodb://NaSp:fmi123@ds031877.mongolab.com:31877/heroku_948fv92g'
// Prod DB URI
//var dbURI = 'mongodb://NaughtySpirit:fmi123@ds031531.mongolab.com:31531/heroku_app33343837'
var dbURI = process.env.MONGOLAB_URI || 'mongodb://localhost/apphunt';

Mongoose.connect(dbURI);

var Co = require('co');
var App = require('../models').App;
var Vote = require('../models').Vote;
var AppsCollection = require("../models").AppsCollection;
var Comment = require("../models").Comment;
var DevsHunter = require('../handlers/utils/devs_hunter_handler');

var CONFIG = require('../config/config');
var PLATFORMS = CONFIG.PLATFORMS;
var APP_STATUS_FILTER = CONFIG.APP_STATUSES_FILTER;

Co(function* () {
    var c = yield App.find({ "votes": "56748434162cf80300d5fa94" });

    var votesCount = yield Vote.count();
    var deletedVotes = 0;
    var votesToDelete = [];
    for (var i = 0; i < votesCount; i = i + 1000) {
        var votes = yield Vote.find({}).skip(i).limit(1000);
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = votes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var vote = _step.value;

                var app = yield App.findOne({ 'votes': vote._id });
                if (app == null) {
                    var collection = yield AppsCollection.find({ "votes": vote._id });
                    var comment = yield Comment.find({ "votes": vote._id });
                    if (collection.length == 0 && comment.length == 0) {
                        deletedVotes++;
                        votesToDelete.push(vote._id);
                        console.log("EMPTY", vote._id);
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
    }

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = votesToDelete[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var voteId = _step2.value;

            yield Vote.remove({ _id: voteId }).exec();
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

    console.log("Deleted " + deletedVotes + " from " + votesCount);
    //var i = 0;
    //for(let vote of votes) {
    //    i ++
    //    let app = yield App.findOne({'votes': vote._id})
    //    //console.log("App vote:", vote._id)
    //    if(app == null) {
    //        console.log("NULLLLL", vote._id, i)
    //        var collection = yield AppsCollection.find({"votes": vote._id})
    //        var comment = yield Comment.find({"votes": vote._id})
    //        //console.log("Collection", collection)
    //        //console.log("Comment", comment)
    //        if(collection.length == 0 && comment.length == 0){
    //         console.log("EMPTY", vote._id)
    //        }
    //        continue;
    //    }
    //
    //}
    console.log("AAAAA");

    ////let apps = yield App.find({status: APP_STATUS_FILTER.APPROVED, platform: PLATFORMS.Android}).exec()
    ////let size = apps.length
    //
    ////let nullApps = 0
    ////for(let i = 1200; i < size; i++) {
    //    //let app = apps[i]
    //    let parsedApp = yield DevsHunter.updateAndroidApp("jlelse.readit")
    //    if(parsedApp == null) {
    //        console.log("Null " + i + " " + app.package)
    //        //nullApps++;
    //        //yield AppsHandler.deleteApp(app.package)
    //        //continue;
    //    }
    //    let app = yield App.findOne({package: 'jlelse.readit'}).exec()
    //    console.log(app)
    //    app.screenshots = parsedApp.screenshots
    //    app.name = parsedApp.name
    //    app.isFree = parsedApp.isFree
    //    app.icon = parsedApp.icon
    //    app.url = parsedApp.url
    //    app.averageScore = parsedApp.score.total == undefined ? 0 : parsedApp.score.total
    //    yield app.save(function(err, obj) {
    //        console.log("AAAAAAAAA")
    //        console.log(err)
    //        console.log(obj)
    //    })
    ////}
    //
    //console.log(`Finished with ${nullApps} null apps`)
});