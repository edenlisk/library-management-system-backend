const cron = require('node-cron');
const Rental = require('./models/rental');
const Student = require('./models/student');

// $or: [
//     { returnDate: undefined },
//     { $expr: {$gt: ["$returnDate", "$dueDate"]} },
// ],

// Define the cron job schedule (runs every day at midnight)
cron.schedule('0 0 * * *', async () => {
    try {
        // Retrieve rentals where the book is not returned or return date is after due date
        const overdueRentals = await Rental.find({ returned: false, returnDate: undefined });
        // Calculate and update fines for each student
        for (const rental of overdueRentals) {
            let { studentId, dueDate, returnDate } = rental;
            dueDate = dueDate.toISOString().split('T')[0];
            const currentDate = new Date().toISOString().split('T')[0];
            currentDate >= dueDate ? await Student.findByIdAndUpdate(studentId, {$inc: {fine: 100}}) : await Student.findByIdAndUpdate(studentId, {$inc: {fine: 0}});
            // const daysLate = returnDate ? Math.floor((returnDate - dueDate) / (1000 * 60 * 60 * 24)) : Math.floor((currentDate - dueDate) / (1000 * 60 * 60 * 24));
            // const fineAmount = daysLate * 100;

            // Update the student's fine field
            // await Student.findByIdAndUpdate(studentId, { $inc: { fine: fineAmount } });
        }

        console.log('Fine calculation cron job completed.');
    } catch (error) {
        console.error('Error executing fine calculation cron job:', error);
    }
});

// Start the cron job
cron.start();