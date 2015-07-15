'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.generateToken = generateToken;
exports.getToken = getToken;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _configConfigJs = require('../config/config.js');

var _users_handlerJs = require('./users_handler.js');

var UsersController = _interopRequireWildcard(_users_handlerJs);

var Co = require('co');

var jwt = require('jsonwebtoken');

var validate = function validate(decoded, request, callback) {
    Co(function* () {
        return yield UsersController.find(decoded.userId);
    }).then(function (user) {
        if (user) {
            return callback(null, true, user);
        } else {
            return callback(null, false, {});
        }
    });
};

exports.validate = validate;

function generateToken(userId) {
    return jwt.sign({ userId: String(userId) }, _configConfigJs.PRIVATE_KEY);
}

function getToken(userId) {
    return { token: generateToken(userId) };
}