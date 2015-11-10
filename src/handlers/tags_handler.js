var _ = require('underscore')

var Config = require('../config/config')
var TAG_TYPES = Config.TAG_TYPES
var STATUS_CODES = Config.STATUS_CODES
var APP_STATUSES = Config.APP_STATUSES
var COLLECTION_STATUSES = Config.COLLECTION_STATUSES

var Models = require('../models')
var Tag = Models.Tag

import * as AppsHandler from './apps_handler.js'
import * as AppsCollectionsHandler from './apps_collections_handler.js'
import * as PaginationHandler from './pagination_handler.js'

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
        tag = tag.toLowerCase()
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
    let tags = yield Tag.find({name: {$regex: '^' + name, $options: 'i'}})
    let response = []
    for(let tag of tags) {
        response.push(tag.name)
    }

    return {tags: response }
}

export function* getAppsForTags(names, userId, page, pageSize) {
    var response = {
        page: 0,
        totalCount: 0,
        totalPages: 0,
        apps: []
    }
    let tags = []
    for(let name of names) {
        let tag = yield Tag.findOne({name: {$regex: '^' + name + '$', $options: 'i'}, type: TAG_TYPES.APPLICATION})
        if(tag !== null) {
            tags.push(tag)
        }
    }

    if(tags.length == 0) {
        return response
    }
    let itemIds = getSortedItemIds(tags);
    if(page != 0 && pageSize != 0) {
        response = PaginationHandler.getPaginationWithResults(itemIds, page, pageSize)
        itemIds = response.results;
    } else {
        response.totalCount = itemIds.length
    }
    var apps = []
    for(let appId of itemIds) {
        var app = yield AppsHandler.getApp(appId, userId)
        if(app.statusCode == undefined && app.status == APP_STATUSES.APPROVED) {
            apps.push(app)
        }
    }
    delete response.results
    response.apps = apps;
    return response
}


export function* getCollectionsForTags(names, userId, page, pageSize) {
    var response = {
        page: 0,
        totalCount: 0,
        totalPages: 0,
        collections: []
    }
    let tags = []
    for(let name of names) {
        let tag = yield Tag.findOne({name: {$regex: '^' + name + '$', $options: 'i'}, type: TAG_TYPES.COLLECTION})
        if(tag !== null) {
            tags.push(tag)
        }
    }

    if(tags.length == 0) {
        return response
    }

    var itemIds = getSortedItemIds(tags);
    var collections = []
    for(let collectionId of itemIds) {
        var collection = yield AppsCollectionsHandler.get(collectionId, userId)
        if(collection != null && collection.status == COLLECTION_STATUSES.PUBLIC) {
            collections.push(collection)
        }
    }
    if(page != 0 && pageSize != 0) {
        response = PaginationHandler.getPaginationWithResults(collections, page, pageSize, "collections")
    } else {
        response.collections = collections
        response.totalCount = collections.length
    }

    return response
}

export function* getItemsForTag(names, userId) {
    let apps = yield getAppsForTags(names, userId, 0, 0);
    let collections = yield getCollectionsForTags(names, userId, 0, 0);

    return {
        apps: apps.apps,
        collections: collections.collections
    }
}

export function* getTagsForCollection(collectionId) {
    return yield getTagsForItem(collectionId, TAG_TYPES.COLLECTION)
}

export function* getTagsForApp(appId) {
    return yield getTagsForItem(appId, TAG_TYPES.APPLICATION)
}

export function* removeAppFromTags(appId) {
    let tags = yield Tag.find({itemIds: appId, type: TAG_TYPES.APPLICATION}).exec()
    for(let tag of tags) {
        let index = tag.itemIds.indexOf(appId);
        if (index > -1) {
            tag.itemIds.splice(index, 1);
        }
        yield tag.save()
    }
}


function* getTagsForItem(itemId, tagType) {
    let tags = yield Tag.find({itemIds: itemId, type: tagType}).exec()
    let tagsObj = []
    for(let tag of tags) {
        tagsObj.push(tag.name)
    }

    return tagsObj
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
