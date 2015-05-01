var Bolt = require('bolt-js')
var simple = require('simple-mock');

var mockPostTweet = function() {
    simple.mock(Bolt.prototype, "postTweet", function() {
        return {}
    })
}

var mockSendEmail = function() {
    simple.mock(Bolt.prototype, "sendEmail", function() {
        return {}
    })
}

module.exports.mockPostTweet = mockPostTweet
module.exports.mockSendEmail = mockSendEmail

