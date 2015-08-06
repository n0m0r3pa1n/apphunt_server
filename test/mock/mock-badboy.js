var Badboy = require('badboy')
var simple = require('simple-mock');

var mockGetAndroidApp = function() {
    simple.mock(Badboy, "getAndroidApp", function() {
        return {
            name: 'Test App',
            categories: [ 'Racing  Action & Adventure' ],
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

var mockGetIosApp = function() {
    simple.mock(Badboy, "getiOSApp", function() {
        return {
            name: 'Test',
            category: '/store/test/Entertainment',
            icon: 'https://lh5.ggpht.com/vrsl2YRVDaz1Icm6dmd4zrdDisvmNfjYD6fF7-sUVus_W7RsKWVPyuRqxKRezEY5hGfF=w300',
            isFree: true,
            package: '908842747',
            description: 'Test',
            url: 'https://play.google.com/store/apps/details?id=com.koli',
            score: {
                oneStars: 136,
                twoStars: 66,
                threeStars: 127,
                fourStars: 317,
                fiveStars: 1053,
                count: 1699,
                total: 4.22
            }
        }
    })
}

module.exports.mockGetAndroidApp = mockGetAndroidApp
module.exports.mockGetIosApp = mockGetIosApp

