const crypto = require('crypto');
const { promisify } = require('util');
const LibrarianModal = require('../modals/librarianModal');
const Teacher = require('../modals/teachersModal');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');
const Student = require('../modals/studentsModal');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {expiresIn: process.env.EXPIRES_IN});
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN + 24 * 60 * 60 * 1000),
        httpOnly: true
    }
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions)

    res
        .status(statusCode)
        .json(
            {
                status: "Success",
                token,
                data: {
                    user
                }
            }
        )
    ;
}


exports.signup = catchAsync(async (req, res, next) => {
    const newLibrarian = await LibrarianModal.create(
        {
            name: req.body.name,
            email: req.body.email,
            username: req.body.username,
            role: req.body.role,
            accessibility: req.body.accessibility,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm
        }
    );
    newLibrarian.password = undefined;
    const loginUrl = `${req.protocol}://${req.get('host')}/librarians/login`;
    // username, loginUrl, resourceUrl, url, subject
    // await new Email(newLibrarian, loginUrl).sendWelcome('welcome', 'Welcome to Lycee De Kigali LMS');
    createSendToken(newLibrarian, 201, res);
})

exports.login = catchAsync(async (req, res, next) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError("Please provide email and password", 400));
    }

    const librarian = await LibrarianModal.findOne({email: email.trim()}).select("+password");
    if (!librarian || !(await librarian.verifyPassword(password))) {
        return next(new AppError("Invalid Email or Password"), 401);
    }
    if (librarian.active !== true) return next(new AppError("Your Account is suspended, please contact admin to re-activate", 401));
    librarian.password = undefined;
    createSendToken(librarian, 200, res);
})

exports.logout = catchAsync(async (req, res, next) => {
    res.cookie('jwt', '', {expires: new Date(Date.now() + 1000)})
    res
        .status(204)
        .json(
            {
                status: "Success",
                message: "Logged out"
            }
        )
    ;
})

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    if (req.cookies.jwt) {
        token = req.cookies.jwt;
    } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(' ')[1];
    }
    // VERIFICATION OF TOKEN
    if (!token) {
        return next(new AppError("You're not logged in, Please login", 401));
    }
    // CHECK IF USER STILL EXISTS
    const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);
    const currentLibrarian = await LibrarianModal.findById(decode.id);
    if (!currentLibrarian) {
        return next(new AppError("The token belonging to this librarian no longer exists"), 401);
    }
    // CHECK IF USER HAVE CHANGED THE PASSWORD AFTER THE TOKEN WAS ISSUED
    if (currentLibrarian.changedPasswordAfter(decode.iat)) {
        return next(new AppError("The user recently changed password!, Please log in again"), 401);
    }
    if (currentLibrarian.active === false) return next(new AppError("Your account is suspended, please contact admin to re-activate", 401));

    req.user = currentLibrarian;
    next()
})
// TODO 5: Error handling -> done
exports.restrictTo = (option, role) => {
    return async (req, res, next) => {
        // const librarian = await LibrarianModal.findOne({_id: "647b8ddb2909a231bfce9a4c"});
        const {role:roles} = req.user;
        if (roles && roles[option][role] === true) {
            return next();
        } else {
            return next(new AppError("You don't have permissions to perform this action", 401));
        }
        // const {role} = req.user;
        // console.log(role);

        // if (!roles.includes(req.user.role)) {
        //     next(new AppError("You don't have permissions to perform this action"), 401);
        // }
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1. Check if user with POSTed email exists
    const currentUser = await LibrarianModal.findOne({email: req.body.email.trim()});
    if (!currentUser) return next(new AppError("There is not user with this email", 404));
    // 2. Generate random token
    const resetToken = await currentUser.createPasswordResetToken();
    await currentUser.save({validateBeforeSave: false});
    // 3. Send it to user's email
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/librarians/${resetToken}`;
    // const message = `Forgot your password? Please click on the following link to reset it \n ${resetUrl} \n If you didn't create this request, Please ignore this email`;
    try {
        await new Email(currentUser, resetUrl).sendPasswordReset('passwordReset', 'Password Reset token');
        res
            .status(200)
            .json(
                {
                    status: "Success",
                    message: "Reset Link sent on your email"
                }
            )
    } catch (err) {
        currentUser.passwordResetExpires = undefined;
        currentUser.passwordResetToken = undefined
        await currentUser.save({validateBeforeSave: false});
        next(new AppError("There was an error with sending email. Please try again later", 500));
    }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1. Get user based on token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const currentUser = await LibrarianModal.findOne(
        {
            passwordResetToken: hashedToken,
            passwordResetExpires: {$gt: Date.now()}
        }
    )
    // console.log(hashedToken);
    // 2. If token has not expired, and there is the user then reset the password
    if (!currentUser) return next(new AppError("Invalid Token or has expired", 400));
    if (req.body.password) currentUser.password = req.body.password;
    if (req.body.passwordConfirm) currentUser.passwordConfirm = req.body.passwordConfirm;
    currentUser.passwordResetToken = undefined;
    currentUser.passwordResetExpires = undefined;
    await currentUser.save();
    // 3. Updated passwordChangedAt for the user -> done with pre('save') middleware

    // 4. Log the user in, send JWT
    currentUser.password = undefined;
    createSendToken(currentUser, 200, res);
})

exports.adminSignup = catchAsync(async (req, res, next) => {
    req.body.role = 'super-admin';
    next();
})

exports.studentLogin = catchAsync(async (req, res, next) => {
    const { registrationNumber, password } = req.body;

    if (!registrationNumber || !password) return next(new AppError("Please provide registration number and password", 401));
    const student = await Student.findOne({registrationNumber: registrationNumber.trim()}).select("+password");
    if (!student || !(await student.verifyPassword(password))) {
        return next(new AppError("Invalid registration number or Password"), 401);
    }
    student.password = undefined;
    createSendToken(student, 200, res);
})

exports.teacherLogin = catchAsync(async (req, res, next) => {
    const { registrationNumber, password } = req.body;

    if (!registrationNumber || !password) return next(new AppError("Please provide registration number and password", 401));
    const teacher = await Teacher.findOne({registrationNumber: registrationNumber.trim()}).select("+password");
    if (!teacher || !(await teacher.verifyPassword(password))) {
        return next(new AppError("Invalid registration number or Password"), 401);
    }
    teacher.password = undefined;
    createSendToken(teacher, 200, res);
})
