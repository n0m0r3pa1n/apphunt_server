var Mongoose = require("mongoose")
var should = require('chai').should()
var assert = require('chai').assert
var expect = require('chai').expect

var STATUS_CODES = require('../../build/config/config').STATUS_CODES
var FollowersHandler = require('../../build/handlers/followers_handler')
var dbHelper = require('../helper/dbhelper')
require('../spec_helper')

describe("FollowersHandler", function () {

    it("should return if user follows another user", function*() {
        var followingId = (yield dbHelper.createUser()).result.id
        var followerId = (yield dbHelper.createUserWithEmail("sdasdsad")).result.id
        yield dbHelper.followUser(followingId, followerId)

        expect(yield FollowersHandler.isFollowing(followerId, followingId)).to.eq(true)
    });

})