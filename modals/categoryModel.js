const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        categoryName: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            validate: {
                validator: (elem) => {
                    return /^[a-zA-Z0-9]+$/g.test(elem)
                },
                message: "Invalid name, can't contain special characters"
            }
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
