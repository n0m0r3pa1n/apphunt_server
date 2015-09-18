var Mongoose = require("mongoose")
var chai = require("chai");
chai.should();
chai.use(require('chai-things'));
var should = chai.should()
var assert = chai.assert
var expect = chai.expect
var something = chai.something
var dbHelper = require('./helper/dbhelper')
var _ = require('underscore')
require('./spec_helper')
var STATUS_CODES = require('../build/config/config').STATUS_CODES
var HISTORY_EVENT_TYPES = require('../build/config/config').HISTORY_EVENT_TYPES

describe("History", function () {

    it("should get following collection favourite history", function* () {
        var user = (yield dbHelper.createUser()).result
        var userId = user.id
        var followerId = (yield dbHelper.createUserWithEmail("poli_biva@abv.bg")).result.id
        var collectionCreatorId = (yield dbHelper.createUserWithEmail("poli_ne_biva@abv.bg")).result.id
        yield dbHelper.followUser(userId, followerId)

        var collection = (yield dbHelper.createAppsCollection(collectionCreatorId)).result
        var appIds = yield dbHelper.createFourAppsWithIds(collectionCreatorId)
        yield dbHelper.makeCollectionPublic(collectionCreatorId, collection._id, appIds)

        yield dbHelper.favouriteCollection(collection._id, userId)


        var opts = {
            method: 'GET',
            url: '/v1/users/' + followerId + '/history?date=' + new Date().toISOString()
        }

        var response = yield Server.injectThen(opts)
        response.result.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.COLLECTION_FAVOURITED)
        response.result.length.should.eq(1)
        String(response.result[0].user._id).should.eq(String(userId))
        expect(response.result[0].user.isFollowing).to.exist
        expect(response.result[0].user.isFollowing).to.eq(true)
    })

    it("should get following collection create history", function* () {
        var user = (yield dbHelper.createUser()).result
        var userId = user.id
        var followerId = (yield dbHelper.createUserWithEmail("poli_biva@abv.bg")).result.id
        yield dbHelper.followUser(userId, followerId)

        var collection = (yield dbHelper.createAppsCollection(userId)).result
        var appIds = yield dbHelper.createFourAppsWithIds(userId)
        yield dbHelper.makeCollectionPublic(userId, collection._id, appIds)


        var opts = {
            method: 'GET',
            url: '/v1/users/' + followerId + '/history?date=' + new Date().toISOString()
        }

        var response = yield Server.injectThen(opts)
        response.result.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.COLLECTION_CREATED)
        response.result.length.should.eq(5)
        String(_.filter(response.result, function (element) {
            return element.type == HISTORY_EVENT_TYPES.COLLECTION_CREATED;
        })[0].user._id).should.eq(String(userId));
    })

    it("should get following app create history", function* () {
        var user = (yield dbHelper.createUser()).result
        var userId = user.id
        var followerId = (yield dbHelper.createUserWithEmail("poli_biva@abv.bg")).result.id
        yield dbHelper.followUser(userId, followerId)

        var app = (yield dbHelper.createApp(userId)).result
        yield dbHelper.approveApp(app.package)

        var opts = {
            method: 'GET',
            url: '/v1/users/'+followerId+'/history?date=' + new Date().toISOString()
        }

        var response = yield Server.injectThen(opts)
        response.result.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.APP_APPROVED)
        response.result.length.should.eq(1)
        String(response.result[0].user._id).should.eq(String(userId))
    })

    it("should get following app favourite history", function* () {
        var user = (yield dbHelper.createUser()).result
        var userId = user.id
        var followerId = (yield dbHelper.createUserWithEmail("poli_biva@abv.bg")).result.id
        var appCreatorId = (yield dbHelper.createUserWithEmail("poli_biva2@abv.bg")).result.id

        yield dbHelper.followUser(userId, followerId)

        var app = (yield dbHelper.createApp(appCreatorId)).result
        yield dbHelper.approveApp(app.package)

        yield dbHelper.favouriteApp(app._id, userId)

        var opts = {
            method: 'GET',
            url: '/v1/users/'+followerId+'/history?date=' + new Date().toISOString()
        }

        var response = yield Server.injectThen(opts)
        response.result.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.APP_FAVOURITED)
        response.result.length.should.eq(1)
        String(response.result[0].user._id).should.eq(String(userId))
    })


    it("should get following in top hunters history", function* () {
        var user = (yield dbHelper.createUser()).result
        var userId = user.id
        var user2Id = (yield dbHelper.createUserWithEmail("poli_biva@abv.bg")).result.id

        yield dbHelper.followUser(userId, user2Id)
        var collectionId = (yield dbHelper.createUsersCollection(userId)).result.id

        var fromDate = new Date();
        var toDate = new Date();

        var opts = {
            method: 'PUT',
            url: '/user-collections/' + collectionId,
            payload: {
                users: [userId],
                fromDate: fromDate,
                toDate: toDate
            }
        }

        yield Server.injectThen(opts)


        var opts = {
            method: 'GET',
            url: '/v1/users/'+user2Id+'/history?date=' + new Date().toISOString()
        }

        var response = yield Server.injectThen(opts)
        response.result.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.USER_IN_TOP_HUNTERS)
        String(response.result[0].user._id).should.eq(String(userId))
        response.result.length.should.eq(1)
    })

    it("should get someone followed history", function* () {
        var user = (yield dbHelper.createUser()).result
        var userId = user.id
        var user2Id = (yield dbHelper.createUserWithEmail("poli_biva@abv.bg")).result.id
        yield dbHelper.followUser(userId, user2Id)

        var opts = {
            method: 'GET',
            url: '/v1/users/'+userId+'/history?date=' + new Date().toISOString()
        }

        var response = yield Server.injectThen(opts)
        response.result.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.USER_FOLLOWED)
        response.result.length.should.eq(1)
    })


    it("should get favourite collection changed history", function*() {
        var date = new Date().toISOString()
        var user = (yield dbHelper.createUser()).result
        var userId = user.id
        var user2Id = (yield dbHelper.createUserWithEmail("poli_biva@abv.bg")).result.id

        var collection = (yield dbHelper.createAppsCollection(userId)).result
        var appIds = yield dbHelper.createFourAppsWithIds(user2Id)
        yield dbHelper.makeCollectionPublic(userId, collection._id, appIds)

        yield dbHelper.favouriteCollection(collection._id, user2Id)

        yield dbHelper.updateCollection(collection._id, userId, "TEST TEST", appIds)

        var opts = {
            method: 'GET',
            url: '/v1/users/'+user2Id+'/history?date=' + date
        }

        var response = yield Server.injectThen(opts)
        response.result.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.COLLECTION_UPDATED)
        var appApprovedEvents = _.filter(response.result, function(element){ return element.type == HISTORY_EVENT_TYPES.APP_APPROVED; });
        expect(response.result[0].user.isFollowing).to.exist
        expect(response.result[0].user.isFollowing).to.eq(false)
        appApprovedEvents.length.should.eq(4)
    });


    it("should get collection favourited history", function*() {
        var user = (yield dbHelper.createUser()).result
        var userId = user.id
        var user2Id = (yield dbHelper.createUserWithEmail("poli_biva@abv.bg")).result.id

        var collection = (yield dbHelper.createAppsCollection(userId)).result
        var appIds = yield dbHelper.createFourAppsWithIds(user2Id)
        yield dbHelper.makeCollectionPublic(userId, collection._id, appIds)

        yield dbHelper.favouriteCollection(collection._id, user2Id)
        yield dbHelper.favouriteCollection(collection._id, userId)

        var opts = {
            method: 'GET',
            url: '/v1/users/'+userId+'/history?date=' + new Date().toISOString()
        }

        var response = yield Server.injectThen(opts)
        response.result.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.COLLECTION_FAVOURITED)
        response.result.length.should.eq(1)
    });

    it("should get user comments history", function*() {
        var user = (yield dbHelper.createUser()).result
        var userId = user.id
        var user2Id = (yield dbHelper.createUserWithEmail("poli_biva@abv.bg")).result.id

        var app = (yield dbHelper.createApp(userId)).result
        yield dbHelper.approveApp(app.package)

        var comment = (yield dbHelper.createComment(app.id, user2Id)).result

        yield dbHelper.createCommentWithText(app.id, user2Id, comment.id, "@" + user.username)

        var opts = {
            method: 'GET',
            url: '/v1/users/'+userId+'/history?date=' + new Date().toISOString()
        }

        var response = yield Server.injectThen(opts)
        response.result.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.APP_APPROVED)
        response.result.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.USER_COMMENT)
        response.result.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.USER_MENTIONED)
    });

    it("should get user history events for favourite app", function*() {
        var user = (yield dbHelper.createUser()).result
        var userId = user.id
        var user2Id = (yield dbHelper.createUserWithEmail("poli_biva@abv.bg")).result.id

        var app = (yield dbHelper.createApp(userId)).result
        yield dbHelper.approveApp(app.package)

        yield dbHelper.favouriteApp(app.id, userId)
        yield dbHelper.favouriteApp(app.id, user2Id)

        var opts = {
            method: 'GET',
            url: '/v1/users/'+userId+'/history?date=' + new Date().toISOString()
        }

        var response = yield Server.injectThen(opts)
        response.result.length.should.eq(2)
    })

    it("should get approved and rejected user history ", function*() {
        var user = (yield dbHelper.createUser()).result
        var userId = user.id
        var user2Id = (yield dbHelper.createUserWithEmail("poli_biva@abv.bg")).result.id

        yield dbHelper.createAppWithPackage(userId, "thanks.to.poli")
        var deletedOpts = {
            method: 'POST',
            url: '/apps/thanks.to.poli/status',
            payload: {
                status: "rejected"
            }
        }
        yield Server.injectThen(deletedOpts)


        var app = (yield dbHelper.createApp(userId)).result
        yield dbHelper.approveApp(app.package)

        var opts = {
            method: 'GET',
            url: '/v1/users/'+userId+'/history?date=' + new Date().toISOString()
        }

        var response = yield Server.injectThen(opts)
        response.result.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.APP_REJECTED)
        response.result.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.APP_APPROVED)
    })

})



