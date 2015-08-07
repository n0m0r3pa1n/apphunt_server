var _ = require('underscore')

var Config = require('../config/config')
var TAG_TYPES = Config.TAG_TYPES
var STATUS_CODES = Config.STATUS_CODES

var Models = require('../models')
var Tag = Models.Tag

import * as AppsHandler from './apps_handler.js'
import * as AppsCollectionsHandler from './apps_collections_handler.js'

export function* saveTagsForApp(tags, appId, appName, categories) {
    if(tags == undefined) {
        tags = [];
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

export function* saveTagsForCollection(tags, collectionId, collectionName) {
    if(tags == undefined) {
        tags = [];
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

    return {tags: response }
}

export function* getAppsForTags(names, userId) {
    let tags = []
    for(let name of names) {
        let tag = yield Tag.findOne({name: {$regex: name, $options: 'i'}, type: TAG_TYPES.APPLICATION})
        if(tag !== null) {
            tags.push(tag)
        }
    }

    if(tags.length == 0) {
        return []
    }

    let itemIds = getSortedItemIds(tags);

    var apps = []
    for(let appId of itemIds) {
        var app = yield AppsHandler.getApp(appId, userId)
        if(app.statusCode == undefined) {
            apps.push(app)
        }
    }

    return apps
}


export function* getCollectionsForTags(names, userId) {
    let tags = []
    for(let name of names) {
        let tag = yield Tag.findOne({name: {$regex: name, $options: 'i'}, type: TAG_TYPES.COLLECTION})
        if(tag !== null) {
            tags.push(tag)
        }
    }
    if(tags.length == 0) {
        return []
    }

    let itemIds = getSortedItemIds(tags);

    var collections = []
    for(let collectionId of itemIds) {
        var collection = yield AppsCollectionsHandler.get(collectionId, userId)
        if(collection != null) {
            collections.push(collection)
        }
    }

    return collections
}

export function* getItemsForTag(names, userId) {
    let apps = yield getAppsForTags(names, userId);
    let collections = yield getCollectionsForTags(names, userId);

    return {
        apps: apps,
        collections: collections
    }
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

function getSortedItemIds(tags) {
    let itemIds = []
    for (let tag of tags) {
        for(let tagItemId of tag.itemIds) {
            itemIds.push(String(tagItemId))
        }
    }

    return sortByFrequency(itemIds)
}

function sortByFrequency(array) {
    var frequency = {};

    array.forEach(function(value) {
        frequency[value] = 0; });

    var uniques = array.filter(function(value) {
        return ++frequency[value] == 1;
    });

    return uniques.sort(function(a, b) {
        return frequency[b] - frequency[a];
    });
}

function doesArrayContains(array, id) {
    for(let arrayId of array) {
        if(String(arrayId) === String(id)) {
            return true;
        }
    }

    return false;
}