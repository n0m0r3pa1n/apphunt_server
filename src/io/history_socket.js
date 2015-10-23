import {EventEmitter} from '../handlers/utils/event_emitter.js'
import * as HistoryHandler from '../handlers/history_handler.js'
import * as FollowersHandler from '../handlers/followers_handler.js'
var Co = require('co')

export function setup(server) {
    var io = require('socket.io')(server.listener)
    let room = "UserHistory"
    var clients = [];
    EventEmitter.on('refresh', function (data, event) {
        var clients = io.sockets.adapter.rooms[room];
        for (var clientId in clients) {
            for(let userId of data.interestedUsers) {
                if(String(userId) == String(io.sockets.connected[clientId].userId)) {
                    event = event.toObject()
                    event.text = HistoryHandler.getText(event.type, event.params)
                    Co.wrap(function*(event, clientId){
                        event.user.isFollowing = yield FollowersHandler.isFollowing(userId, event.user._id)
                        io.sockets.connected[clientId].emit('refresh', {event: event})
                    })(event, clientId)

                }
            }
        }
    })
    io.on('connection', function (socket) {
        console.log('connection')
        socket.on('add user', function (userId) {
            console.log('add user', userId)
            clients.push(userId);
            socket.userId = userId;
            socket.join(room)
        });

        socket.on('last seen event', function (userId, eventId, date) {
            Co.wrap(function* (socket) {
                let unseenEventIds = yield HistoryHandler.getUnseenHistory(userId, eventId, date)
                socket.emit('unseen events', {events: unseenEventIds})
            })(socket)
        })

        socket.on('disconnect', function () {
            clients.splice(clients.indexOf(socket.userId), 1)
            console.log("disconnect", socket.userId)
        });
    });
}
