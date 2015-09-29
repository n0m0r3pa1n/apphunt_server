'use strict';

var io = require('socket.io-client');

var socketURL = 'http://apphunt-dev.herokuapp.com';

var options = {
    transports: ['websocket'],
    'force new connection': true
};

var client1 = io.connect(socketURL, options);
client1.on('connect', function (data, error) {
    client1.emit('add user', "test");
});
client1.on('refresh', function (data, error) {
    console.log('Refresh client1');
});

var client2 = io.connect(socketURL, options);
client2.on('connect', function (data, error) {
    client2.emit('add user', "test2");
});

client2.on('refresh', function (data, error) {
    console.log('Refresh client2');
});