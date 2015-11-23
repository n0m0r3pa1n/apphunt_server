"use strict";

///**
// * Created by nmp on 15-11-23.
// */
//var Mongoose = require('mongoose')
//var dbURI = 'mongodb://NaughtySpirit:fmi123@ds031531.mongolab.com:31531/heroku_app33343837'
//Mongoose.connect(dbURI, function (err, obj) {
//})
//
//var Co = require('co')
//var Fs = require('fs')
//var Bolt = require("bolt-js")
//
//var APP_HUNT_EMAIL = "georgi@theapphunt.com"
//var EMAIL_TEMPLATES_PATH = require('../config/config').EMAIL_TEMPLATES_PATH
//var LOGIN_TYPES_FILTER = require('../config/config').LOGIN_TYPES_FILTER
//
//var boltAppId = require('../config/config').BOLT_APP_ID
//import * as UsersHandler from '../handlers/users_handler.js'
//
//Co(function* () {
//    let users = (yield UsersHandler.get()).users
//
//    let sentEmailsCount = 1393;
//    for(let i=1393; i < users.length; i++) {
//        let user = users[i]
//        if(user.loginType !== LOGIN_TYPES_FILTER.Anonymous && user.loginType !== LOGIN_TYPES_FILTER.Fake) {
//            sentEmailsCount++;
//            sendEmailToDeveloper(user.email, user.name)
//        }
//    }
//
//    console.log("Sent " + sentEmailsCount + " from " + users.length)
//})
//
//function sendEmailToDeveloper(email, fullName="") {
//    Fs.readFile('../../' + EMAIL_TEMPLATES_PATH + "contest_invitation.hbs", function (err, data) {
//        if (err) throw err;
//        var bolt = new Bolt(boltAppId)
//        var firstName = fullName.split(" ")[0]
//        var emailParameters = {
//            from: {
//                name: "Georgi",
//                email: APP_HUNT_EMAIL
//            }, to: {
//                name: fullName,
//                email: email
//            },
//            subject: "AppHunt December Contest",
//            message: {
//                text: data.toString(),
//                variables: [{
//                    name: "dev",
//                    content: {
//                        name: firstName,
//                    }
//                }]
//            },
//            tags: ['contest', 'apphunt', 'december']
//        }
//        bolt.sendEmail(emailParameters)
//        console.log("Done")
//    });
//
//
//}