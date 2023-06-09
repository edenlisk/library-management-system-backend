const Category = require('../modals/categoryModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


exports.getAllCategories = catchAsync(async (req, res, next) => {
    const categories = await Category.find().select({books: 0});

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
    if (req.body.categoryName.toLowerCase().trim() === 'novel') {
        await Category.create(
            {
                categoryName: req.body.categoryName.trim(),
                books: [
                    {
                        academicLevel: 'others',
                        books: []
                    }
                ]
            }
        )
    } else if (req.body.categoryName.toLowerCase() === 'creative art' || 'music' || 'ict') {
        await Category.create(
            {
                categoryName: req.body.categoryName,
                books: [
                    {
                        academicLevel: 'senior one',
                        books: []
                    },
                    {
                        academicLevel: 'senior two',
                        books: []
                    },
                    {
                        academicLevel: 'senior three',
                        books: []
                    }
                ]
            }
        )
    } else {
        await Category.create(
            {
                categoryName: req.body.categoryName,
                books: [
                    {
                        academicLevel: 'senior one',
                        books: []
                    },
                    {
                        academicLevel: 'senior two',
                        books: []
                    },
                    {
                        academicLevel: 'senior three',
                        books: []
                    },
                    {
                        academicLevel: 'senior four',
                        books: []
                    },
                    {
                        academicLevel: 'senior five',
                        books: []
                    },
                    {
                        academicLevel: 'senior six',
                        books: []
                    },
                    {
                        academicLevel: 'others',
                        books: []
                    }
                ]
            }
        )
    }

    res
        .status(200)
        .json(
            {
                status: 'Success',
            }
        )
    ;
})

