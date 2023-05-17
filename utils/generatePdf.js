const PdfPrinter = require('pdfmake');
const Class = require('../modals/classModal');
const Student = require('../modals/studentsModal');
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
    const students = await Student.find(
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
    const rentalsData = [[{text: "Name of book"}, {text: 'returned'}]];
    const populateRentals = (rentalsInfo, rentalsData) => {
        rentalsInfo.forEach(rental => {
            rentalsData.push([{text: rental.nameOfBook}, {text: rental.returned}])
        })
        return rentalsData;
    }
    const tableData = [
        [{text: "student name"}, 'reg number', 'rentals', "penalty fee"]
    ];
    const populatedDoc = (studentsData, tableData) => {
        studentsData.forEach(student => {
            tableData.push(
                [
                    {text: student.name, alignment: 'left'},
                    {text: student.registrationNumber, alignment: 'left'},
                    student.rentals[0].rentalHistory.length ? ({table:
                            {
                                width: ['auto', 'auto'],
                                body: populateRentals(student.rentals[0].rentalHistory, rentalsData)
                            }
                    }) : {text: "none", alignment: 'center'},
                    {text: student.fine, alignment: 'center'}
                ]
            );
        })
        return tableData;
    }

    const docDefinition = {
        pageOrientation: 'landscape',
        pageMargins: [90, 40, 50, 50],
        content: [
            {text: `Library History for ${className} in ${targetClass.academicYear}`, alignment: 'left'},
            {
                table: {
                    width: ['100', 'auto', '500', '*'],
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
    let student = await Student.findOne(
        {_id: req.params.studentId, rentals: {$elemMatch: {academicYear: req.params.academicYear}}}
        )
        .populate(
            {
                path: 'rentals',
                populate: {
                    path: 'rentalHistory',
                    model: 'Rental'
                }
            }
        )
    ;
    if (!student) return next(new AppError("Student no longer exists", 403));

    const studentData = [
        [{text: "book id"}, {text: "book name"}, {text: "category"}, {text: "issue date"}, {text: "due date"}, {text: "returned"}]
    ]
    const populateDoc = (rentalsInfo, studentData) => {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        rentalsInfo.forEach(rental => {
            studentData.push([{text: rental.bookId}, {text: rental.nameOfBook}, {text: rental.category}, {text: rental.issueDate ? rental.issueDate.toLocaleDateString('en-US', options) : ''}, {text: rental.dueDate ? rental.dueDate.toLocaleDateString('en-US', options) : ''}, {text: rental.returned}])
        })
        return studentData;
    }
    const docDefinition = {
        pageOrientation: 'landscape',
        pageMargins: [70, 50, 40, 50],
        content: [
            {text: `Library History for ${student.name} (${student.registrationNumber})`, alignment: 'left'},
            {
                table: {
                    width: ['*', '*', '*', '*', '*', 'auto'],
                    body: populateDoc(student.rentals[0].rentalHistory, studentData),
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
