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
        next(new AppError("Class no longer exists",401));
    }
    const { _id, name:className, academicYear } = targetClass;
    const students = await Student.find(
        {
            // classIds: {$elemMatch: {academicYear: academicYear, classId: _id}},
            rentals: {$elemMatch: {academicYear: "2023-2024"}}
        }).populate("rentals");

    console.log(students)
    res
        .status(200)
        .json(
            {
                status: 'Success',
                data: {
                    students
                }
            }
        )
    // const rentalsData = [[{text: "Name of book"}, {text: 'returned'}]];
    // const populateRentals = (rentalsInfo, rentalsData) => {
    //     rentalsInfo.forEach(rental => {
    //         rentalsData.push([{text: rental.nameOfBook}, {text: rental.returned}])
    //     })
    //     return rentalsData;
    // }
    //
    // const tableData = [
    //     [{text: "student name"}, 'reg number', 'rentals', "penalty fee"]
    // ];
    // const populatedDoc = (studentsData, tableData) => {
    //     studentsData.forEach(student => {
    //         tableData.push(
    //             [
    //                 {text: student.name, alignment: 'left'},
    //                 {text: student.registrationNumber, alignment: 'left'},
    //                 student.rentals.length ? ({table:
    //                         {
    //                             width: ['auto', 'auto'],
    //                             body: populateRentals(student.rentals, rentalsData)
    //                         }
    //                 }) : {text: "none", alignment: 'center'},
    //                 {text: student.fine, alignment: 'center'}
    //             ]
    //         );
    //     })
    //     return tableData;
    // }
    //
    //
    // const docDefinition = {
    //     pageOrientation: 'landscape',
    //     content: [
    //         {text: `Library History for ${className} in ${academicYear}`, alignment: 'center'},
    //         {
    //             table: {
    //                 width: ['auto', 'auto', 400, "auto"],
    //                 body: populatedDoc(students, tableData)
    //             },
    //             alignment: 'center'
    //         }
    //     ],
    //     defaultStyle: {
    //         font: 'Helvetica',
    //         fontSize: 20
    //     }
    // };
    //
    //
    //
    // const printer = new PdfPrinter(fonts);
    //
    // // SAVE THE DOCUMENT ON THE FILE SYSTEM
    // const pdfDoc = printer.createPdfKitDocument(docDefinition);
    // // pdfDoc.pipe(fs.createWriteStream('document.pdf'));
    // // pdfDoc.end();
    //
    // // SEND DIRECTLY TO THE CLIENT WITHOUT SAVING IT IN THE FILE SYSTEM
    // res.setHeader('Content-Type', 'application/pdf');
    // pdfDoc.pipe(res);
    // pdfDoc.end();
})

exports.generateStudentReport = catchAsync(async (req, res, next) => {
    const student = await Student.findById(req.params.id).populate('rentals');
    if (!student) next(new AppError("Student no longer exists", 403));
    const studentData = [
        [{text: "book id"}, {text: "book name"}, {text: "author"}, {text: "issue date"}, {text: "due date"}, {text: "returned"}]
    ]
    const populateDoc = (rentalsInfo, studentData) => {
        rentalsInfo.forEach(rental => {
            studentData.push([{text: rental.bookId}, {text: rental.nameOfBook}, {text: rental.author}, {text: rental.issueDate}, {text: rental.dueDate}, {text: rental.returned}])
        })
        return studentData;
    }
    const docDefinition = {
        pageOrientation: 'landscape',
        pageMargins: [70, 50, 40, 50],
        content: [
            {text: `Library History for ${student.name} (${student.registrationNumber})`, alignment: 'center'},
            {
                table: {
                    width: ['*', '*', '*', '*', '*', 'auto'],
                    body: populateDoc(student.rentals, studentData),
                },
                alignment: 'center'
            }
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
