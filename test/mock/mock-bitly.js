var UrlsHandler = require('../../src/handlers/utils/urls_handler')
var HuntMe = require('huntme')
var simple = require('simple-mock');

var mockUrlsHandler = function() {
    simple.mock(HuntMe.prototype, "createLink", function () {
        return {url: String("http://bit.ly/test") };
    })
}

module.exports.mockUrlsHandler = mockUrlsHandler