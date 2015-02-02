var UrlsHandler = require('../../src/handlers/urls_handler')
var simple = require('simple-mock');

var mockUrlsHandler = function() {
    simple.mock(UrlsHandler, "getShortLink", function () {
        return {
            data: {
                link_save: {
                    link: 'http://bit.ly/test'
                }
            }
        }
    })
}

module.exports.mockUrlsHandler = mockUrlsHandler