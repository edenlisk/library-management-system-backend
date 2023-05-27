const mongoose = require('mongoose');
const isEmail = require('validator/lib/isEmail');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const librarianSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "A Librarian must have a name"]
        },
        email: {
            type: String,
            required: [true, "A Librarian must have an email"],
            validate: [isEmail, "A Librarian must a valid email"],
            unique: true
        },
        username: {
            type: String,
            required: [true, "A Librarian must have username"],
            minLength: 5,
            maxLength: 20,
            unique: true
        },
        role: {
            type: String,
            enum: ['librarian', 'super-admin'],
            default: 'librarian'
        },
        password: {
            type: String,
            required: [true, "Librarian must have a password"],
            minLength: 8,
            select: false
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
        },
        passwordChangedAt: Date,
        passwordResetToken: String,
        passwordResetExpires: Date,
        profileImage: String
    },
    {
        indexes: [{ unique: true, fields: ['registrationNumber'] }],
    }
);

librarianSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
});

librarianSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;
    next();
})

librarianSchema.methods.verifyPassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}

librarianSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
}

librarianSchema.methods.createPasswordResetToken = async function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 30 * 60 * 1000;
    // await this.save({validateBeforeSave: true});
    // console.log({resetToken}, this.passwordResetToken);
    return resetToken;
}

module.exports = mongoose.model('Librarian', librarianSchema);
