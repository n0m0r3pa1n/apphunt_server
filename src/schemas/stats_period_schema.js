var Joi = require('joi')

var periodSchema = {
    fromDate: Joi.date().required(),
    toDate: Joi.string().required()
}

module.exports.periodSchema = periodSchema
