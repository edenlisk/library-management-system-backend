const PdfPrinter = require('pdfmake');
const Class = require('../modals/classModal');
const Rental = require('../modals/rentalsModal');
const Student = require('../modals/studentsModal');
const TeachersRentals = require('../modals/teachersRentalModal');
const catchAsync = require('./catchAsync');
const AppError = require('./appError');

const fonts = {
    Courier: {
        normal: 'Courier',
        bold: 'Courier-Bold',
        italics: 'Courier-Oblique',
        bolditalics: 'Courier-BoldOblique'
    },
    Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    },
    Times: {
        normal: 'Times-Roman',
        bold: 'Times-Bold',
        italics: 'Times-Italic',
        bolditalics: 'Times-BoldItalic'
    },
    Symbol: {
        normal: 'Symbol'
    },
    ZapfDingbats: {
        normal: 'ZapfDingbats'
    }
};

// TODO 6: create class GenerateReport and create methods to generate specific report -> takes in ID

exports.generateClassReport = catchAsync(async (req, res, next) => {
    const targetClass = await Class.findOne({_id: req.params.classId});
    if (!targetClass) {
        return next(new AppError("Class no longer exists",401));
    }
    const { _id, name:className,} = targetClass;
    let students = await Student.find(
        {
            classIds: {$elemMatch: {classId: _id}},
            rentals: {$elemMatch: {academicYear: targetClass.academicYear}}
        }
    )
    .populate(
        {
            path: 'rentals',
            populate: {
                path: 'rentalHistory',
                model: 'Rental'
            }
        }
    );
    if (!students) return next(new AppError("This class has no students", 400));
    const populateRentals = (rentalsInfo, rentalsData) => {
        rentalsInfo.forEach(rental => {
            rentalsData.push([{text: rental.nameOfBook.charAt(0).toUpperCase() + rental.nameOfBook.slice(1)}, {text: rental.returned}])
        })
        return rentalsData;
    }
    const tableData = [
        [
            {text: "student name", margin: [0, 5, 0, 2], fillColor: '#93c6e8'},
            {text: 'reg number', margin: [0, 5, 0, 2], fillColor: '#93c6e8'},
            {text: 'rentals', margin: [0, 5, 0, 2], fillColor: '#93c6e8'},
            {text: "fine", margin: [0, 5, 0, 2], fillColor: '#93c6e8'}
        ]
    ];

    const populatedDoc = (studentsData, tableData) => {
        studentsData.forEach(student => {
            student.rentals = student.rentals.filter(rent => rent.academicYear === targetClass.academicYear)

            const rentalsData = [[{text: "Name of book"}, {text: 'returned'}]];

            tableData.push(
                [
                    {text: student.name, alignment: 'left' , margin: [0, 5, 0, 2]},
                    {text: student.registrationNumber, alignment: 'left', margin: [0, 5, 0, 2]},
                    student.rentals[0].rentalHistory.length ? ({table:
                            {
                                width: ['auto', 'auto'],
                                body: populateRentals(student.rentals[0].rentalHistory, rentalsData)
                            }
                    }) : {text: "None", alignment: 'center', margin: [0, 5, 0, 2]},
                    {text: student.fine, alignment: 'center', margin: [0, 5, 0, 2]}
                ]
            );
        })
        return tableData;
    }


    const docDefinition = {
        pageOrientation: 'landscape',
        pageMargins: [40, 50, 40, 50],
        content: [
            {text: `Library History for ${className} in ${targetClass.academicYear}`, alignment: 'left', margin: [30, 20, 30, 20], fontSize: 25},
            {
                table: {
                    width: ['*', '*', '*', 'auto'],
                    body: populatedDoc(students, tableData),
                },
                alignment: 'center',
            }
        ],
        defaultStyle: {
            font: 'Helvetica',
            fontSize: 20
        }
    };


    const printer = new PdfPrinter(fonts);

    // SAVE THE DOCUMENT ON THE FILE SYSTEM
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    // pdfDoc.pipe(fs.createWriteStream('document.pdf'));
    // pdfDoc.end();

    // SEND DIRECTLY TO THE CLIENT WITHOUT SAVING IT TO THE FILE SYSTEM
    res.setHeader('Content-Type', 'application/pdf');
    pdfDoc.pipe(res);
    pdfDoc.end();
})

exports.generateStudentReport = catchAsync(async (req, res, next) => {
    const student = await Student.findOne({_id: req.params.studentId});
    const studentRentals = await Rental.find({studentId: req.params.studentId})
    if (!student) return next(new AppError("Student no longer exists", 403));
    const studentData = [
        [
            {text: "book id", fillColor: '#93c6e8', margin: [0, 5, 0, 2]},
            {text: "book name", fillColor: '#93c6e8', margin: [0, 5, 0, 2]},
            {text: "category", fillColor: '#93c6e8', margin: [0, 5, 0, 2]},
            {text: "issue date", fillColor: '#93c6e8', margin: [0, 5, 0, 2]},
            {text: "due date", fillColor: '#93c6e8', margin: [0, 5, 0, 2]},
            {text: "return date", fillColor: '#93c6e8', margin: [0, 5, 0, 2]},
            {text: "returned", fillColor: '#93c6e8', margin: [0, 5, 0, 2]}
        ]
    ]
    const populateDoc = (rentalsInfo, studentData) => {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        rentalsInfo.forEach((rental, index) => {
            const color = index % 2 === 0 ? '#ffffff' : '#c0cdd4';
            studentData.push(
                [
                    {text: rental.bookId, margin: [0, 5, 0, 2], fillColor: color},
                    {text: rental.nameOfBook.charAt(0).toUpperCase() + rental.nameOfBook.slice(1), margin: [0, 5, 0, 2], fillColor: color},
                    {text: rental.categoryName.charAt(0).toUpperCase() + rental.categoryName.slice(1), margin: [0, 5, 0, 2], fillColor: color},
                    {text: rental.issueDate.toISOString().split('T')[0], margin: [0, 5, 0, 2], fillColor: color},
                    {text: rental.dueDate.toISOString().split('T')[0], margin: [0, 5, 0, 2], fillColor: color},
                    {text: rental.returnDate ? rental.returnDate.toISOString().split('T')[0] : "", margin: [0, 5, 0, 2], fillColor: color},
                    {text: rental.returned, margin: [0, 5, 0, 2], fillColor: color}
                ]
            )
        })
        return studentData;
    }


    const docDefinition = {
        pageOrientation: 'landscape',
        pageMargins: [40, 50, 40, 50],
        content: [
            {text: `Library History for ${student.name} (${student.registrationNumber})`, alignment: 'center', margin: [0, 20, 0, 10], fontSize: 25},
            {
                table: {
                    width: ['*', '*', '*', '*', '*', '*', 'auto'],
                    body: populateDoc(studentRentals, studentData),
                    alignment: 'center',
                },
                alignment: 'center'
            },
            {text: `Overall fine: ${student.fine} RWF`, margin: [70, 90, 70, 90], alignment: 'center', fontSize: 40}
        ],
        defaultStyle: {
            font: 'Helvetica',
            fontSize: 20,
            alignment: 'justify'
        }
    }
    const printer = new PdfPrinter(fonts);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader("Content-Type", "application/pdf");
    pdfDoc.pipe(res);
    pdfDoc.end();
})

exports.generateNotificationReport = catchAsync(async (req, res, next) => {
    const today = new Date();
    const currentDate = new Date();
    const startDate = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1)).toISOString().split('T')[0];
    today.setDate(today.getDate() + 1);
    const notificationDate = new Date(new Date(today).toISOString().split('T')[0]);
    const teachersRentals = await TeachersRentals.find(
        {
            dueDate: {
                $gte: startDate,
                $lte: notificationDate
            },
            returned: false,
            active: true
        }
    );
    const rentals = await Rental.find(
        {
            dueDate: {
                $gte: startDate,
                $lte: notificationDate
            },
            returned: false,
            active: true
        }
    ).populate('studentId')
    const notify = [];
    if (rentals) {
        for (const rental of rentals) {
            const { name, classIds } = rental.studentId;
            const filteredClass = classIds.filter(cls => cls.academicYear === rental.academicYear);
            const {name:className} = await Class.findOne(filteredClass[0].classId);
            const { _id, nameOfBook, author, bookId, categoryName, issueDate, dueDate, academicLevel } = rental;
            const rent = {
                _id,
                nameOfBook,
                author,
                bookId,
                issueDate: issueDate.toISOString().split('T')[0],
                dueDate: dueDate.toISOString().split('T')[0],
                academicLevel,
                categoryName,
                rentalFor:name,
                className,
                model: 'student'
            }
            notify.push(rent);
        }
    }
    if (teachersRentals) {
        for (const rental of teachersRentals) {
            const { _id, nameOfBook, author, bookId, rentalFor, categoryName, issueDate, dueDate, academicLevel } = rental;
            const rent = {
                _id,
                nameOfBook,
                author,
                bookId,
                issueDate: issueDate.toISOString().split('T')[0],
                dueDate: dueDate.toISOString().split('T')[0],
                academicLevel,
                categoryName,
                rentalFor: rentalFor || null,
                className: null,
                model: 'teacher'
            }
            notify.push(rent);
        }
    }
    const rentalsDoc = [
        [
            {text: '#', fillColor: '#93c6e8', margin: [0, 5, 0, 2]},
            {text: 'Borrower', fillColor: '#93c6e8', margin: [0, 5, 0, 2]},
            {text: 'Class', fillColor: '#93c6e8', margin: [0, 5, 0, 2]},
            {text: 'Book Id', fillColor: '#93c6e8', margin: [0, 5, 0, 2]},
            {text: 'Name of book', fillColor: '#93c6e8', margin: [0, 5, 0, 2]},
            {text: 'Issue date', fillColor: '#93c6e8', margin: [0, 5, 0, 2]},
            {text: 'Due date', fillColor: '#93c6e8', margin: [0, 5, 0, 2]},
            {text: 'Category', fillColor: '#93c6e8', margin: [0, 5, 0, 2]},
        ]
    ]
    const populateDoc = (rentalsHistory, output) => {
        rentalsHistory.forEach((rent, index) => {
            const color = index % 2 === 0 ? '#ffffff' : '#c0cdd4';
            output.push(
                [
                    {text: index + 1, margin: [0, 5, 0, 2], fillColor: color},
                    {text: rent.rentalFor ? rent.rentalFor : rent.model.charAt(0).toUpperCase() + rent.model.slice(1), margin: [0, 5, 0, 2], fillColor: color},
                    {text: rent.className, margin: [0, 5, 0, 2], fillColor: color},
                    {text: rent.bookId, margin: [0, 5, 0, 2], fillColor: color},
                    {text: rent.nameOfBook.charAt(0).toUpperCase() + rent.nameOfBook.slice(1), margin: [0, 5, 0, 2], fillColor: color},
                    {text: rent.issueDate, margin: [0, 5, 0, 2], fillColor: color},
                    {text: rent.dueDate, margin: [0, 5, 0, 2], fillColor: color},
                    {text: rent.categoryName.charAt(0).toUpperCase() + rent.categoryName.slice(1), margin: [0, 5, 0, 2], fillColor: color}
                ]
            )
        })
        return output;
    }

    const docDefinition = {
        pageOrientation: 'landscape',
        pageMargins: [40, 50, 40, 50],
        content: [
            {text: `All rentals ending from ${startDate} to ${notificationDate.toISOString().split('T')[0]}`, alignment: 'center', margin: [0, 20, 0, 10], fontSize: 25},
            {
                table: {
                    width: ['*', '*', '*', '*', '*', '*', '*'],
                    body: populateDoc(notify, rentalsDoc),
                    alignment: 'center',
                },
                alignment: 'center'
            },
        ],
        defaultStyle: {
            font: 'Helvetica',
            fontSize: 20,
            alignment: 'justify'
        }
    }

    const printer = new PdfPrinter(fonts);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader("Content-Type", "application/pdf");
    pdfDoc.pipe(res);
    pdfDoc.end();
})
