"use strict";

var HuntMe = require("huntme");

function* getShortLink(links) {
    var huntMe = new HuntMe("54ec824e61fc8103004a436a");
    var response = yield huntMe.createLink(links);
    return response.url;
}

module.exports.getShortLink = getShortLink;