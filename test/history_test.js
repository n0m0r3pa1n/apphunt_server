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
var HISTORY_MESSAGES = require('../build/config/messages').HISTORY_MESSAGES

describe("History", function () {

    it("should get history events with date", function* () {
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

        var date = new Date()
        var response = yield Server.injectThen(opts)
        response.result.events.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.COLLECTION_FAVOURITED)
        response.result.events.length.should.eq(1)
        response.result.fromDate.should.eq(date.getUTCFullYear() + '-' + (date.getUTCMonth() + 1) + '-' + date.getUTCDate());
    })

    it("should get following collection favourite history", function* () {
        var user = (yield dbHelper.createUser()).result
        var userId = user.id
        var followerId = (yield dbHelper.createUserWithEmail("poli_biva@abv.bg")).result.id
        var collectionCreatorId = (yield dbHelper.createUserWithEmail("poli_ne_biva@abv.bg")).result.id
        yield dbHelper.followUser(userId, followerId)

        var collection = (yield dbHelper.createAppsCollection(collectionCreatorId)).result
        var appIds = yield dbHelper.createFourAppsWithIds(collectionCreatorId)
        var updatedCollection = yield dbHelper.makeCollectionPublic(collectionCreatorId, collection._id, appIds)

        yield dbHelper.favouriteCollection(collection._id, userId)


        var opts = {
            method: 'GET',
            url: '/v1/users/' + followerId + '/history?date=' + new Date().toISOString()
        }

        var response = yield Server.injectThen(opts)
        response.result.events.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.COLLECTION_FAVOURITED)
        response.result.events.length.should.eq(1)

        var event = response.result.events[0];
        String(event.user._id).should.eq(String(userId))
        event.text.should.eq(String.format(HISTORY_MESSAGES[event.type], updatedCollection.name, user.name))
        expect(event.user.isFollowing).to.exist
        expect(event.user.isFollowing).to.eq(true)
    })

    it("should get following collection create history", function* () {
        var user = (yield dbHelper.createUser()).result
        var userId = user.id
        var followerId = (yield dbHelper.createUserWithEmail("poli_biva@abv.bg")).result.id
        yield dbHelper.followUser(userId, followerId)

        var collection = (yield dbHelper.createAppsCollection(userId)).result
        var appIds = yield dbHelper.createFourAppsWithIds(userId)
        var updatedCollection = yield dbHelper.makeCollectionPublic(userId, collection._id, appIds)


        var opts = {
            method: 'GET',
            url: '/v1/users/' + followerId + '/history?date=' + new Date().toISOString()
        }

        var response = yield Server.injectThen(opts)
        response.result.events.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.COLLECTION_CREATED)
        response.result.events.length.should.eq(5)
        var element = _.filter(response.result.events, function (element) {
            return element.type == HISTORY_EVENT_TYPES.COLLECTION_CREATED;
        })[0];
        String(element.user._id).should.eq(String(userId));
        element.text.should.eq(String.format(HISTORY_MESSAGES[element.type], user.name, updatedCollection.name))
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
        response.result.events.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.APP_APPROVED)
        response.result.events.length.should.eq(1)
        String(response.result.events[0].user._id).should.eq(String(userId))
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
        response.result.events.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.APP_FAVOURITED)
        response.result.events.length.should.eq(1)
        String(response.result.events[0].user._id).should.eq(String(userId))
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
        response.result.events.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.USER_IN_TOP_HUNTERS)
        var event = response.result.events[0];
        String(event.user._id).should.eq(String(userId))
        event.text.should.eq(String.format(HISTORY_MESSAGES[event.type], event.user.name))
        response.result.events.length.should.eq(1)
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
        response.result.events.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.USER_FOLLOWED)
        response.result.events.length.should.eq(1)
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
        response.result.events.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.COLLECTION_UPDATED)
        var appApprovedEvents = _.filter(response.result.events, function(element){ return element.type == HISTORY_EVENT_TYPES.APP_APPROVED; });
        expect(response.result.events[0].user.isFollowing).to.exist
        expect(response.result.events[0].user.isFollowing).to.eq(false)
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
        response.result.events.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.COLLECTION_FAVOURITED)
        response.result.events.length.should.eq(1)
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
        response.result.events.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.APP_APPROVED)
        response.result.events.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.USER_COMMENT)
        response.result.events.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.USER_MENTIONED)
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
        response.result.events.length.should.eq(2)
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
        response.result.events.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.APP_REJECTED)
        response.result.events.should.contain.a.thing.with.property('type', HISTORY_EVENT_TYPES.APP_APPROVED)
    })

})



