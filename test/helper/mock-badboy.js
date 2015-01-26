var Badboy = require('badboy')
var simple = require('simple-mock');

simple.mock(Badboy, "getAndroidApp", function() {
    return {
        name: 'Test',
        categories: [ 'Entertainment' ],
        icon: 'https://lh5.ggpht.com/vrsl2YRVDaz1Icm6dmd4zrdDisvmNfjYD6fF7-sUVus_W7RsKWVPyuRqxKRezEY5hGfF=w300',
        isFree: true,
        package: 'com.example.test',
        description: 'Test',
        url: 'https://play.google.com/store/apps/details?id=com.koli' }
})

simple.mock(Badboy, "getiOSApp", function() {
    return {
        name: 'Test',
        categories: [ 'Entertainment' ],
        icon: 'https://lh5.ggpht.com/vrsl2YRVDaz1Icm6dmd4zrdDisvmNfjYD6fF7-sUVus_W7RsKWVPyuRqxKRezEY5hGfF=w300',
        isFree: true,
        package: '908842747',
        description: 'Test',
        url: 'https://play.google.com/store/apps/details?id=com.koli' }
})

