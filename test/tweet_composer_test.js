require('./spec_helper')
var should = require('chai').should()
var TweetComposer = require('../build/utils/tweet_composer')

describe("Tweet composer", function () {

    beforeEach(function*() {
        global.composer = new TweetComposer("TheAppHunt")
        global.shortUrl = "http://url223.com"
        global.appName = "Test name"
        global.appDescription = "test description"
        global.onAppHunt = " on @TheAppHunt"
        global.appHashTag = "app"
    })

    it("should compose message with username", function*() {
        var username = "userNameTest"
        var message = appName + ": " + appDescription + " " + shortUrl + " via @" + username + onAppHunt + " #" + appHashTag
        composer.compose({name: appName, 
                         description: appDescription,
                         url: shortUrl, 
                         user: username, 
                         hashTag: appHashTag}).should.equal(message)
    })

    it("should compose message without username", function*() {
        var appName = "Test name"
        var message = appName + ": " + appDescription + " " + shortUrl + onAppHunt + " #" + appHashTag
        composer.compose({name: appName, 
                         description: appDescription,
                         url: shortUrl, 
                         hashTag: appHashTag}).should.equal(message)
    })

    it("should not truncate app name when 30 chars", function*() {
        var appName = "wykdbarhqzppuvquld bguacqerqbb"
        var message = appName + ": " + appDescription + " " + shortUrl + onAppHunt + " #" + appHashTag
        composer.compose({name: appName, 
                         description: appDescription,
                         url: shortUrl, 
                         hashTag: appHashTag}).should.equal(message)
    })

    it("should truncate app name when more than 30 chars", function*() {
        var appName = "Welcome to the World of mage consts"
        var message = "Welcome to the World of mage: " + appDescription + " " + shortUrl + onAppHunt + " #" + appHashTag
        composer.compose({name: appName, 
                         description: appDescription,
                         url: shortUrl, 
                         hashTag: appHashTag}).should.equal(message)
    })

    it("should not truncate app description when 45 chars", function*() {
        var appDescription = "rrekvdhrhthkupclujf voemiujupuqivmrbbjn dgvvg"
        var message = appName + ": " + appDescription + " " + shortUrl + onAppHunt + " #" + appHashTag
        composer.compose({name: appName, 
                         description: appDescription,
                         url: shortUrl, 
                         hashTag: appHashTag}).should.equal(message)
    })

    it("should truncate app name when more than 45 chars", function*() {
        var appDescription = "rrekvdhvbrhthkupclujfvoe miujupuqi vmrbbjnd gvvg"
        var message = appName + ": rrekvdhvbrhthkupclujfvoe miujupuqi vmrbbjnd..." + " " + shortUrl + onAppHunt + " #" + appHashTag
        composer.compose({name: appName, 
                         description: appDescription,
                         url: shortUrl, 
                         hashTag: appHashTag}).should.equal(message)
    })
})



