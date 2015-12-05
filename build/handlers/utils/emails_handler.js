'use strict';

var Fs = require('fs');
var Bolt = require("bolt-js");

var APP_HUNT_EMAIL = require('../../config/config').APP_HUNT_EMAIL;
var EMAIL_TEMPLATES_PATH = require('../../config/config').EMAIL_TEMPLATES_PATH;

var boltAppId = require('../../config/config').BOLT_APP_ID;

function sendEmailToDeveloper(app) {
    if (app.developer !== undefined) {
        var templateFile = Fs.readFileSync(EMAIL_TEMPLATES_PATH + "developer_app_added.hbs");
        var bolt = new Bolt(boltAppId);
        var user = app.createdBy;
        var developer = app.developer;

        var emailParameters = {
            from: {
                name: "AppHunt",
                email: APP_HUNT_EMAIL
            }, to: {
                name: developer.name,
                email: developer.email
            },
            subject: app.name + " is added on AppHunt! Find out what your users think about it!",
            message: {
                text: templateFile.toString(),
                variables: [{
                    name: "app",
                    content: {
                        name: app.name,
                        icon: app.icon,
                        description: app.description,
                        developer: {
                            name: developer.name
                        }
                    }
                }, {
                    name: "user",
                    content: {
                        name: user.name,
                        picture: user.profilePicture
                    }
                }]
            },
            tags: ['developer', 'apphunt', 'new-app']
        };
        try {
            bolt.sendEmail(emailParameters);
        } catch (e) {
            console.log(e);
        }
    }
}

module.exports.sendEmailToDeveloper = sendEmailToDeveloper;