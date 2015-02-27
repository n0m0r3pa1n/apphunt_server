var Bolt = require('bolt-js')
var simple = require('simple-mock');

var mockPostTweet = function() {
    simple.mock(Bolt.prototype, "postTweet", function() {
        return {}
    })
}

module.exports.mockPostTweet = mockPostTweet

