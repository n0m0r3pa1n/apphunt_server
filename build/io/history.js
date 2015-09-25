'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.setup = setup;

function setup(server) {
    server.connection({
        port: 8081,
        labels: ['history']
    });

    var io = require('socket.io')(server.select('history').listener);
    var users = [];

    io.on('connection', function (socket) {
        var addedUser = false;

        socket.on('add user', function (userId, room) {
            console.log('Add user', userId);
            socket.userId = userId;
            socket.room = 'UserHistory';

            socket.join(room);

            users[userId] = userId;
            addedUser = true;
            console.log('Added', users);
        });

        socket.on('refresh', function (user, room) {
            console.log('Refresh', user);
            console.log('Refresh', room);
        });

        socket.on('disconnect', function () {
            // remove the username from global usernames list
            if (addedUser) {
                delete users[socket.userId];
            }
            console.log('Removed', users);
        });
    });
}