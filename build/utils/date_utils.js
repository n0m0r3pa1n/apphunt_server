'use strict';

function formatDate(date) {
    if (date === '') {
        return;
    }
    var output = '';
    output += date.getFullYear() + '-';
    output += date.getMonth() + 1 + '-';
    output += date.getDate();
    return output;
}

module.exports.formatDate = formatDate;