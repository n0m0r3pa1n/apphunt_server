require('./helper/cleardb')
require('./helper/dbhelper')
require('./helper/inject-server')

var mockBadBoy = require('./helper/mock-badboy')
var mockBitly = require('./helper/mock-bitly')
var mockBolt = require('./helper/mock-bolt')
var initMock = function() {
    mockBadBoy.mockGetAndroidApp()
    mockBadBoy.mockGetIosApp()
    mockBitly.mockUrlsHandler()
    mockBolt.mockPostTweet()
}

initMock()

module.exports.initMock = initMock

