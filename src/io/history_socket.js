import {EventEmitter} from '../handlers/utils/event_emitter.js'
import * as HistoryHandler from '../handlers/history_handler.js'
var Co = require('co')

export function setup(server) {
    var io = require('socket.io')(server.listener)
    let room = "UserHistory"

    EventEmitter.on('refresh', function (data, event) {
        //console.log('refresh', data.interestedUsers)
        var clients = io.sockets.adapter.rooms[room];
        for (var clientId in clients) {
            for(let userId of data.interestedUsers) {
                if(userId == io.sockets.connected[clientId].userId) {
                    io.sockets.connected[clientId].emit('refresh', {event: event})
                }
            }
        }
    })
    io.on('connection', function (socket) {
        console.log('connection')
        socket.on('add user', function (userId) {
            console.log('add user', userId)
            socket.userId = userId;
            socket.join(room)
        });

        socket.on('last seen event', function (userId, eventId, date) {
            console.log("AAA id", eventId)
            console.log("AAA date", date)
            Co.wrap(function* (socket) {
                let unseenEventIds = yield HistoryHandler.getUnseenHistory(userId, eventId, date)
                socket.emit('unseen events', {events: unseenEventIds})
            })(socket)
        })

        socket.on('disconnect', function () {
            console.log("disconnect", socket.userId)
        });
    });
}
