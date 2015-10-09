"use strict";

var Boom = require("boom");

String.prototype.capitalizeFirstLetter = function () {
    var string = this;
    if (string.length > 1) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    return string;
};

String.prototype.replaceAll = function (find, replace) {
    var str = this;
    return str.replace(new RegExp(find, 'g'), replace);
};

String.format = function () {
    // The string containing the format items (e.g. "{0}")
    // will and always has to be the first argument.
    var theString = arguments[0];

    // start with the second argument (i = 1)
    for (var i = 1; i < arguments.length; i++) {
        // "gm" = RegEx options for Global search (more than one instance)
        // and for Multiline search
        var regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
        theString = theString.replace(regEx, arguments[i]);
    }

    return theString;
};

Boom.OK = function () {
    return { statusCode: 200 };
};