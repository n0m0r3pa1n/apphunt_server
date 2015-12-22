'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _handlersApps_handlerJs = require('../handlers/apps_handler.js');

var AppsHandler = _interopRequireWildcard(_handlersApps_handlerJs);

var _handlersHistory_handlerJs = require('../handlers/history_handler.js');

var HistoryHandler = _interopRequireWildcard(_handlersHistory_handlerJs);

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
var mongoose = require('mongoose');
var App = require('../models').App;
var Vote = require('../models').Vote;
var History = require('../models').History;
var AppsCollection = require("../models").AppsCollection;
var Comment = require("../models").Comment;
var DevsHunter = require('../handlers/utils/devs_hunter_handler');

var VotesHandler = require('../handlers/votes_handler.js');

var CONFIG = require('../config/config');
var PLATFORMS = CONFIG.PLATFORMS;
var LOGIN_TYPES = CONFIG.LOGIN_TYPES;
var APP_STATUS_FILTER = CONFIG.APP_STATUSES_FILTER;
var HISTORY_EVENT_TYPES = CONFIG.HISTORY_EVENT_TYPES;

Co(function* () {
    var toDate = new Date();

    var fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 31);
    var votes = yield VotesHandler.getVotes(fromDate, toDate);
    var i = 0;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = votes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var vote = _step.value;

            var app = yield App.findOne({ 'votes': vote._id }).populate('createdBy');
            if (app == null || vote.user.loginType == LOGIN_TYPES.Fake) {
                console.log('NULL');
                continue;
            }
            i++;
            var historyEvent = yield History.create({ type: HISTORY_EVENT_TYPES.APP_VOTED, user: vote.user, params: {
                    appId: app._id
                } });

            console.log(i);
            historyEvent.createdAt = vote.createdAt;
            yield historyEvent.save(function (err, obj) {});
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

    console.log("Votes: " + i);

    //561f7d783a6a7a0300bffad5
    //let historyEvents = yield History.findOne({_id: '562ba9e825940f0300536697'})
    //console.log(historyEvents)
    //var params = historyEvents.params
    //params.appId = mongoose.Types.ObjectId("561f7d783a6a7a0300bffad5")
    //console.log("params:", params)

    //historyEvents = historyEvents.toObject()
    //historyEvents.params = params
    //historyEvents.params.appId = mongoose.Types.ObjectId("562ba9e825940f0300536697")

    //yield History.update({_id: historyEvents._id}, {params: params})
    //
    //historyEvents = yield History.findOne({_id: '562ba9e825940f0300536697'})
    //console.log(historyEvents)
    //let historyEvents = yield History.find({type: HISTORY_EVENT_TYPES.USER_MENTIONED}).exec()
    //for (let event of historyEvents) {
    //
    //    var params = event.params
    //    params.appId = mongoose.Types.ObjectId(event.params.appId)
    //    yield History.update({_id: event._id}, {params: params})
    //}

    //let commentEvent = yield History.findOne({type: HISTORY_EVENT_TYPES.USER_COMMENT})
    //console.log(commentEvent)

    console.log("FINISHED");
});