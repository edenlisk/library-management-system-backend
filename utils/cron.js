const cron = require('node-cron');
const Rental = require('../modals/rentalsModal');
const Student = require('../modals/studentsModal');
const Settings = require('../modals/settingsModel');

exports.overDueRentalsCronJob = () => {
    const task = cron.schedule('0 0 * * *', async () => {
        try {
            const settings = await Settings.findOne().limit(1);
            const overdueRentals = await Rental.find({ returned: false, returnDate: null, active: true });
            // Calculate and update fines for each student
            if (overdueRentals) {
                for (const rental of overdueRentals) {
                    let { studentId, dueDate } = rental;
                    let limitDate = new Date();
                    limitDate.setDate(limitDate.getDate() + settings.graceDays)
                    dueDate = dueDate.toISOString().split('T')[0];
                    const lastDate = new Date(limitDate).toISOString().split('T')[0];
                    lastDate >= dueDate ? await Student.findByIdAndUpdate(studentId, {$inc: {fine: settings.fineAmount}}) : await Student.findByIdAndUpdate(studentId, {$inc: {fine: 0}});
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
            const settings = await Settings.findOne().limit(1);
            const inactiveRentals = await Rental.find({active: false, returned: false});
            if (inactiveRentals) {
                for (const inactiveRental of inactiveRentals) {
                    let { studentId, nextActiveDate } = inactiveRental;
                    nextActiveDate = nextActiveDate.toISOString().split('T')[0];
                    const currentDate = new Date().toISOString().split('T')[0];
                    currentDate >= nextActiveDate ? await Student.findByIdAndUpdate(studentId, {$inc: {fine: settings.fixedAmount}}) : await Student.findByIdAndUpdate(studentId, {$inc: {fine: 0}})
                    inactiveRental.active = null;
                    inactiveRental.nextActiveDate = null;
                    await  inactiveRental.save({validateModifiedOnly: true});
                }
            }
        } catch (e) {
            console.log('Something went wrong with inactive rentals cron job')
        }
    }, { timezone: "Africa/Kigali", scheduled: true })
    task.start();
}
