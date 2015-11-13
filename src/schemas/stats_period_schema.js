var Joi = require('joi')

var periodSchema = {
    fromDate: Joi.date().required(),
    toDate: Joi.date().required()
}

module.exports.periodSchema = periodSchema
