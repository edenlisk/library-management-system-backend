const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        categoryName: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },
        books: {
            type: [
                {
                    academicLevel: {
                        type: String,
                        lowercase: true,
                        required: true
                    },
                    books: [
                        {
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'Book'
                        }
                    ],
                    numberOfBooks: {
                        type: Number,
                        default: 0
                    }
                }
            ]
        }
    }
)

categorySchema.pre('findOneAndUpdate', async function (next) {
})

const categoryModel = mongoose.model('Category', categorySchema);
module.exports = categoryModel;
