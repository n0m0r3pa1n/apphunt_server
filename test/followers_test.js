var Mongoose = require("mongoose")
var should = require('chai').should()
var assert = require('chai').assert
var expect = require('chai').expect
var _ = require("underscore")
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

    it("many users should follow user", function*() {
        var followingId = (yield dbHelper.createUser()).result.id
        var follower1Id = (yield dbHelper.createUserWithEmail("sdasdsad")).result.id
        var follower2Id = (yield dbHelper.createUserWithEmail("sdasdsad2")).result.id
        var follower3Id = (yield dbHelper.createUserWithEmail("sdasdsad3")).result.id
        var response = yield dbHelper.addFollowers(followingId, [follower1Id, follower2Id, follower3Id])
        response.result.statusCode.should.eq(STATUS_CODES.OK)

        var opts = {
            method: "GET",
            url: '/users/' + followingId + "/followers?page=1&pageSize=3"
        }

        var response2 = yield Server.injectThen(opts)
        response2.result.followers.length.should.eq(3)
    });

    it("user should follow many users", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var follower1Id = (yield dbHelper.createUserWithEmail("sdasdsad")).result.id
        var follower2Id = (yield dbHelper.createUserWithEmail("sdasdsad2")).result.id
        var follower3Id = (yield dbHelper.createUserWithEmail("sdasdsad3")).result.id

        yield dbHelper.addFollowings(userId, [follower1Id, follower2Id, follower3Id])

        var opts2 = {
            method: "GET",
            url: '/users/' + userId + "/following?page=1&pageSize=3"
        }

        var response3 = yield Server.injectThen(opts2)
        response3.result.following.length.should.eq(3)
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
        yield dbHelper.followUser(follower2Id, followerId)

        var opts = {
            method: "GET",
            url: '/users/' + followingId + "/followers?page=1&pageSize=2&userId=" + followerId
        }

        var response = yield Server.injectThen(opts)
        response.result.followers.length.should.eq(2)
        _.filter(response.result.followers, function (element) {
            return String(element._id) == String(follower2Id);
        })[0].isFollowing.should.eq(true);
    });

    it("should get following", function*() {
        var followingId = (yield dbHelper.createUser()).result.id
        var followerId = (yield dbHelper.createUserWithEmail("sdasdsad")).result.id
        var userId = (yield dbHelper.createUserWithEmail("dsffdsg")).result.id

        yield dbHelper.followUser(followingId, followerId)
        yield dbHelper.followUser(followingId, userId)

        var opts = {
            method: "GET",
            url: '/users/' + followerId + "/following?page=1&pageSize=2&userId=" + userId
        }

        var response = yield Server.injectThen(opts)
        response.result.following.length.should.eq(1)
        String(response.result.following[0]._id).should.eq(String(followingId))
        expect(response.result.following[0].isFollowing).to.exist
        response.result.following[0].isFollowing.should.eq(true)
    });
})