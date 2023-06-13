const fs = require('fs');
const csvtojson = require('csvtojson');
const multer = require('multer');
const Category = require('../modals/categoryModel');
const Book = require('../modals/bookModel');
const Settings = require('../modals/settingsModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


exports.createBook = catchAsync(async (req, res, next) => {
    const newBook = await Book.create(
        {
            bookName: req.body.bookName,
            author: req.body.author,
            academicLevel: req.body.academicLevel,
            edition: req.body.edition,
            numberOfBooks: req.body.numberOfBooks,
            language: req.body.language,
            categoryName: req.body.categoryName
        }
    )
    newBook.bookNameAcademicLevel = undefined;
    res
        .status(200)
        .json(
            {
                status: 'Success',
                data: {
                    newBook
                }
            }
        )
    ;
})

exports.deleteBook = catchAsync(async (req, res, next) => {
    if (!req.params.bookId) return next(new AppError("Please provide bookId to delete", 401));
    const deletedBook = await Book.findOneAndDelete({_id: req.params.bookId});
    if (!deletedBook) return next(new AppError("Book no longer exists!", 400));
    res
        .status(204)
        .json(
            {
                status: 'Success'
            }
        )
    ;
})

exports.updateBook = catchAsync(async (req, res, next) => {
    const book = await Book.findOne({_id: req.params.bookId});
    if (!book) return next(new AppError("Book no longer exists!", 400));
    if (req.body.bookName) book.bookName = req.body.bookName;
    if (req.body.numberOfBooks) book.numberOfBooks = req.body.numberOfBooks;
    if (req.body.author) book.author = req.body.author;
    if (req.body.edition) book.edition = req.body.edition;
    if (req.body.language) book.language = req.body.language;
    await book.save({validateModifiedOnly: true});
    res
        .status(200)
        .json(
            {
                status: 'Success',
                data: {
                    book
                }
            }
        )
    ;
})

exports.getAllBooks = catchAsync(async (req, res, next) => {
    const books = await Book.find();

    res
        .status(200)
        .json(
            {
                status: 'Success',
                data: {
                    books
                }
            }
        )
    ;
})

exports.getBook = catchAsync(async (req, res, next) => {
    const book = await Book.findOne({_id: req.params.bookId});
    if (!book) return next(new AppError("Book no longer exists!", 400));
    res
        .status(200)
        .json(
            {
                status: 'Success',
                data: {
                    book
                }
            }
        )
    ;
})

exports.lessBooks = catchAsync(async (req, res, next) => {
    const { limitPercentage } = await Settings.findOne().limit(1);
    const threshold = limitPercentage / 100;
    const books = await Book.find({
        $expr: {
            $lte: [
                "$availableCopy",
                {
                    $multiply: ["$numberOfBooks", threshold]
                }
            ]
        }
    });
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    books
                }
            }
        )
    ;
})

exports.importBooks = catchAsync(async (req, res, next) => {
    if (!fs.existsSync(`${__dirname}/../public/data/${req.file.filename}`)) {
        return next(new AppError('File not found, please try again', 401));
    }
    const books = await csvtojson().fromFile(`${__dirname}/../public/data/${req.file.filename}`);
    if (!books) return next(new AppError("No data found in file uploaded", 400));
    for (const book of books) {
        book.numberOfBooks = parseInt(book.numberOfBooks);
        const category = await Category.findOne({categoryName: book.categoryName.trim()});
        if (category) {
            const bk = await Book.findOne({bookName: book.bookName.trim(), academicLevel: book.academicLevel.trim()});
            if (!bk) {
                await Book.create({
                    bookName: book.bookName,
                    author: book.author,
                    academicLevel: book.academicLevel,
                    edition: book.edition,
                    language: book.language,
                    categoryName: book.categoryName,
                    numberOfBooks: book.numberOfBooks,
                });
            }
        }
    }

    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    books
                }
            }
        )

})


const multerStorage = multer.diskStorage(
    {
        destination: function(req, file, cb) {
            cb(null, 'public/data');
        },
        filename: function(req, file, cb) {
            const extension = file.mimetype.split('/')[1];
            cb(null, `books-${new Date().getTime().toString()}.${extension}`);
        }
    }
)

const multerFilter = (req, file, cb) => {
    if (!file.mimetype.split('/')[0].startsWith('text')) {
        cb(new AppError("Not an CSV file, please upload only CSV", 400), false);
    } else {
        cb(null, true);
    }
}

const upload = multer(
    {
        storage: multerStorage,
        fileFilter: multerFilter
    }
)


exports.uploadBooks = upload.single('books');










