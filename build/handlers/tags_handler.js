'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.saveTagsForApp = saveTagsForApp;
exports.saveTagsForCollection = saveTagsForCollection;
exports.getTagSuggestions = getTagSuggestions;
exports.getAppsForTags = getAppsForTags;
exports.getCollectionsForTags = getCollectionsForTags;
exports.getItemsForTag = getItemsForTag;
exports.getTagsForCollection = getTagsForCollection;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _apps_handlerJs = require('./apps_handler.js');

var AppsHandler = _interopRequireWildcard(_apps_handlerJs);

var _apps_collections_handlerJs = require('./apps_collections_handler.js');

var AppsCollectionsHandler = _interopRequireWildcard(_apps_collections_handlerJs);

var _ = require('underscore');

var Config = require('../config/config');
var TAG_TYPES = Config.TAG_TYPES;
var STATUS_CODES = Config.STATUS_CODES;

var Models = require('../models');
var Tag = Models.Tag;

function* saveTagsForApp(tags, appId, appName, categories) {
    if (tags == undefined) {
        tags = [];
    }

    var appCategoriesTags = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = categories[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var category = _step.value;

            appCategoriesTags = appCategoriesTags.concat(getTagsFromName(category));
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator['return']) {
                _iterator['return']();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    var appNameTags = getTagsFromName(appName);
    tags = tags.concat(appCategoriesTags);
    tags = tags.concat(appNameTags);

    yield updateTags(tags, appId, TAG_TYPES.APPLICATION);
}

function* saveTagsForCollection(tags, collectionId, collectionName) {
    if (tags == undefined) {
        tags = [];
    }

    var collectionNameTags = getTagsFromName(collectionName);
    tags = tags.concat(collectionNameTags);

    yield updateTags(tags, collectionId, TAG_TYPES.COLLECTION);
}

function* updateTags(tags, itemId, tagType) {
    tags = _.uniq(tags);
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = tags[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var tag = _step2.value;

            var createdTag = yield Tag.findOneOrCreate({ name: tag, type: tagType }, { name: tag, type: tagType, itemIds: [itemId] });
            if (createdTag.itemIds == null || createdTag.itemIds.length == 0) {
                createdTag.itemIds = [];
                createdTag.itemIds.push(itemId);
            } else if (!doesArrayContains(createdTag.itemIds, itemId)) {
                createdTag.itemIds.push(itemId);
            }

            yield createdTag.save();
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                _iterator2['return']();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }
}

function* getTagSuggestions(name) {
    var tags = yield Tag.find({ name: { $regex: '^' + name, $options: 'i' } });
    var response = [];
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = tags[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var tag = _step3.value;

            response.push(tag.name);
        }
    } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion3 && _iterator3['return']) {
                _iterator3['return']();
            }
        } finally {
            if (_didIteratorError3) {
                throw _iteratorError3;
            }
        }
    }

    return { tags: response };
}

function* getAppsForTags(names, userId) {
    var tags = [];
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = names[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var _name = _step4.value;

            var tag = yield Tag.findOne({ name: { $regex: _name, $options: 'i' }, type: TAG_TYPES.APPLICATION });
            if (tag !== null) {
                tags.push(tag);
            }
        }
    } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion4 && _iterator4['return']) {
                _iterator4['return']();
            }
        } finally {
            if (_didIteratorError4) {
                throw _iteratorError4;
            }
        }
    }

    if (tags.length == 0) {
        return [];
    }

    var itemIds = getSortedItemIds(tags);

    var apps = [];
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
        for (var _iterator5 = itemIds[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var appId = _step5.value;

            var app = yield AppsHandler.getApp(appId, userId);
            if (app.statusCode == undefined) {
                apps.push(app);
            }
        }
    } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion5 && _iterator5['return']) {
                _iterator5['return']();
            }
        } finally {
            if (_didIteratorError5) {
                throw _iteratorError5;
            }
        }
    }

    return apps;
}

function* getCollectionsForTags(names, userId) {
    var tags = [];
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
        for (var _iterator6 = names[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var _name2 = _step6.value;

            var tag = yield Tag.findOne({ name: { $regex: _name2, $options: 'i' }, type: TAG_TYPES.COLLECTION });
            if (tag !== null) {
                tags.push(tag);
            }
        }
    } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion6 && _iterator6['return']) {
                _iterator6['return']();
            }
        } finally {
            if (_didIteratorError6) {
                throw _iteratorError6;
            }
        }
    }

    if (tags.length == 0) {
        return [];
    }

    var itemIds = getSortedItemIds(tags);

    var collections = [];
    var _iteratorNormalCompletion7 = true;
    var _didIteratorError7 = false;
    var _iteratorError7 = undefined;

    try {
        for (var _iterator7 = itemIds[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            var collectionId = _step7.value;

            var collection = yield AppsCollectionsHandler.get(collectionId, userId);
            if (collection != null) {
                collections.push(collection);
            }
        }
    } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion7 && _iterator7['return']) {
                _iterator7['return']();
            }
        } finally {
            if (_didIteratorError7) {
                throw _iteratorError7;
            }
        }
    }

    return collections;
}

function* getItemsForTag(names, userId) {
    var apps = yield getAppsForTags(names, userId);
    var collections = yield getCollectionsForTags(names, userId);

    return {
        apps: apps,
        collections: collections
    };
}

function* getTagsForCollection(collectionId) {
    var tags = yield Tag.find({ itemId: collectionId, type: TAG_TYPES.COLLECTION }).exec();
    var tagsObj = [];
    var _iteratorNormalCompletion8 = true;
    var _didIteratorError8 = false;
    var _iteratorError8 = undefined;

    try {
        for (var _iterator8 = tags[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
            var tag = _step8.value;

            tagsObj.push(tag.name);
        }
    } catch (err) {
        _didIteratorError8 = true;
        _iteratorError8 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion8 && _iterator8['return']) {
                _iterator8['return']();
            }
        } finally {
            if (_didIteratorError8) {
                throw _iteratorError8;
            }
        }
    }

    return tagsObj;
}

function getTagsFromName(appName) {
    appName = replaceSpecialCharacters(appName);
    var split = appName.split(' ');
    var tags = [];
    var _iteratorNormalCompletion9 = true;
    var _didIteratorError9 = false;
    var _iteratorError9 = undefined;

    try {
        for (var _iterator9 = split[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
            var str = _step9.value;

            if (str === ' ' || str === '') {
                continue;
            }
            tags.push(str);
        }
    } catch (err) {
        _didIteratorError9 = true;
        _iteratorError9 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion9 && _iterator9['return']) {
                _iterator9['return']();
            }
        } finally {
            if (_didIteratorError9) {
                throw _iteratorError9;
            }
        }
    }

    return tags;
}

function replaceSpecialCharacters(str) {
    return str.replace(/[^\w\s]/gi, '');
}

function getSortedItemIds(tags) {
    var itemIds = [];
    var _iteratorNormalCompletion10 = true;
    var _didIteratorError10 = false;
    var _iteratorError10 = undefined;

    try {
        for (var _iterator10 = tags[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
            var tag = _step10.value;
            var _iteratorNormalCompletion11 = true;
            var _didIteratorError11 = false;
            var _iteratorError11 = undefined;

            try {
                for (var _iterator11 = tag.itemIds[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                    var tagItemId = _step11.value;

                    itemIds.push(String(tagItemId));
                }
            } catch (err) {
                _didIteratorError11 = true;
                _iteratorError11 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion11 && _iterator11['return']) {
                        _iterator11['return']();
                    }
                } finally {
                    if (_didIteratorError11) {
                        throw _iteratorError11;
                    }
                }
            }
        }
    } catch (err) {
        _didIteratorError10 = true;
        _iteratorError10 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion10 && _iterator10['return']) {
                _iterator10['return']();
            }
        } finally {
            if (_didIteratorError10) {
                throw _iteratorError10;
            }
        }
    }

    return sortByFrequency(itemIds);
}

function sortByFrequency(array) {
    var frequency = {};

    array.forEach(function (value) {
        frequency[value] = 0;
    });

    var uniques = array.filter(function (value) {
        return ++frequency[value] == 1;
    });

    return uniques.sort(function (a, b) {
        return frequency[b] - frequency[a];
    });
}

function doesArrayContains(array, id) {
    var _iteratorNormalCompletion12 = true;
    var _didIteratorError12 = false;
    var _iteratorError12 = undefined;

    try {
        for (var _iterator12 = array[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
            var arrayId = _step12.value;

            if (String(arrayId) === String(id)) {
                return true;
            }
        }
    } catch (err) {
        _didIteratorError12 = true;
        _iteratorError12 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion12 && _iterator12['return']) {
                _iterator12['return']();
            }
        } finally {
            if (_didIteratorError12) {
                throw _iteratorError12;
            }
        }
    }

    return false;
}