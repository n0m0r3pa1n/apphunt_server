'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.setup = setup;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _handlersUtilsEvent_emitterJs = require('../handlers/utils/event_emitter.js');

var _handlersHistory_handlerJs = require('../handlers/history_handler.js');

var HistoryHandler = _interopRequireWildcard(_handlersHistory_handlerJs);

var _handlersFollowers_handlerJs = require('../handlers/followers_handler.js');

var FollowersHandler = _interopRequireWildcard(_handlersFollowers_handlerJs);

var _handlersChat_handlerJs = require('../handlers/chat_handler.js');

var ChatHandler = _interopRequireWildcard(_handlersChat_handlerJs);

var TOP_HUNTERS_CHAT_ROOM = require('../config/config').TOP_HUNTERS_CHAT_ROOM;
var Co = require('co');

function setup(server) {
    var io = require('socket.io')(server.listener);
    var userHistoryRoom = "UserHistory";
    var topHuntersRoom = "TopHunters";
    var historyClients = [];
    _handlersUtilsEvent_emitterJs.EventEmitter.on('refresh', function (data, event) {
        var clients = io.sockets.adapter.rooms[userHistoryRoom];
        for (var clientId in clients) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                var _loop = function () {
                    var userId = _step.value;

                    if (String(userId) == String(io.sockets.connected[clientId].userId)) {
                        event = event.toObject();
                        event.text = HistoryHandler.getText(event.type, event.params);
                        Co.wrap(function* (event, clientId) {
                            event.user.isFollowing = yield FollowersHandler.isFollowing(userId, event.user._id);
                            io.sockets.connected[clientId].emit('refresh', { event: event });
                        })(event, clientId);
                    }
                };

                for (var _iterator = data.interestedUsers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    _loop();
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
        socket.on('add user', function (userId) {
            historyClients.push(userId);
            socket.userId = userId;
            socket.join(userHistoryRoom);
        });

        socket.on('last seen event', function (userId, eventId, date) {
            Co.wrap(function* (socket) {
                var unseenEventIds = yield HistoryHandler.getUnseenHistory(userId, eventId, date);
                socket.emit('unseen events', { events: unseenEventIds });
            })(socket);
        });

        socket.on('disconnect', function () {
            historyClients.splice(historyClients.indexOf(socket.userId), 1);
            //sendChatUsersList(io, socket)
        });

        socket.on('add user to top hunters chat', function (user) {
            socket.user = user;
            socket.join(topHuntersRoom);

            sendChatUsersList(io, socket);
        });

        socket.on('new top hunters message', function (text, userId) {
            var updateStream = Co.wrap(function* (message, userId) {
                yield ChatHandler.saveMessage(userId, TOP_HUNTERS_CHAT_ROOM, message);
            });
            updateStream(text, userId);

            io.to(topHuntersRoom).emit('new top hunters message', {
                message: text,
                user: socket.user
            });
        });
    });

    function sendChatUsersList(io) {
        io.to(topHuntersRoom).emit('hunters list', { users: JSON.stringify(getCurrentUsersList(topHuntersRoom)) });
    }

    function getCurrentUsersList(roomName) {
        var clients = io.sockets.adapter.rooms[roomName];
        var users = [];
        for (var clientId in clients) {
            users.push(io.sockets.connected[clientId].user);
        }

        return users;
    }
}