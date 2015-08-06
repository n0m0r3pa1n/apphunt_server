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

    yield updateTags(tags, appId, TAG_TYPES.APPLICATION);
}

export function* saveTagsForCollection(tags, collectionId) {
    if(tags == undefined) {
        return;
    }

    yield updateTags(tags, collectionId, TAG_TYPES.COLLECTION);
}

function* updateTags(tags, itemId, tagType) {
    for (let tag of tags) {
        var createdTag = yield Tag.findOneOrCreate({name: tag, type: tagType},
            {name: tag, type: tagType, itemIds: [itemId]})
        if (createdTag.itemIds == null || createdTag.itemIds.length == 0) {
            createdTag.itemIds = []
            createdTag.itemIds.push(itemId)
        } else if (!doesArrayContains(createdTag.itemIds, itemId)) {
            createdTag.itemIds.push(itemId)
        }

        yield createdTag.save()
    }
}

export function* getTagSuggestions(name) {
    let tags = yield Tag.find({name: {$regex: name, $options: 'i'}})
    let response = []
    for(let tag of tags) {
        response.push(tag.name)
    }

    return response
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

export function* getCollectionsForTags(names) {
    //TODO finish logic for getting collections by tags
    return []
}

function doesArrayContains(array, id) {
    for(let arrayId of array) {
        if(String(arrayId) === String(id)) {
            return true;
        }
    }

    return false;
}