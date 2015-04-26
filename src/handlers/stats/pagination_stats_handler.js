function* getPaginatedResults(query, currentPage, pageSize) {
    var totalPages = ''
    var totalRecordsCount = yield query.count().exec();

    if(currentPage != 0  && pageSize != 0) {
        query = query.limit(pageSize).skip((currentPage - 1) * pageSize)
    }

    var results = yield query.find().exec()

    if(currentPage != 0  && pageSize != 0) {
        totalPages = Math.ceil(totalRecordsCount / pageSize)
    }
    var response = {
        results: results,
        totalCount: totalRecordsCount,
        page: currentPage,
        totalPages: totalPages
    }


    return response;
}

module.exports.getPaginatedResults = getPaginatedResults