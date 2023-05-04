class APIFeatures {
    constructor(mongooseQuery, requestQuery) {
        this.mongooseQuery = mongooseQuery;
        this.requestQuery = requestQuery;
    }

    filter() {
        // 1A) Simple Filtering
        const queryObj = { ...this.requestQuery };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(item => delete queryObj[item]);

        // 1B) Advanced Filtering
        let queryString = JSON.stringify(queryObj);
        // Add $ on operators using regex
        queryString = queryString.replace(/\b(gt|gte|lt|lte|eq|ne|exists)\b/g, matched => `$${matched}`);
        this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryString));
        return this;
    }

    sort() {
        if (this.requestQuery.sort) {
            const sortBy = this.requestQuery.sort.split(',').join(' ');
            this.mongooseQuery = this.mongooseQuery.sort(sortBy);
        } else {
            this.mongooseQuery = this.mongooseQuery.sort('-createdAt');
        }
        return this;
    }

    limitFields() {
        if (this.requestQuery.fields) {
            const fields = this.requestQuery.fields.split(',').join(' ')
            this.mongooseQuery = this.mongooseQuery.select(fields);
        } else {
            this.mongooseQuery = this.mongooseQuery.select('-__v');
        }
        return this;
    }

    paginate() {
        const page = this.requestQuery.page * 1 || 1;
        const limit = this.requestQuery.limit * 1 || 100;
        const skipNumber = (page - 1) * limit;
        this.mongooseQuery = this.mongooseQuery.skip(skipNumber).limit(limit);
        return this;
    }
}

module.exports = APIFeatures;
