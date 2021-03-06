///**
// * Created by nmp on 15-11-23.
// */
var Mongoose = require('mongoose')
var dbURI = 'mongodb://NaughtySpirit:fmi123@ds031531.mongolab.com:31531/heroku_app33343837'
Mongoose.connect(dbURI, function (err, obj) {
})

var Co = require('co')
var Fs = require('fs')
var Bolt = require("bolt-js")
var json2csv = require('json2csv');

var APP_HUNT_EMAIL = "georgi@theapphunt.com"
var EMAIL_TEMPLATES_PATH = require('../config/config').EMAIL_TEMPLATES_PATH
var LOGIN_TYPES_FILTER = require('../config/config').LOGIN_TYPES_FILTER

var boltAppId = require('../config/config').BOLT_APP_ID

var User = require('../models').User
import * as UsersHandler from '../handlers/users_handler.js'

Co(function* () {
    var fs = require('fs');
    var data = fs.readFileSync('../../assets/members.csv').toString()
    var fields = ['Email Address', 'First Name', 'Last Name'];
    var parse = require('csv-parse');
    parse(data, function(err, output){
        Co(function*() {
            let i = 0;
            let length = output.length
            let data = []
            for(let email of output) {
                i++;
                console.log(email[0])
                let user = yield User.findOne({email: email[0]}).exec()
                console.log(user)
                if(user == null) {
                    continue;
                }
                user = user.toObject()
                if(user.name == undefined) {

                }
                let name = user.name.split(' ')
                if(name.length > 1) {
                    user.firstName = name[0]
                    user.lastName = name[name.length - 1]
                } else if (name.length == 1){
                    user.firstName = name[0]
                    user.lastName = ""
                }else {
                    user.firstName = "Hunter"
                    user.lastName = ""
                }
                console.log("Added " + i + " of " + length)

                data.push({email: user.email, firstName: user.firstName, lastName: user.lastName})
            }

            var json2csv = require('json2csv');
            var fields = ['email', 'firstName', 'lastName'];
            json2csv({ data: data, fields: fields }, function(err, csv) {
                if (err) console.log(err);

                var fs = require('fs');
                fs.writeFile('./formList.csv', csv, 'utf8', function (err) {
                    if (err) {
                        console.log('Some error occured - file either not saved or corrupted file saved.');
                    } else{
                        console.log('It\'s saved!');
                    }
                });
            });
        })
    });






    //let users = yield User.find({}).exec()
    //
    //let sentEmailsCount = 0;
    //let usersEmails = []
    //for(let i=0; i < users.length; i++) {
    //    let user = users[i]
    //    if(user.loginType !== LOGIN_TYPES_FILTER.Anonymous && user.loginType !== LOGIN_TYPES_FILTER.Fake) {
    //        sentEmailsCount++;
    //        usersEmails.push({email: user.email})
    //        //sendEmailToDeveloper(user.email, user.name)
    //    }
    //}

    //
    //json2csv({ data: usersEmails, fields: fields }, function(err, csv) {
    //    if (err) console.log(err);
    //
    //    var fs = require('fs');
    //    fs.writeFile('./formList.csv', csv, 'utf8', function (err) {
    //        if (err) {
    //            console.log('Some error occured - file either not saved or corrupted file saved.');
    //        } else{
    //            console.log('It\'s saved!');
    //        }
    //    });
    //});
    //
    //
    //console.log("Sent " + sentEmailsCount + " from " + users.length)
})

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