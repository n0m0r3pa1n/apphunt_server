var _ = require("underscore")
var Boom = require('boom')

import * as HistoryHandler from './history_handler.js'

var Ad = require('../models').Ad

var HISTORY_EVENT_TYPES = require('../config/config').HISTORY_EVENT_TYPES

var MIN_SUBMTTED_APPS = 1
var MIN_COMMENTS_COUNT = 3
var MIN_COLLECTIONS_CREATED = 1

export function* getAd() {
    let ads = yield Ad.find({}).exec()
    if(ads.length == 0) {
        return {}
    }
    let index = Math.floor(Math.random() * ads.length)
    return ads[index]
}

export function* createAd({name, picture, link}) {
    let ad = new Ad({
        name: name,
        picture: picture,
        link: link
    })

    yield ad.save()

    return Boom.OK()
}

export function* shouldShowAd(userId) {
    let historyEventTypes = [
        HISTORY_EVENT_TYPES.APP_SUBMITTED,
        HISTORY_EVENT_TYPES.USER_COMMENT,
        HISTORY_EVENT_TYPES.COLLECTION_CREATED
    ]

    let recentUserHistory = yield HistoryHandler.getRecentUserActions(userId, historyEventTypes, new Date())
    if(recentUserHistory.events.length == 0) {
        return {shouldShowAd: true};
    }

    let appsSubmitted = 0, comments = 0, collections = 0;
    recentUserHistory.events.map((item) => {
        if(item.type == HISTORY_EVENT_TYPES.APP_SUBMITTED) {
            appsSubmitted++;
        } else if(item.type == HISTORY_EVENT_TYPES.USER_COMMENT) {
            comments++;
        } else if(item.type == HISTORY_EVENT_TYPES.COLLECTION_CREATED) {
            collections++;
        }
    })

    if(appsSubmitted >= MIN_SUBMTTED_APPS ||
        comments >= MIN_COMMENTS_COUNT ||
        collections >= MIN_COLLECTIONS_CREATED) {
        return {shouldShowAd: false}
    }

    return {shouldShowAd: true};
}