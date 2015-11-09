require('./helper/cleardb')
require('./helper/dbhelper')
require('./helper/inject-server')

var mockBadBoy = require('./mock/mock-badboy')
var mockBitly = require('./mock/mock-bitly')
var mockBolt = require('./mock/mock-bolt')
var mockDevsHunter = require('./mock/mock-devs-hunter')
var initMock = function() {
    mockDevsHunter.mockGetAndroidApp()
    mockDevsHunter.mockUpdateAndroidApp()
    mockBadBoy.mockGetAndroidApp()
    mockBadBoy.mockGetIosApp()
    mockBitly.mockUrlsHandler()
    mockBolt.mockPostTweet()
    mockBolt.mockFollowUsers()
    mockBolt.mockSendEmail()
}

initMock()

module.exports.initMock = initMock

