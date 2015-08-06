'use strict';

var Mongoose = require('mongoose');
var DeepPopulate = require('mongoose-deep-populate');
var Schema = Mongoose.Schema;
var Co = require('co');
var Timestamps = require('mongoose-timestamp');
var Config = require('./config/config');
var platforms = Config.PLATFORMS;
var appStatuses = Config.APP_STATUSES;
var tagTypes = Config.TAG_TYPES;
var collectionStatuses = Config.COLLECTION_STATUSES;
var loginTypes = Config.LOGIN_TYPES;
var _ = require('underscore');

Mongoose.plugin(function (schema) {

    schema.statics.findOneOrCreate = function findOneOrCreate(condition, doc) {
        var wrapper = Co.wrap(function* (self, condition, doc) {
            var foundDoc = yield self.findOne(condition).exec();
            try {
                if (foundDoc) {
                    return foundDoc;
                } else {
                    return yield self.create(doc);
                }
            } catch (e) {
                console.log(e);
            }
        });

        var self = this;
        return wrapper(self, condition, doc);
    };
});

var userSchema = new Schema({
    name: String,
    username: String,
    email: { type: String, index: true, unique: true },
    profilePicture: String,
    coverPicture: String,
    loginType: { type: String, 'enum': _.values(loginTypes), 'default': loginTypes.Facebook },
    locale: String,
    appVersion: String,
    devices: [{ type: Schema.Types.ObjectId, ref: 'Device' }]
});

var deviceSchema = new Schema({
    notificationsEnabled: { type: Boolean, 'default': true },
    notificationId: String
});

var appCategorySchema = new Schema({
    name: { type: String, unique: true }
});

var developerSchema = new Schema({
    name: String,
    email: { type: String, required: true },
    website: String
});

var appSchema = new Schema({
    name: String,
    icon: String,
    url: String,
    shortUrl: String,
    description: String,
    'package': { type: String, unique: true },
    status: { type: String, 'enum': _.values(appStatuses), 'default': appStatuses.WAITING },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    votes: [{ type: Schema.Types.ObjectId, ref: 'Vote' }],
    categories: [{ type: Schema.Types.ObjectId, ref: 'AppCategory' }],
    isFree: { type: Boolean, 'default': true },
    platform: { type: String, 'enum': _.values(platforms), 'default': platforms.Android },
    developer: { type: Schema.Types.ObjectId, ref: 'Developer' },
    votesCount: { type: Number, 'default': 0 },
    screenshots: [{ type: String }],
    averageScore: { type: Number, 'default': 0 }
});

var voteSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' }
});

var commentSchema = new Schema({
    text: String,
    app: { type: Schema.Types.ObjectId, ref: 'App' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    votes: [{ type: Schema.Types.ObjectId, ref: 'Vote' }],
    parent: { type: Schema.Types.ObjectId, ref: 'Comment' },
    children: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    votesCount: { type: Number, 'default': 0 }
});

appSchema.methods.getVotesCount = function () {
    return this.votes.count();
};

var notificationSchema = new Schema({
    type: String,
    sendTime: Date,
    title: String,
    message: String
});

var baseCollection = {
    name: { type: String, required: true },
    description: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    picture: String
};

var appsCollectionSchema = new Schema(_.extend({}, baseCollection, {
    status: { type: String, 'enum': _.values(collectionStatuses), 'default': collectionStatuses.DRAFT },
    apps: [{ type: Schema.Types.ObjectId, ref: 'App' }],
    votes: [{ type: Schema.Types.ObjectId, ref: 'Vote' }],
    favouritedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    votesCount: { type: Number, 'default': 0 }
}));

var usersCollectionSchema = new Schema(_.extend({}, baseCollection, {
    usersDetails: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        score: { type: Number, 'default': 0 },
        addedApps: { type: Number, 'default': 0 },
        comments: { type: Number, 'default': 0 },
        votes: { type: Number, 'default': 0 }
    }]
}));

var collectionBannerSchema = new Schema({
    url: String
});

var appVersionSchema = new Schema({
    versionCode: Number
});

var tagsSchema = new Schema({
    name: { type: String },
    type: { type: String, 'enum': _.values(tagTypes), 'default': tagTypes.APPLICATION },
    itemIds: [{ type: Schema.Types.ObjectId }]
});

userSchema.plugin(Timestamps);
appSchema.plugin(Timestamps);
voteSchema.plugin(Timestamps);
commentSchema.plugin(Timestamps);
notificationSchema.plugin(Timestamps);
appCategorySchema.plugin(Timestamps);
developerSchema.plugin(Timestamps);
appsCollectionSchema.plugin(Timestamps);
usersCollectionSchema.plugin(Timestamps);

appSchema.plugin(DeepPopulate);
commentSchema.plugin(DeepPopulate);
appsCollectionSchema.plugin(DeepPopulate);
usersCollectionSchema.plugin(DeepPopulate);

module.exports.User = Mongoose.model('User', userSchema);
module.exports.App = Mongoose.model('App', appSchema);
module.exports.Vote = Mongoose.model('Vote', voteSchema);
module.exports.Comment = Mongoose.model('Comment', commentSchema);
module.exports.Notification = Mongoose.model('Notification', notificationSchema);
module.exports.Device = Mongoose.model('Device', deviceSchema);
module.exports.AppCategory = Mongoose.model('AppCategory', appCategorySchema);
module.exports.Developer = Mongoose.model('Developer', developerSchema);
module.exports.AppsCollection = Mongoose.model('AppsCollection', appsCollectionSchema);
module.exports.UsersCollection = Mongoose.model('UsersCollection', usersCollectionSchema);
module.exports.CollectionBanner = Mongoose.model('CollectionBanner', collectionBannerSchema);
module.exports.AppVersion = Mongoose.model('AppVersion', appVersionSchema);
module.exports.Tag = Mongoose.model('Tag', tagsSchema);