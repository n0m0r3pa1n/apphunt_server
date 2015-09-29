'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.setup = setup;

var _handlersUtilsEvent_emitterJs = require('../handlers/utils/event_emitter.js');

function setup(server) {
    server.connection({
        port: 8081,
        labels: ['history']
    });

    var io = require('socket.io')(server.select('history').listener);
    var users = [];
    var room = "UserHistory";
    var socket = {};

    _handlersUtilsEvent_emitterJs.EventEmitter.on('refresh', function (data) {
        var clients = io.sockets.adapter.rooms[room];
        for (var clientId in clients) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = data.interestedUsers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var userId = _step.value;

                    if (userId == io.sockets.connected[clientId].userId) {
                        io.sockets.connected[clientId].emit('refresh');
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator['return']) {
                        _iterator['return']();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }
    });
    io.on('connection', function (socket) {
        var addedUser = false;
        socket.on('add user', function (userId) {
            socket.userId = userId;
            socket.join(room);

            users[userId] = userId;
            addedUser = true;
            //console.log("Added", users)
        });

        socket.on('disconnect', function () {
            // remove the username from global usernames list
            if (addedUser) {
                delete users[socket.userId];
            }
            //console.log("Removed", users)
        });
    });
}