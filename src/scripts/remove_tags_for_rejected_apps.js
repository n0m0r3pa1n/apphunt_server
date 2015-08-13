var Mongoose = require('mongoose')
//var dbURI = 'mongodb://localhost/apphunt'
// Dev DB URI
//var dbURI = 'mongodb://NaSp:fmi123@ds031877.mongolab.com:31877/heroku_948fv92g'
// Prod DB URI
var dbURI = 'mongodb://NaughtySpirit:fmi123@ds031531.mongolab.com:31531/heroku_app33343837'

Mongoose.connect(dbURI, function(err, obj) {
})
var db = Mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'));

var Co = require('co')
var _ = require('underscore')
var CONFIG = require('../config/config')
var PLATFORMS = CONFIG.PLATFORMS
var APP_STATUS_FILTER = CONFIG.APP_STATUSES_FILTER
var TAG_TYPES = CONFIG.TAG_TYPES

var Tag = require('../models').Tag
var App = require('../models').App

import * as AppsHandler from '../handlers/apps_handler.js'
import * as AppCollectionsHandler from '../handlers/apps_collections_handler.js'
import * as TagsHandler from '../handlers/tags_handler.js'

Co(function* () {
    let tags = yield Tag.find({}).exec()
    for(let tag of tags) {
        if(tag.type == TAG_TYPES.COLLECTION) {
            continue;
        }
        let itemIdsToRemove = []
        for(let itemId of tag.itemIds) {
            let result = yield App.findById(itemId).exec()
            if(result == null) {
                itemIdsToRemove.push(itemId)
            }
        }
        if(itemIdsToRemove.length > 0) {
            console.log(itemIdsToRemove)
        }

        for(let i of itemIdsToRemove) {
            yield TagsHandler.removeAppFromTags(i)
        }
    }
})
