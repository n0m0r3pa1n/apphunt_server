var Co = require('co')
import {PRIVATE_KEY} from '../config/config.js'
import * as UsersController from './users_handler.js'
var jwt = require('jsonwebtoken')

export var validate = function (decoded, request, callback) {
    Co(function* () {
        return yield UsersController.find(decoded.userId)
    }).then(function(user) {
        if(user) {
            return callback(null, true, user);
        } else {
            return callback(null, false, {});
        }
    });

};

export function generateToken(userId) {
    return jwt.sign({userId: String(userId)}, PRIVATE_KEY);
}

export function getToken(userId) {
    return {token: generateToken(userId)}
}