'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.getMessagesForRoom = getMessagesForRoom;
exports.saveMessage = saveMessage;
exports.createChatRoom = createChatRoom;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _users_handlerJs = require('./users_handler.js');

var UsersHandler = _interopRequireWildcard(_users_handlerJs);

var Boom = require('boom');
var CONFIG = require('../config/config');
var Message = require('../models').Message;
var Room = require('../models').Room;

var DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

function* getMessagesForRoom(roomName, fromDate) {
    var toDate = arguments.length <= 2 || arguments[2] === undefined ? new Date(fromDate.getTime() + DAY_MILLISECONDS) : arguments[2];
    return yield* (function* () {
        var room = yield Room.findOne({
            name: roomName
        });
        if (!room) {
            Boom.notFound('Room does not exist!');
            return;
        }

        var where = {};

        where.createdAt = {
            "$gte": new Date(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()),
            "$lt": toDate.toISOString()
        };

        where.room = room.id;

        var messages = yield Message.find(where).sort({ createdAt: 'ascending' }).populate('owner').exec();
        return { messages: messages };
    })();
}

function* saveMessage(userId, roomName, message) {
    var room = yield Room.findOne({
        name: roomName
    });
    if (!room) {
        Boom.notFound('Room does not exist!');
        return;
    }

    var user = yield UsersHandler.find(userId);
    if (!user) {
        Boom.notFound('User does not exist!');
        return;
    }

    var messageObj = new Message({
        room: room,
        owner: user,
        text: message
    });
    yield messageObj.save();

    return Boom.OK();
}

function* createChatRoom(roomName) {
    return yield Room.findOneOrCreate({ name: roomName }, { name: roomName });
}