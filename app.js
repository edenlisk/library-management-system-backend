// const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const { overDueRentalsCronJob, inactiveRentalsCronJob } = require('./utils/cron');

const rateLimit = require('express-rate-limit');
const AppError = require('./utils/appError');
const globalErrorHandlers = require('./controllers/errorController');

/* REQUIRING ROUTES */
const libraryRouter = require('./routes/libraryRoutes');
const studentsRouter = require('./routes/studentsRoutes');
const classRouter = require('./routes/classRoutes');
const rentalsRouter = require('./routes/rentalsRoutes');
const teachersRouter = require('./routes/teachersRoutes');
const teachersRentalRouter = require('./routes/teachersRentalRoutes');
const academicYearRouter = require('./routes/academicYearRoutes');
const adminRoutes = require('./routes/adminRoutes');
const statsRoutes = require('./routes/statsRoutes');
const booksRoutes = require('./routes/booksRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
// const reportsRouter = require('./routes/reportsRoutes');

const app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(mongoSanitize());
app.use(xss());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
overDueRentalsCronJob();
inactiveRentalsCronJob();


const limiter = rateLimit(
    {
      max: 2000,
      windowMs: 60 * 60 * 1000,
      message: "Too many requests from this IP, please try again in an hour"
    }
)

const allowlist = ['localhost'];
const corsOptionsDelegate = function (req, callback) {
    let corsOptions;
    if (allowlist.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
        callback(null, corsOptions)
    } else {
        corsOptions = { origin: false } // disable CORS for this request
        callback(new AppError("Your domain is not allowed on this server"), corsOptions)
    }
    // callback(null, corsOptions) // callback expects two parameters: error and options
}

app.use(hpp())
app.use(helmet());
app.use('/api', limiter);
// app.use('*', cors(corsOptionsDelegate));

/* SETUP ROUTES */
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/librarians', libraryRouter);
app.use('/api/v1/students', studentsRouter);
app.use('/api/v1/classes', classRouter);
app.use('/api/v1/rentals', rentalsRouter);
app.use('/api/v1/teachers', teachersRouter);
app.use('/api/v1/teachers-rental', teachersRentalRouter);
app.use('/api/v1/academic-year', academicYearRouter);
app.use('/api/v1/statistics', statsRoutes);
app.use('/api/v1/books', booksRoutes);
app.use('/api/v1/book-category', categoryRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`));
})

app.use(globalErrorHandlers);

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};
//
//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

module.exports = app;
