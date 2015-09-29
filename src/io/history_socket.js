import {EventEmitter} from '../handlers/utils/event_emitter.js'
export function setup(server, port) {
    server.connection({
        port: Number(port),
        labels: ['history']
    })

    var io = require('socket.io')(server.select('history').listener, {
        path: '/socket.io-client'
    })
    io.set('transports', ['websocket']);
    var users = [];
    let room = "UserHistory"
    let socket = {}

    EventEmitter.on('refresh', function (data) {
        console.log('refresh', data.interestedUsers)
        var clients = io.sockets.adapter.rooms[room];
        for (var clientId in clients) {
            for(let userId of data.interestedUsers) {
                if(userId == io.sockets.connected[clientId].userId) {
                    io.sockets.connected[clientId].emit('refresh')
                }
            }
        }
    })
    io.on('connection', function (socket) {
        console.log('connection')
        var addedUser = false;
        socket.on('add user', function (userId) {
            console.log('add user', userId)
            socket.userId = userId;
            socket.join(room)

            users[userId] = userId;
            addedUser = true;
            //console.log("Added", users)
        });

        socket.on('disconnect', function () {
            // remove the username from global usernames list
            if (addedUser) {
                delete users[socket.userId];
            }
            console.log("disconnect", socket.userId)
        });
    });
}
