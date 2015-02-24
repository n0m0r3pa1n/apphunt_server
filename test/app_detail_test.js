var Mongoose = require("mongoose")
var should = require('chai').should()
var assert = require('chai').assert
var expect = require('chai').expect
var dbHelper = require('./helper/dbhelper')
require('./spec_helper')
var STATUS_CODES = require('../src/config').STATUS_CODES
var DAY_MILLISECONDS = 24 * 60 * 60 * 1000

describe("App details", function () {

    it("should get app with comments", function*() {
        var userId = (yield dbHelper.createUser()).result.id
        var appId = (yield dbHelper.createApp(userId)).result.id
        var appVoteId = yield dbHelper.voteApp(appId, userId)

        var comment1Id = (yield dbHelper.createComment(appId, userId)).result.id
        var comment2Id = (yield dbHelper.createComment(appId, userId)).result.id

        var commentVoteId = (yield dbHelper.voteComment(comment1Id, userId)).result.id
        var opts = {
            method: 'GET',
            url: '/apps/'+appId+'?userId=' + userId + "&commentsCount=" + 5
        }

        var appResponse = yield Server.injectThen(opts)
        var app = appResponse.result.app
        var commentsData = appResponse.result.commentsData

        expect(app.votesCount).to.exist()
        expect(app.hasVoted).to.exist()
        commentsData.comments.length.should.equal(2)
        expect(commentsData.comments[0].hasVoted).to.exist()
        expect(app.votes[0].user.profilePicture).to.exist()
        expect(app.createdBy.profilePicture).to.exist()
    });
})



