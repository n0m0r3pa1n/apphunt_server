import {EventEmitter} from '../handlers/utils/event_emitter.js'
import * as HistoryHandler from '../handlers/history_handler.js'
import * as FollowersHandler from '../handlers/followers_handler.js'
import * as ChatHandler from '../handlers/chat_handler.js'

var TOP_HUNTERS_CHAT_ROOM = require('../config/config').TOP_HUNTERS_CHAT_ROOM
var Co = require('co')

export function setup(server) {
    var io = require('socket.io')(server.listener)
    let userHistoryRoom = "UserHistory"
    let topHuntersRoom = "TopHunters"
    var historyClients = [];
    EventEmitter.on('refresh', function (data, event) {
        var clients = io.sockets.adapter.rooms[userHistoryRoom];
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
        socket.on('add user', function (userId) {
            historyClients.push(userId);
            socket.userId = userId;
            socket.join(userHistoryRoom)
        });

        socket.on('last seen event', function (userId, eventId, date) {
            Co.wrap(function* (socket) {
                let unseenEventIds = yield HistoryHandler.getUnseenHistory(userId, eventId, date)
                socket.emit('unseen events', {events: unseenEventIds})
            })(socket)
        })

        socket.on('disconnect', function () {
            historyClients.splice(historyClients.indexOf(socket.userId), 1)
            //sendChatUsersList(io, socket)
        });

        socket.on('add user to top hunters chat', function (user) {
            socket.user = user
            socket.join(topHuntersRoom)

            sendChatUsersList(io, socket)
        });

        socket.on('new top hunters message', function (text, userId) {
            var updateStream = Co.wrap(function* (message, userId) {
                yield ChatHandler.saveMessage(userId, TOP_HUNTERS_CHAT_ROOM, message);
            });
            updateStream(text, userId)

            io.to(topHuntersRoom).emit('new top hunters message', {
                message: text,
                user: socket.user
            })
        })
    });


    function sendChatUsersList(io) {
        io.to(topHuntersRoom).emit('hunters list', { users: JSON.stringify(getCurrentUsersList(topHuntersRoom)) })
    }

    function getCurrentUsersList(roomName) {
        var clients = io.sockets.adapter.rooms[roomName];
        var users = []
        for (var clientId in clients) {
            users.push(io.sockets.connected[clientId].user)
        }

        return users
    }

}
