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
var TOP_HUNTERS_CHAT_ROOM = CONFIG.TOP_HUNTERS_CHAT_ROOM

var DAY_MILLISECONDS = 24 * 60 * 60 * 1000
var socketURL = 'http://localhost:8080';

var options = {
    transports: ['websocket'],
    'force new connection': true
};
var loadNumber = 0;

describe("Chat Socket", function () {
    it('should receive current users list', function* (done) {
        this.timeout(4000);
        var user1 = (yield dbHelper.createUser()).result
        var user2 = (yield dbHelper.createUserWithEmail("asdasda@aaa.ca")).result
        var user3 = (yield dbHelper.createUserWithEmail("asdasda2@aaa.ca")).result

        var client1 = io.connect(socketURL, options);
        var client2 = io.connect(socketURL, options);
        var client3 = io.connect(socketURL, options);

        client1.on('connect', function (data, error) {
            client1.emit('add user to top hunters chat', user1);

            client2.on('connect', function (data, error) {
                client2.emit('add user to top hunters chat', user2);
            })

            client3.on('connect', function (data, error) {
                client3.emit('add user to top hunters chat', user3);
            })
        })

        client1.on('hunters list', function(data, error) {
            loadNumber++
            if(loadNumber == 3) {
                data.users.length.should.eq(3)
                client1.disconnect()
                client2.disconnect()
                client3.disconnect()
                done()
            } else if(loadNumber == 2) {
                data.users.length.should.eq(2)
            }
        })
    })

    it('should receive new messages for top hunters', function* (done) {
        this.timeout(4000);
        var user1 = (yield dbHelper.createUser()).result
        var user2 = (yield dbHelper.createUserWithEmail("asdasda@aaa.ca")).result

        var client1 = io.connect(socketURL, options);
        var client2 = io.connect(socketURL, options);

        client1.on('connect', function (data, error) {
            client1.emit('add user to top hunters chat', user1);

            client2.on('connect', function (data, error) {
                client2.emit('add user to top hunters chat', user2);
                client2.emit('new top hunters message', 'Test', user2.id);
            })
        })

        client1.on('hunters list', function(data, error) {
            loadNumber++
            if(loadNumber == 2) {
                data.users.length.should.eq(2)
            }
        })

        client1.on('new top hunters message', function(data, error) {
            data.message.should.eql('Test')
            expect(data.user.id).to.equals(String(user2.id))
            client1.disconnect()
            client2.disconnect()
            done()
        })
    })

    it('should store get message history for room', function* (done) {
        this.timeout(4000);
        var room = (yield dbHelper.createChatRoom(TOP_HUNTERS_CHAT_ROOM)).result
        var user1 = (yield dbHelper.createUser()).result
        var user2 = (yield dbHelper.createUserWithEmail("asdasda@aaa.ca")).result

        var client1 = io.connect(socketURL, options);
        var client2 = io.connect(socketURL, options);

        client1.on('connect', function (data, error) {
            client1.emit('add user to top hunters chat', user1);

            client2.on('connect', function (data, error) {
                client2.emit('add user to top hunters chat', user2);
                client2.emit('new top hunters message', 'Test', user2.id);
            })
        })

        client1.on('hunters list', function(data, error) {
            loadNumber++
            if(loadNumber == 2) {
                data.users.length.should.eq(2)
            }
        })

        client1.on('new top hunters message', function(data, error) {
            data.message.should.eql('Test')
            expect(data.user.id).to.equals(String(user2.id))
            setTimeout(Co.wrap(function*() {
                var today = new Date()
                var opts = {
                    method: 'GET',
                    url: '/chat/rooms/history?name=' + TOP_HUNTERS_CHAT_ROOM + "&date=" + today.toISOString()
                }

                var response = yield Server.injectThen(opts)
                response.result.messages.length.should.eq(1)

                var tomorrow = new Date()
                tomorrow.setDate(today.getDate() + 1)
                opts = {
                    method: 'GET',
                    url: '/chat/rooms/history?name=' + TOP_HUNTERS_CHAT_ROOM + "&date=" + tomorrow.toISOString()
                }

                var response2 = yield Server.injectThen(opts)
                response2.result.messages.length.should.eq(0)

                client1.disconnect()
                client2.disconnect()
                done()
            }), 500)

        })
    })
})
