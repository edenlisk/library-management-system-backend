const Category = require('../modals/categoryModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


exports.getAllCategories = catchAsync(async (req, res, next) => {
    const categories = await Category.find().select({books: 0})
    ;

    res
        .status(200)
        .json(
            {
                status: 'Success',
                data: {
                    categories
                }
            }
        )
    ;
})

exports.getCategory = catchAsync(async (req, res, next) => {
    const category = await Category.findOne({_id: req.params.categoryId});
    if (!category) return next(new AppError("Category no longer exists!", 400));
    res
        .status(200)
        .json(
            {
                status: 'Success',
                data: {
                    category
                }
            }
        )
    ;
})

exports.createCategory = catchAsync(async (req, res, next) => {
    if (req.body.categoryName === 'novel') {
        const newCategory = await Category.create(
            {
                categoryName: req.body.categoryName,
                books: [
                    {
                        academicLevel: 'other',
                        books: []
                    }
                ]
            }
        )
        res
            .status(200)
            .json(
                {
                    status: 'Success',
                    data: {
                        newCategory
                    }
                }
            )
        ;

    } else {
        const newCategory = await Category.create(
            {
                categoryName: req.body.categoryName,
                books: [
                    {
                        academicLevel: 's1',
                        books: []
                    },
                    {
                        academicLevel: 's2',
                        books: []
                    },
                    {
                        academicLevel: 's3',
                        books: []
                    },
                    {
                        academicLevel: 's4',
                        books: []
                    },
                    {
                        academicLevel: 's5',
                        books: []
                    },
                    {
                        academicLevel: 's6',
                        books: []
                    },
                    {
                        academicLevel: 'other',
                        books: []
                    }
                ]
            }
        )

        res
            .status(200)
            .json(
                {
                    status: 'Success',
                    data: {
                        newCategory
                    }
                }
            )
        ;
    }

})

