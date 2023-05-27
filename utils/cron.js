const cron = require('node-cron');
const Rental = require('../modals/rentalsModal');
const Student = require('../modals/studentsModal');

exports.overDueRentalsCronJob = () => {
    const task = cron.schedule('0 0 * * *', async () => {
        try {
            const overdueRentals = await Rental.find({ returned: false, returnDate: undefined, active: true });
            // Calculate and update fines for each student
            if (overdueRentals) {
                for (const rental of overdueRentals) {
                    let { studentId, dueDate } = rental;
                    dueDate = dueDate.toISOString().split('T')[0];
                    const currentDate = new Date().toISOString().split('T')[0];
                    currentDate >= dueDate ? await Student.findByIdAndUpdate(studentId, {$inc: {fine: 100}}) : await Student.findByIdAndUpdate(studentId, {$inc: {fine: 0}});
                }
            }
        } catch (e) {
            console.log('Something went wrong with overdue rentals cron job')
        }
    }, { timezone: "Africa/Kigali", scheduled: true });
    task.start();
};

exports.inactiveRentalsCronJob = () => {
    const task = cron.schedule('0 0 * * *', async () => {
        try {
            const inactiveRentals = await Rental.find({active: false, returned: false, nextActiveDate: !undefined});
            if (inactiveRentals) {
                for (const inactiveRental of inactiveRentals) {
                    let { studentId, nextActiveDate } = inactiveRental;
                    nextActiveDate = nextActiveDate.toISOString().split('T')[0];
                    const currentDate = new Date().toISOString().split('T')[0];
                    currentDate >= nextActiveDate ? await Student.findByIdAndUpdate(studentId, {$inc: {fine: 20}}) : await Student.findByIdAndUpdate(studentId, {$inc: {fine: 0}})
                }
            }
        } catch (e) {
            console.log('Something went wrong with inactive rentals cron job')
        }
    }, { timezone: "Africa/Kigali", scheduled: true })
    task.start();
}
