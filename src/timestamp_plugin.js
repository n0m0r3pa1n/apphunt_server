var moment = require('moment-timezone');
var Mongoose = require('mongoose')

function timestampsPlugin(schema, options) {
    var updatedAt = 'updatedAt';
    var createdAt = 'createdAt';
    var updatedAtType = Date;
    var createdAtType = Date;

    if (typeof options === 'object') {
        if (typeof options.updatedAt === 'string') {
            updatedAt = options.updatedAt;
        } else if (typeof options.updatedAt === 'object') {
            updatedAt = options.updatedAt.name || updatedAt;
            updatedAtType = options.updatedAt.type || updatedAtType;
        }
        if (typeof options.createdAt === 'string') {
            createdAt = options.createdAt;
        } else if (typeof options.createdAt === 'object') {
            createdAt = options.createdAt.name || createdAt;
            createdAtType = options.createdAt.type || createdAtType;
        }
    }

    var dataObj = {};
    dataObj[updatedAt] = updatedAtType;
    if (schema.path(createdAt)) {
        schema.add(dataObj);
        schema.virtual(createdAt)
            .get( function () {
                if (this["_" + createdAt]) return this["_" + createdAt];
                console.log("Timestamp: " + this._id.getTimestamp());
                return this["_" + createdAt] = this._id.getTimestamp();
            });
        schema.pre('save', function (next) {
            if (this.isNew) {
                this[updatedAt] = this[createdAt];
            } else if (this.isModified()) {
                this[updatedAt] = dateToUTCDate(new Date);
            }
            next();
        });
    } else {
        dataObj[createdAt] = createdAtType;
        schema.add(dataObj);
        schema.pre('save', function (next) {
            if (!this[createdAt]) {
                this[createdAt] = this[updatedAt] = dateToUTCDate(new Date);
            } else if (this.isModified()) {
                this[updatedAt] = dateToUTCDate(new Date);
            }
            next();
        });
    }
}

function dateToUTCDate(date) {
    //console.log(moment().tz("Europe/London").format());
    //console.log("dateToUTCDate: " + date.toString());
    //var utc = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
    ////var utc = new Date(Date.UTC(
    ////    date.getUTCFullYear(),
    ////    date.getUTCMonth(),
    ////    date.getUTCDate(),
    ////    date.getUTCHours(),
    ////    date.getUTCMinutes()
    ////));
    //console.log("dateToUTCDate result: " + utc.toString());
    //var utc = Mongoose.Date.now();
    console.log(Date.now())
    return new Date();
}

module.exports = timestampsPlugin;