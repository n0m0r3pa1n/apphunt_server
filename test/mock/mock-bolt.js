var Bolt = require('bolt-js')
var simple = require('simple-mock');

var mockPostTweet = function() {
    simple.mock(Bolt.prototype, "postTweet", function() {
        return {}
    })
}

var mockFollowUsers = function() {
    simple.mock(Bolt.prototype, "followUsers", function() {
        return {}
    })
}

var mockSendEmail = function() {
    simple.mock(Bolt.prototype, "sendEmail", function() {
        return {}
    })
}

module.exports.mockPostTweet = mockPostTweet
module.exports.mockFollowUsers = mockFollowUsers
module.exports.mockSendEmail = mockSendEmail

