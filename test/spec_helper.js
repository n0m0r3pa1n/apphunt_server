require('./helper/cleardb')
require('./helper/dbhelper')
require('./helper/inject-server')

var mockBadBoy = require('./helper/mock-badboy')
mockBadBoy.mockGetAndroidApp()
mockBadBoy.mockGetIosApp()

var mockBitly = require('./helper/mock-bitly')
mockBitly.mockUrlsHandler()