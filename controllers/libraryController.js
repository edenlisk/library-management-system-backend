const LibrarianModel = require('../modals/librarianModal');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const multer = require('multer');


exports.getAllLibrarians = catchAsync(async (req, res, next) => {
    const librarians = await LibrarianModel.find().select({name: 1, role: 1, username: 1, email: 1, active: 1})
    res
        .status(200)
        .json(
            {
                status: "Success",
                result: librarians.length,
                data: {
                    librarians
                }
            }
        )
    ;
})

exports.deleteLibrarian = catchAsync(async (req, res, next) => {
    await LibrarianModel.findByIdAndDelete(req.params.librarianId);
    res
        .status(204)
        .json(
            {
                status: "Success"
            }
        )
    ;
})

exports.getLibrarian = catchAsync(async (req, res, next) => {
    const librarian = await LibrarianModel.findById(req.params.librarianId);
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    librarian
                }
            }
        )
    ;
})

exports.updateLibrarian = catchAsync(async (req, res, next) => {
    const librarian = await LibrarianModel.findOne({_id: req.params.librarianId});
    if (!librarian) return next(new AppError("Librarian does not exists", 400));
    if (req.body.name) librarian.name = req.body.name;
    if (req.body.role) librarian.role = req.body.role;
    if (req.body.username) librarian.username = req.body.username;
    if (req.body.password) librarian.password = req.body.password;
    if (req.body.passwordConfirm) librarian.passwordConfirm = req.body.passwordConfirm;
    if (req.body.active === false) librarian.active = false;
    if (req.body.active === true) librarian.active = true;
    if (req.file) librarian.profileImage = req.file.filename;
    await librarian.save({validateModifiedOnly: true});
    res
        .status(200)
        .json(
            {
                status: "Success",
            }
        )
    ;
})


const multerStorage = multer.diskStorage(
    {
        destination: function(req, file, cb) {
            cb(null, 'public/images/profile-photos');
        },
        filename: function(req, file, cb) {
            const extension = file.mimetype.split('/')[1];
            cb(null, `user-${req.params.id}-${new Date().getTime().toString()}.${extension}`);
        }
    }
)

const multerFilter = (req, file, cb) => {
    if (!file.mimetype.split('/')[0].startsWith('image')) {
        cb(new AppError("Not an image. Upload only images", 400), false);
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


exports.uploadProfilePhoto = upload.single('photo');

