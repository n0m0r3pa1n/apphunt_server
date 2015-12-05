'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.getAd = getAd;
exports.createAd = createAd;
var _ = require("underscore");
var Boom = require('boom');

var Ad = require('../models').Ad;

function* getAd() {
    var ads = yield Ad.find({}).exec();
    if (ads.length == 0) {
        return {};
    }
    var index = Math.floor(Math.random() * ads.length);
    return ads[index];
}

function* createAd(_ref) {
    var name = _ref.name;
    var picture = _ref.picture;
    var link = _ref.link;

    var ad = new Ad({
        name: name,
        picture: picture,
        link: link
    });

    yield ad.save();

    return Boom.OK();
}