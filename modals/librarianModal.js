const mongoose = require('mongoose');
const isEmail = require('validator/lib/isEmail');

const librarianSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "A Librarian must have a name"]
        },
        email: {
            type: String,
            required: [true, "A Librarian must have an email"],
            validate: [isEmail, "A Librarian must a valid email"]
        },
        username: {
            type: String,
            required: [true, "A Librarian must have username"],
            minLength: 5,
            maxLength: 20
        },
        password: {
            type: String,
            required: [true, "Librarian must have a password"],
            minLength: 8
        },
        passwordConfirm: {
            type: String,
            required: [true, "You must confirm the password"],
            validate: {
                validator: function (element) {
                    return this.password === element
                },
                message: "Passwords does not match"
            }
        }
    }
);

module.exports = mongoose.model('Librarian', librarianSchema);
