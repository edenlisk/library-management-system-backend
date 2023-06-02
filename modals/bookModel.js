const mongoose = require('mongoose');
const Category = require('../modals/categoryModel');
const AppError = require('../utils/appError');


const bookSchema = new mongoose.Schema(
    {
        bookName: {
            type: String,
            required: true,
            lowercase: true
        },
        author: {
          type: String,
          required: true
        },
        academicLevel: {
          type: String,
          lowercase: true
        },
        edition: {
          type: String
        },
        language: {
          type: String,
          lowercase: true
        },
        categoryName: {
            type: String,
            required: true,
            lowercase: true
        },
        numberOfBooks: {
            type: Number,
            required: true
        },
        bookNameAcademicLevel: {
            type: String,
            select: false,
            default: function () {
                return `${this.bookName}${this.academicLevel}`
            },
            unique: true
        },
        numberOfRentals: {
         type: Number,
         default: 0
        },
        availableCopy: {
            type: Number,
            default: function () {
                return this.numberOfBooks
            }
        }
    },
    {
        indexes: [{ unique: true, fields: ['bookNameAcademicLevel'] }],
    }
)

bookSchema.pre('save', async function (next) {
    if (this.isNew) {
        const targetCategory = await Category.findOne({categoryName: this.categoryName});
        if (!targetCategory) return next(new AppError("Category no longer exists!", 400));
        if (!targetCategory) {
            return next(new AppError("Category no longer exists or Book already exists in another category", 400));
        } else {
            const category = await Category.findOneAndUpdate(
                {categoryName: this.categoryName, books: {$elemMatch: {academicLevel: this.academicLevel}}},
                {$push: {'books.$.books': this._id}},
                {new: true, runValidators: true}
            )
            category.books.forEach(book => {
                book.numberOfBooks = book.books.length;
            })
            await category.save({validateModifiedOnly: true})
            if (!category) return next(new AppError("Something went wrong!", 400));
        }
    }
    if (this.isModified('numberOfBooks') && !this.isNew) {
        const { numberOfBooks } = await bookModel.findOne({_id: this._id});
        if (parseInt(numberOfBooks) < parseInt(this.numberOfBooks)) {
            this.availableCopy += parseInt(this.numberOfBooks) - parseInt(numberOfBooks);
        } else if (parseInt(numberOfBooks) > parseInt(this.numberOfBooks)) {
            this.availableCopy -= parseInt(numberOfBooks) - parseInt(this.numberOfBooks);
        }
    }
    this.bookName = this.bookName.trim();
    this.edition = this.edition.trim();
    this.author = this.author.trim();
    this.categoryName = this.categoryName.trim();
    this.language = this.language.trim();
    next();
})


const bookModel = mongoose.model('Book', bookSchema);
module.exports = bookModel;
