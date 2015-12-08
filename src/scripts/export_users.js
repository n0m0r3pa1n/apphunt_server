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
var Handlebars = require('handlebars');

var _ = require("underscore")
var APP_HUNT_EMAIL = "support@theapphunt.com"
var EMAIL_TEMPLATES_PATH = require('../config/config').EMAIL_TEMPLATES_PATH
var LOGIN_TYPES_FILTER = require('../config/config').LOGIN_TYPES_FILTER
var PLATFORMS = require('../config/config').PLATFORMS
var LOGIN_TYPES = require('../config/config').LOGIN_TYPES

var boltAppId = require('../config/config').BOLT_APP_ID

var Developer = require('../models').Developer
var App = require('../models').App
var User = require('../models').User
var DevsHunter = require('../handlers/utils/devs_hunter_handler')

import * as UsersHandler from '../handlers/users_handler.js'

var emailTemplateUrl = '../../' + EMAIL_TEMPLATES_PATH + "developer_new_feature.hbs"
var templateFile = Fs.readFileSync(emailTemplateUrl)
var bolt = new Bolt(boltAppId)

Co(function*() {
    var users = yield User.find({loginType: LOGIN_TYPES.GooglePlus}).exec()
    let emails =[]

    for(let user of users) {
        emails.push(user.email)
    }
    console.log(emails)
});

