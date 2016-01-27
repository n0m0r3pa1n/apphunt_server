var Boom = require('boom')
var CONFIG = require('../config/config')
var Message = require('../models').Message
var Room = require('../models').Room

var DAY_MILLISECONDS = 24 * 60 * 60 * 1000

import * as UsersHandler from './users_handler.js'

export function* getMessagesForRoom(roomName, fromDate, toDate = new Date(fromDate.getTime() + DAY_MILLISECONDS)) {
    let room = yield Room.findOne({
        name: roomName
    })
    if (!room) {
        Boom.notFound('Room does not exist!')
        return;
    }

    var where = {}

    where.createdAt = {
        "$gte": new Date(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()),
        "$lt": toDate.toISOString()
    };

    where.room = room.id

    let messages = yield Message.find(where).sort({createdAt: 'ascending'}).populate('owner').exec()
    return {messages: messages}
}

export function* saveMessage(userId, roomName, message) {
    let room = yield Room.findOne({
        name: roomName
    })
    if (!room) {
        Boom.notFound('Room does not exist!')
        return;
    }

    let user = yield UsersHandler.find(userId)
    if (!user) {
        Boom.notFound('User does not exist!')
        return;
    }

    let messageObj = new Message({
        room: room,
        owner: user,
        text: message
    })
    yield messageObj.save()

    return Boom.OK()
}

export function* createChatRoom(roomName) {
    return yield Room.findOneOrCreate({name: roomName}, {name: roomName})
}