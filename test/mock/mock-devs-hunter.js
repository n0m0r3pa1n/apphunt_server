var DevsHunter = require('../../build/handlers/utils/devs_hunter_handler')
var simple = require('simple-mock');

var mockGetAndroidApp = function() {
    simple.mock(DevsHunter, "getAndroidApp", function() {
        return {
            name: 'Test App',
            categories: [ 'Entertainment' ],
            icon: 'https://lh5.ggpht.com/vrsl2YRVDaz1Icm6dmd4zrdDisvmNfjYD6fF7-sUVus_W7RsKWVPyuRqxKRezEY5hGfF=w300',
            isFree: true,
            package: 'com.example.test',
            description: 'Test',
            url: 'https://play.google.com/store/apps/details?id=com.koli',
            developer: {
                name: "test",
                email: "test@test.com"
            }
        }
    })
}

module.exports.mockGetAndroidApp = mockGetAndroidApp

