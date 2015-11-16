//var Mongoose = require('mongoose')
//var JSExtensions = require('../utils/extension_utils')
////var dbURI = 'mongodb://localhost/apphunt'
//var ObjectId = require('mongodb').ObjectId
//// Dev DB URI
////var dbURI = 'mongodb://NaSp:fmi123@ds031877.mongolab.com:31877/heroku_948fv92g'
//// Prod DB URI
//var dbURI = 'mongodb://NaughtySpirit:fmi123@ds031531.mongolab.com:31531/heroku_app33343837'
//
//Mongoose.connect(dbURI)
//
//var Co = require('co')
//var Anonymous = require('../models').Anonymous
//
//var CONFIG = require('../config/config')
//var PLATFORMS = CONFIG.PLATFORMS
//var APP_STATUS_FILTER = CONFIG.APP_STATUSES_FILTER
//
//Co(function* () {
//
//    let anonymous = yield Anonymous.find({})
//    let i = 0
//    for(let anon of anonymous) {
//        if(anon.createdAt == undefined) {
//            i++
//            anon.createdAt = ObjectId(anon.id).getTimestamp()
//            anon.updatedAt = ObjectId(anon.id).getTimestamp()
//            yield anon.save()
//        }
//    }
//})
