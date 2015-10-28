"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getPaginatedResultsWithNameAndCount = getPaginatedResultsWithNameAndCount;
exports.getPaginatedResultsWithName = getPaginatedResultsWithName;
exports.getPaginatedResults = getPaginatedResults;
exports.getPaginationWithResults = getPaginationWithResults;

function* getPaginatedResultsWithNameAndCount(query, resultsName, countQuery, currentPage, pageSize) {
    var totalRecordsCount = yield countQuery.count().exec();

    setupPaginatedQuery(query, currentPage, pageSize);

    var results = yield query.find().exec();

    return getResponse(results, resultsName, totalRecordsCount, currentPage, getTotalPages(totalRecordsCount, pageSize));
}

function* getPaginatedResultsWithName(query, resultsName, currentPage, pageSize) {
    var totalRecordsCount = yield query.count().exec();

    setupPaginatedQuery(query, currentPage, pageSize);
    var results = yield query.find().exec();
    return getResponse(results, resultsName, totalRecordsCount, currentPage, getTotalPages(totalRecordsCount, pageSize));
}

function* getPaginatedResults(query, currentPage, pageSize) {
    var response = {};
    var totalRecordsCount = yield query.count().exec();

    setupPaginatedQuery(query, currentPage, pageSize);

    var results = yield query.find().exec();

    return getResponse(results, null, totalRecordsCount, currentPage, getTotalPages(totalRecordsCount, pageSize));
}

function getPaginationWithResults(results, currentPage, pageSize) {
    var name = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

    var totalRecordsCount = results.length;
    var objects = results;
    if (currentPage != 0 && pageSize != 0) {
        objects = results.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    }

    return getResponse(objects, name, totalRecordsCount, currentPage, getTotalPages(totalRecordsCount, pageSize));
}

function setupPaginatedQuery(query, currentPage, pageSize) {
    if (currentPage != 0 && pageSize != 0) {
        query = query.limit(pageSize).skip((currentPage - 1) * pageSize);
    }
}

function getTotalPages(totalRecordsCount, pageSize) {
    if (pageSize == 0 || totalRecordsCount == 0) {
        return 0;
    }

    return Math.ceil(totalRecordsCount / pageSize);
}

function getResponse(results, name, totalCount, page, totalPages) {
    var response = {};
    if (name !== undefined && name !== null) {
        response[name] = results;
    } else {
        response.results = results;
    }

    response.totalCount = totalCount;
    response.page = page;
    if (page != 0) {
        response.totalPages = totalPages;
    }

    return response;
}

module.exports.getPaginatedResults = getPaginatedResults;