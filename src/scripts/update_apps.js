var Mongoose = require('mongoose')
var JSExtensions = require('../utils/extension_utils')
//var dbURI = 'mongodb://localhost/apphunt'
// Dev DB URI
//var dbURI = 'mongodb://NaSp:fmi123@ds031877.mongolab.com:31877/heroku_948fv92g'
// Prod DB URI
//var dbURI = 'mongodb://NaughtySpirit:fmi123@ds031531.mongolab.com:31531/heroku_app33343837'
var dbURI = process.env.MONGOLAB_URI || 'mongodb://localhost/apphunt'

Mongoose.connect(dbURI)

var Co = require('co')
var mongoose = require('mongoose');
var App = require('../models').App
var Vote = require('../models').Vote
var History = require('../models').History
var AppsCollection = require("../models").AppsCollection
var Comment = require("../models").Comment
var DevsHunter = require('../handlers/utils/devs_hunter_handler')
import * as AppsHandler from '../handlers/apps_handler.js'
import * as HistoryHandler from '../handlers/history_handler.js'
var VotesHandler = require('../handlers/votes_handler.js')

var CONFIG = require('../config/config')
var PLATFORMS = CONFIG.PLATFORMS
var LOGIN_TYPES = CONFIG.LOGIN_TYPES
var APP_STATUS_FILTER = CONFIG.APP_STATUSES_FILTER
var HISTORY_EVENT_TYPES = CONFIG.HISTORY_EVENT_TYPES

Co(function* () {
    var toDate = new Date()

    var fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - 31);
    let votes = yield VotesHandler.getVotes(fromDate, toDate)
    let i =0
    for(let vote of votes) {
        let app = yield App.findOne({'votes': vote._id}).populate('createdBy')
        if(app == null || vote.user.loginType == LOGIN_TYPES.Fake) {
            console.log('NULL')
            continue;
        }
        i++
        let historyEvent = yield History.create({type: HISTORY_EVENT_TYPES.APP_VOTED, user: vote.user, params: {
            appId: app._id
        }})

        console.log(i)
        historyEvent.createdAt = vote.createdAt
        yield historyEvent.save(function(err, obj) {
        })
    }
    console.log("Votes: " + i)

    //561f7d783a6a7a0300bffad5

    let historyEvents = yield History.find({type: HISTORY_EVENT_TYPES.USER_MENTIONED}).exec()
    for (let event of historyEvents) {

        var params = event.params
        params.appId = mongoose.Types.ObjectId(event.params.appId)
        yield History.update({_id: event._id}, {params: params})
    }

    console.log("FINISHED")
})
