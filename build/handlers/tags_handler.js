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

function* saveTagsForApp(tags, appId) {
    if (tags == undefined) {
        return;
    }

    yield updateTags(tags, appId, TAG_TYPES.APPLICATION);
}

function* saveTagsForCollection(tags, collectionId) {
    if (tags == undefined) {
        return;
    }

    yield updateTags(tags, collectionId, TAG_TYPES.COLLECTION);
}

function* updateTags(tags, itemId, tagType) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = tags[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var tag = _step.value;

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
}

function* getTagSuggestions(name) {
    var tags = yield Tag.find({ name: { $regex: name, $options: 'i' } });
    var response = [];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = tags[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var tag = _step2.value;

            response.push(tag.name);
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

    return response;
}

function* getAppsForTags(names) {
    var tags = [];
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = names[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var _name = _step3.value;

            var tag = yield Tag.findOne({ name: _name });
            if (tag !== null) {
                tags.push(tag);
            }
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

    if (tags.length == 0) {
        return [];
    }

    var apps = [];
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = tags[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var tag = _step4.value;
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = tag.itemIds[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var appId = _step5.value;

                    var app = yield AppsHandler.getApp(appId);
                    if (app != null) {
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

    return apps;
}

function* getCollectionsForTags(names) {
    //TODO finish logic for getting collections by tags
    return [];
}

function doesArrayContains(array, id) {
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
        for (var _iterator6 = array[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var arrayId = _step6.value;

            if (String(arrayId) === String(id)) {
                return true;
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

    return false;
}