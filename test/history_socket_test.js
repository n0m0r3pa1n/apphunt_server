var EventEmitter = require('../build/handlers/utils/event_emitter').EventEmitter

var Mongoose = require("mongoose")
var sinon = require('sinon')
var should = require('chai').should()
var assert = require('chai').assert
var expect = require('chai').expect
var dbHelper = require('./helper/dbhelper')
var io = require('socket.io-client');
var Co = require('co');
var _ = require('underscore');
require('./spec_helper')
var CONFIG = require('../build/config/config')
var STATUS_CODES = CONFIG.STATUS_CODES
var HISTORY_EVENT_TYPES = CONFIG.HISTORY_EVENT_TYPES

var DAY_MILLISECONDS = 24 * 60 * 60 * 1000
var socketURL = 'http://localhost:8080';

var options = {
    transports: ['websocket'],
    'force new connection': true
};

describe("History Socket", function () {
    it('Should receive unseen events', function* (done) {
        this.timeout(4000);
        var user1Id = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("asdasda")).result.id

        var client1 = io.connect(socketURL, options);
        var client2 = io.connect(socketURL, options);

        client1.on('connect', function (data, error) {
            client1.emit('add user', user1Id);


            setTimeout(Co.wrap(function*() {
                yield dbHelper.followUser(user1Id, user2Id)

                var opts = {
                    method: 'GET',
                    url: '/v1/users/' + user1Id + '/history?date=' + new Date().toISOString()
                }

                var response = yield Server.injectThen(opts)
                var lastSeenEventId = response.result.events[0]._id

                var app = (yield dbHelper.createApp(user1Id)).result
                yield dbHelper.approveApp(app.package)

                var app2 = (yield dbHelper.createAppWithPackage(user1Id, "com.poli.me.drazni")).result
                yield dbHelper.approveApp(app2.package)

                client1.emit('last seen event', user1Id, lastSeenEventId, new Date().toISOString())

            }), 500)

        })

        client1.on('unseen events', function(data, error) {
            expect(data.events).to.exist
            data.events.length.should.eq(2)
            client1.disconnect()
            done()
        })
    })

    it('Should receive refresh event when user is followed with socket connection', function* (done) {
        var user1Id = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("asdasda")).result.id

        var client1 = io.connect(socketURL, options);
        var client2 = io.connect(socketURL, options);

        client1.on('connect', function (data, error) {
            client1.emit('add user', user1Id);

            client2.on('connect', function (data, error) {
                client2.emit('add user', user2Id);
                setTimeout(Co.wrap(function*() {
                    yield dbHelper.followUser(user1Id, user2Id)
                }), 500)
            })
        })

        client1.on('refresh', function(data, error) {
            assert(true)
            expect(data.event).to.exist
            data.event.user._id.should.eq(String(user2Id))
            client1.disconnect()
            client2.disconnect()
            done()
        })
    })

    it('Should receive refresh event when app is approved', function* () {
        var user1Id = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("asdasda")).result.id
        yield dbHelper.followUser(user1Id, user2Id)
        var appPackage = (yield dbHelper.createApp(user1Id)).result.package


        var spy = sinon.spy()
        EventEmitter.on('refresh', spy)
        yield dbHelper.approveApp(appPackage)
        sinon.assert.calledOnce(spy);
        sinon.assert.calledWith(spy, {interestedUsers: [user2Id, user1Id]});
    })

    it('Should receive refresh event when collection is created', function* () {
        var user1Id = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("asdasda")).result.id
        var collectionId = (yield dbHelper.createAppsCollection(user1Id)).result.id

        var spy = sinon.spy()
        EventEmitter.on('refresh', spy)

        var appIds = yield dbHelper.createFourAppsWithIds(user1Id)

        yield dbHelper.followUser(user1Id, user2Id)
        yield dbHelper.makeCollectionPublic(user1Id, collectionId, appIds)

        sinon.assert.calledWith(spy, {interestedUsers: [user2Id]});
    })

    it('Should receive refresh event when app is rejected', function* () {
        var user1Id = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("asdasda")).result.id
        var appPackage = (yield dbHelper.createApp(user1Id)).result.package

        var spy = sinon.spy()
        EventEmitter.on('refresh', spy)

        var opts = {
            method: 'POST',
            url: '/apps/'+ appPackage +'/status',
            payload: {
                status: "rejected"
            }
        }
        yield Server.injectThen(opts);

        sinon.assert.calledOnce(spy);
        sinon.assert.calledWith(spy, {interestedUsers: [user1Id]});
    })


    it('Should receive refresh event when app is favourited', function* () {
        var user1Id = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("asdasda")).result.id
        var appId = (yield dbHelper.createApp(user1Id)).result.id
        yield dbHelper.followUser(user1Id, user2Id)

        var spy = sinon.spy()
        EventEmitter.on('refresh', spy)

        yield dbHelper.favouriteApp(appId, user1Id)

        sinon.assert.calledWith(spy, {interestedUsers: [user2Id]});
    })

    it('Should receive refresh event when collection is favourited', function* () {
        var user1Id = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("asdasda")).result.id
        var user3Id = (yield dbHelper.createUserWithEmail("asdasda2")).result.id
        var collectionId = (yield dbHelper.createAppsCollection(user3Id)).result.id
        var appIds = yield dbHelper.createFourAppsWithIds(user1Id)
        yield dbHelper.makeCollectionPublic(user3Id, collectionId, appIds)
        yield dbHelper.followUser(user1Id, user2Id)

        var spy = sinon.spy()
        EventEmitter.on('refresh', spy)

        yield dbHelper.favouriteCollection(collectionId, user1Id)

        sinon.assert.calledWith(spy, {interestedUsers: [user2Id, user3Id]});
    })

    it('Should receive refresh event when collection is updated', function* () {
        var user1Id = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("asdasda")).result.id
        var collectionId = (yield dbHelper.createAppsCollection(user1Id)).result.id
        var appIds = yield dbHelper.createFourAppsWithIds(user1Id)
        yield dbHelper.makeCollectionPublic(user1Id, collectionId, appIds)
        yield dbHelper.favouriteCollection(collectionId, user2Id)

        var spy = sinon.spy()
        EventEmitter.on('refresh', spy)

        yield dbHelper.updateCollection(collectionId, user1Id, "Test", appIds)

        sinon.assert.calledWith(spy, {interestedUsers: [user2Id]});
    })

    it('Should receive refresh event when user writes comment', function* () {
        var user1Id = (yield dbHelper.createUser()).result.id
        var user2Id = (yield dbHelper.createUserWithEmail("asdasda")).result.id
        var appId = (yield dbHelper.createApp(user1Id)).result.id;

        var spy = sinon.spy()
        EventEmitter.on('refresh', spy)

        yield dbHelper.createComment(appId, user2Id)

        sinon.assert.calledWith(spy, {interestedUsers: [user1Id]});
    })

    it('Should receive refresh event when user mentioned in comment', function* () {
        var user1 = (yield dbHelper.createUser()).result
        var user2Id = (yield dbHelper.createUserWithEmail("asdasda")).result.id
        var appId = (yield dbHelper.createApp(user1.id)).result.id;

        var spy = sinon.spy()
        EventEmitter.on('refresh', spy)

        yield dbHelper.createCommentWithText(appId, user2Id, undefined, "@" + user1.username + " test")

        sinon.assert.calledWith(spy, {interestedUsers: [String(user1.id)]});
    })
})
