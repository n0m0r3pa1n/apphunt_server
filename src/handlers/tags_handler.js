var _ = require('underscore')

var Config = require('../config/config')
var TAG_TYPES = Config.TAG_TYPES

var Models = require('../models')
var Tag = Models.Tag

import * as AppsHandler from './apps_handler.js'

export function* saveTagsForApp(tags, appId, appName, categories) {
    if(tags == undefined) {
        return;
    }
    let appCategoriesTags = []
    for(let category of categories) {
        appCategoriesTags = appCategoriesTags.concat(getTagsFromName(category))
    }

    let appNameTags = getTagsFromName(appName)
    tags = tags.concat(appCategoriesTags)
    tags = tags.concat(appNameTags)

    yield updateTags(tags, appId, TAG_TYPES.APPLICATION);
}

function getTagsFromName(appName) {
    appName = replaceSpecialCharacters(appName)
    let split = appName.split(" ")
    let tags = []
    for(let str of split) {
        if(str === ' ' || str === '') {
            continue;
        }
        tags.push(str)
    }
    return tags
}

function replaceSpecialCharacters(str) {
    return str.replace(/[^\w\s]/gi, '')
}

export function* saveTagsForCollection(tags, collectionId, collectionName) {
    if(tags == undefined) {
        return;
    }

    let collectionNameTags = getTagsFromName(collectionName)
    tags = tags.concat(collectionNameTags)

    yield updateTags(tags, collectionId, TAG_TYPES.COLLECTION);
}

function* updateTags(tags, itemId, tagType) {
    tags = _.uniq(tags)
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
        let tag = yield Tag.findOne({name: {$regex: name, $options: 'i'}})
        if(tag !== null) {
            tags.push(tag)
        }
    }

    if(tags.length == 0) {
        return []
    }

    let itemIds = getUniqueItemIds(tags);

    var apps = []
    for(let appId of itemIds) {
        var app = yield AppsHandler.getApp(appId)
        if(app != null) {
            apps.push(app)
        }
    }

    return apps
}

function getUniqueItemIds(tags) {
    let itemIds = []
    for (let tag of tags) {
        itemIds = itemIds.concat(String(tag.itemIds))
    }

    return _.uniq(itemIds)
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