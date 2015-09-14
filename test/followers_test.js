var Mongoose = require("mongoose")
var should = require('chai').should()
var assert = require('chai').assert
var expect = require('chai').expect

var STATUS_CODES = require('../build/config/config').STATUS_CODES
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')

describe("Followers", function () {

    it("should follow user", function*() {
        var followingId = (yield dbHelper.createUser()).result.id
        var followerId = (yield dbHelper.createUserWithEmail("sdasdsad")).result.id
        var response = yield dbHelper.followUser(followingId, followerId)
        response.result.statusCode.should.eq(STATUS_CODES.OK)
    });

    it("should unfollow user", function*() {
        var followingId = (yield dbHelper.createUser()).result.id
        var followerId = (yield dbHelper.createUserWithEmail("sdasdsad")).result.id
        yield dbHelper.followUser(followingId, followerId)

        var response = yield dbHelper.unfollowUser(followingId, followerId)
        response.result.statusCode.should.eq(STATUS_CODES.OK)

        var opts = {
            method: "GET",
            url: '/users/' + followingId + "/followers?page=1&pageSize=2"
        }

        var response2 = yield Server.injectThen(opts)
        response2.result.followers.length.should.eq(0)
    });

    it("should get followers", function*() {
        var followingId = (yield dbHelper.createUser()).result.id
        var followerId = (yield dbHelper.createUserWithEmail("sdasdsad")).result.id
        var follower2Id = (yield dbHelper.createUserWithEmail("asdasds")).result.id

        yield dbHelper.followUser(followingId, followerId)
        yield dbHelper.followUser(followingId, follower2Id)

        var opts = {
            method: "GET",
            url: '/users/' + followingId + "/followers?page=1&pageSize=2"
        }

        var response = yield Server.injectThen(opts)
        response.result.followers.length.should.eq(2)
    });

    it("should get following", function*() {
        var followingId = (yield dbHelper.createUser()).result.id
        var followerId = (yield dbHelper.createUserWithEmail("sdasdsad")).result.id

        yield dbHelper.followUser(followingId, followerId)

        var opts = {
            method: "GET",
            url: '/users/' + followerId + "/following?page=1&pageSize=2"
        }

        var response = yield Server.injectThen(opts)
        response.result.following.length.should.eq(1)
        response.result.following[0].id.should.eq(String(followingId))
    });
})