"use strict";

//var Mongoose = require('mongoose')
//var dbURI = 'mongodb://localhost/apphunt'
//// Dev DB URI
////var dbURI = 'mongodb://NaSp:fmi123@ds031877.mongolab.com:31877/heroku_948fv92g'
//// Prod DB URI
////var dbURI = 'mongodb://NaughtySpirit:fmi123@ds031531.mongolab.com:31531/heroku_app33343837'
//
//Mongoose.connect(dbURI, function(err, obj) {
//})
//
//var Co = require('co')
//var CONFIG = require('../config/config')
//var PLATFORMS = CONFIG.PLATFORMS
//var APP_STATUS_FILTER = CONFIG.APP_STATUSES_FILTER
//
//var App = require('../models').App
//
//import * as AppsHandler from '../handlers/apps_handler.js'
//import * as AppCollectionsHandler from '../handlers/apps_collections_handler.js'
//import * as TagsHandler from '../handlers/tags_handler.js'
//
//Co(function* () {
//    let appps2 = yield App.findOne()
//    let i =0;
//    //let result = yield AppsHandler.getApps(undefined, undefined, "Android", APP_STATUS_FILTER.ALL, 0, 0, undefined, undefined)
//    //console.log(result.apps.length)
//    //let appLength = result.apps.length
//    //
//    //for(let app of result.apps) {
//    //    let appTags = yield TagsHandler.getTagsForApp(app._id)
//    //    if(appTags.length > 0) {
//    //        continue;
//    //    }
//    //    i++;
//    //    yield TagsHandler.saveTagsForApp([], app._id, app.name, app.categories == undefined ? [] : app.categories)
//    //    console.log("Updating " + i + " of " + appLength)
//    //}
//    console.log("==================================")
//    console.log("Collections")
//    let collectionsResult = yield AppCollectionsHandler.getCollections(undefined, undefined, undefined, 0, 0);
//    let collectionsLength = collectionsResult.collections.length;
//    for(let collection of collectionsResult.collections) {
//        let collectionTags = yield TagsHandler.getTagsForCollection(collection._id)
//        if(collectionTags.length > 0) {
//            continue;
//        }
//        i++;
//        yield TagsHandler.saveTagsForCollection([], collection._id, collection.name)
//        console.log("Updating " + i + " of " + collectionsLength)
//    }
//})