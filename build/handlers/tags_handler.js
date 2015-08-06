'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.saveTagsForApp = saveTagsForApp;
exports.saveTagsForCollection = saveTagsForCollection;
exports.getTagSuggestions = getTagSuggestions;
exports.getAppsForTags = getAppsForTags;
exports.getCollectionsForTags = getCollectionsForTags;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _apps_handlerJs = require('./apps_handler.js');

var AppsHandler = _interopRequireWildcard(_apps_handlerJs);

var _ = require('underscore');

var Config = require('../config/config');
var TAG_TYPES = Config.TAG_TYPES;

var Models = require('../models');
var Tag = Models.Tag;

function* saveTagsForApp(tags, appId, appName, categories) {
    if (tags == undefined) {
        return;
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

function getTagsFromName(appName) {
    appName = replaceSpecialCharacters(appName);
    var split = appName.split(' ');
    var tags = [];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = split[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var str = _step2.value;

            if (str === ' ' || str === '') {
                continue;
            }
            tags.push(str);
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

    return tags;
}

function replaceSpecialCharacters(str) {
    return str.replace(/[^\w\s]/gi, '');
}

function* saveTagsForCollection(tags, collectionId, collectionName) {
    if (tags == undefined) {
        return;
    }

    var collectionNameTags = getTagsFromName(collectionName);
    tags = tags.concat(collectionNameTags);

    yield updateTags(tags, collectionId, TAG_TYPES.COLLECTION);
}

function* updateTags(tags, itemId, tagType) {
    tags = _.uniq(tags);
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = tags[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var tag = _step3.value;

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
}

function* getTagSuggestions(name) {
    var tags = yield Tag.find({ name: { $regex: name, $options: 'i' } });
    var response = [];
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = tags[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var tag = _step4.value;

            response.push(tag.name);
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

    return response;
}

function* getAppsForTags(names) {
    var tags = [];
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
        for (var _iterator5 = names[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var _name = _step5.value;

            var tag = yield Tag.findOne({ name: { $regex: _name, $options: 'i' } });
            if (tag !== null) {
                tags.push(tag);
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

    if (tags.length == 0) {
        return [];
    }

    var itemIds = getUniqueItemIds(tags);

    var apps = [];
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
        for (var _iterator6 = itemIds[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var appId = _step6.value;

            var app = yield AppsHandler.getApp(appId);
            if (app != null) {
                apps.push(app);
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

    return apps;
}

function getUniqueItemIds(tags) {
    var itemIds = [];
    var _iteratorNormalCompletion7 = true;
    var _didIteratorError7 = false;
    var _iteratorError7 = undefined;

    try {
        for (var _iterator7 = tags[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            var tag = _step7.value;

            itemIds = itemIds.concat(String(tag.itemIds));
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

    return _.uniq(itemIds);
}

function* getCollectionsForTags(names) {
    //TODO finish logic for getting collections by tags
    return [];
}

function doesArrayContains(array, id) {
    var _iteratorNormalCompletion8 = true;
    var _didIteratorError8 = false;
    var _iteratorError8 = undefined;

    try {
        for (var _iterator8 = array[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
            var arrayId = _step8.value;

            if (String(arrayId) === String(id)) {
                return true;
            }
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

    return false;
}