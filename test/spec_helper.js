require('./helper/cleardb')
require('./helper/dbhelper')
require('./helper/inject-server')

var mockBadBoy = require('./helper/mock-badboy')
var mockBitly = require('./helper/mock-bitly')
var initMock = function() {
    mockBadBoy.mockGetAndroidApp()
    mockBadBoy.mockGetIosApp()
    mockBitly.mockUrlsHandler()
}

initMock()

module.exports.initMock = initMock

