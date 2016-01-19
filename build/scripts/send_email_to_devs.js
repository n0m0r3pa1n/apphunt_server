///**
// * Created by nmp on 15-11-23.
// */
'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _handlersUsers_handlerJs = require('../handlers/users_handler.js');

var UsersHandler = _interopRequireWildcard(_handlersUsers_handlerJs);

var Mongoose = require('mongoose');
var dbURI = 'mongodb://NaughtySpirit:fmi123@ds031531.mongolab.com:31531/heroku_app33343837';
Mongoose.connect(dbURI, function (err, obj) {});

var Co = require('co');
var Fs = require('fs');
var Bolt = require('bolt-js');
var Handlebars = require('handlebars');

var _ = require('underscore');
var APP_HUNT_EMAIL = 'support@theapphunt.com';
var EMAIL_TEMPLATES_PATH = require('../config/config').EMAIL_TEMPLATES_PATH;
var LOGIN_TYPES_FILTER = require('../config/config').LOGIN_TYPES_FILTER;
var PLATFORMS = require('../config/config').PLATFORMS;

var boltAppId = require('../config/config').BOLT_APP_ID;

var Developer = require('../models').Developer;
var App = require('../models').App;
var DevsHunter = require('../handlers/utils/devs_hunter_handler');

var emailTemplateUrl = '../../' + EMAIL_TEMPLATES_PATH + 'developer_new_feature.hbs';
var templateFile = Fs.readFileSync(emailTemplateUrl);
var bolt = new Bolt(boltAppId);

Co(function* () {
    var apps = yield App.find({ platform: PLATFORMS.Android }).populate('developer createdBy').exec();
    console.log(apps.length);
    var developers = _.groupBy(apps, function (app) {
        return String(app.developer._id);
    });

    var i = 0;
    Object.keys(developers).map(function (devId) {
        i++;
        var developerApps = developers[devId];
        var developer = developerApps[0].developer;
        sendEmailToDev(developer, developerApps);
    });

    console.log('Sent ' + i);
});

function sendEmailToDev(developer, apps) {
    var template = Handlebars.compile(templateFile.toString());
    var html = template({ message: {
            apps: apps,
            developer: {
                name: developer.name
            }
        } });

    var emailParameters = {
        from: {
            name: 'AppHunt',
            email: APP_HUNT_EMAIL
        }, to: {
            name: developer.name,
            email: developer.email
        },
        subject: 'Get a free special landing page for your Android apps on AppHunt!',
        message: {
            text: html
        },
        tags: ['developer', 'feature']
    };

    try {
        bolt.sendEmail(emailParameters);
    } catch (e) {
        console.log(e);
    }
}