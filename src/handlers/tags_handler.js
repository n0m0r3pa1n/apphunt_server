var _ = require('underscore')

var Config = require('../config/config')
var TAG_TYPES = Config.TAG_TYPES

var Models = require('../models')
var Tag = Models.Tag

import * as AppsHandler from './apps_handler.js'

export function* saveTagsForApp(tags, appId) {
    if(tags == undefined) {
        return;
    }

    for (let tag of tags) {
        var createdTag = yield Tag.findOneOrCreate({name: tag}, {name: tag, type: TAG_TYPES.APPLICATION, itemIds: [appId]})
        if(createdTag.itemIds == null || createdTag.itemIds.length == 0) {
            createdTag.itemIds = []
            createdTag.itemIds.push(appId)
        } else if(!doesArrayContains(createdTag.itemIds, appId)) {
            createdTag.itemIds.push(appId)
        }

        yield createdTag.save()
    }
}

function doesArrayContains(array, id) {
    for(let arrayId of array) {
        if(String(arrayId) === String(id)) {
            return true;
        }
    }

    return false;
}

export function* getAppsForTags(names) {
    let tags = []
    for(let name of names) {
        let tag = yield Tag.findOne({name: name})
        if(tag !== null) {
            tags.push(tag)
        }
    }

    if(tags.length == 0) {
        return []
    }

    var apps = []
    for(let tag of tags) {
        for(let appId of tag.itemIds) {
            var app = yield AppsHandler.getApp(appId)
            if(app != null) {
                apps.push(app)
            }
        }
    }

    return apps
}