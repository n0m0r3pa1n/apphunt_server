"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getPaginatedResultsWithNameAndCount = getPaginatedResultsWithNameAndCount;
exports.getPaginatedResultsWithName = getPaginatedResultsWithName;
exports.getPaginatedResults = getPaginatedResults;

function* getPaginatedResultsWithNameAndCount(query, resultsName, countQuery, currentPage, pageSize) {
    var totalPages = 0;
    var totalRecordsCount = yield countQuery.count().exec();

    setupPaginatedQuery(query, currentPage, pageSize);

    var results = yield query.find().exec();

    return getResponse(results, resultsName, totalRecordsCount, currentPage, totalPages);
}

function* getPaginatedResultsWithName(query, resultsName, currentPage, pageSize) {
    var totalPages = 0;
    var totalRecordsCount = yield query.count().exec();

    setupPaginatedQuery(query, currentPage, pageSize);

    var results = yield query.find().exec();
    return getResponse(results, resultsName, totalRecordsCount, currentPage, totalPages);
}

function* getPaginatedResults(query, currentPage, pageSize) {
    var response = {};
    var totalPages = 0;
    var totalRecordsCount = yield query.count().exec();

    setupPaginatedQuery(query, currentPage, pageSize);

    var results = yield query.find().exec();

    return getResponse(results, null, totalRecordsCount, currentPage, totalPages);
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