"use strict";

//var Mongoose = require('mongoose')
//var JSExtensions = require('../utils/extension_utils')
////var dbURI = 'mongodb://localhost/apphunt'
//// Dev DB URI
////var dbURI = 'mongodb://NaSp:fmi123@ds031877.mongolab.com:31877/heroku_948fv92g'
//// Prod DB URI
//var dbURI = 'mongodb://NaughtySpirit:fmi123@ds031531.mongolab.com:31531/heroku_app33343837'
//
//Mongoose.connect(dbURI)
//
//var Co = require('co')
//var App = require('../models').App
//var DevsHunter = require('../handlers/utils/devs_hunter_handler')
//import * as AppsHandler from '../handlers/apps_handler.js'
//
//var CONFIG = require('../config/config')
//var PLATFORMS = CONFIG.PLATFORMS
//var APP_STATUS_FILTER = CONFIG.APP_STATUSES_FILTER
//
//Co(function* () {
//
//    let apps = yield App.find({status: APP_STATUS_FILTER.APPROVED, platform: PLATFORMS.Android}).exec()
//    let size = apps.length
//
//    let nullApps = 0
//    for(let i = 1200; i < size; i++) {
//        let app = apps[i]
//        let parsedApp = yield DevsHunter.updateAndroidApp(app.package)
//        if(parsedApp == null) {
//            console.log("Null " + i + " " + app.package)
//            nullApps++;
//            yield AppsHandler.deleteApp(app.package)
//            continue;
//        }
//        console.log("Update " + i + " of " + size)
//        app.screenshots = parsedApp.screenshots
//        app.name = parsedApp.name
//        app.isFree = parsedApp.isFree
//        app.icon = parsedApp.icon
//        app.url = parsedApp.url
//        app.averageScore = parsedApp.score.total == undefined ? 0 : parsedApp.score.total
//
//        yield app.save()
//    }
//
//    console.log(`Finished with ${nullApps} null apps`)
//})