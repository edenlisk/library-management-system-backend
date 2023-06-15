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
                    let { studentId, dueDate, issueDate, nameOfBook, categoryName, bookId } = rental;
                    let limitDate = new Date();
                    limitDate.setDate(limitDate.getDate() + settings.graceDays)
                    dueDate = dueDate.toISOString().split('T')[0];
                    const lastDate = new Date(limitDate).toISOString().split('T')[0];
                    const message = `
                      You have been credited ${settings.fineAmount}, due to this overdue rental. \n
                      BookId: ${bookId} \n
                      Book name: ${nameOfBook} \n
                      Issue date: ${issueDate.toISOString().split('T')[0]} \n
                      Due date: ${dueDate} \n
                      Book category: ${categoryName} \n \n
                      Please kindly consider returning the book or reporting the issue to the librarian to avoid further fines. \n \n
                      Have a good day \n \n \n \n
                      done at ${new Date().toLocaleDateString()}
                    `;
                    lastDate >= dueDate ? await Student.findByIdAndUpdate(studentId, {$inc: {fine: settings.fineAmount}, $push: {messages: {subject: "Overdue rental fine", message}}}) : await Student.findByIdAndUpdate(studentId, {$inc: {fine: 0}});
                }
            }
        } catch (e) {
            console.log(e)
            console.log('Something went wrong with overdue rentals cron job');
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
                    let { studentId, nextActiveDate, nameOfBook, bookId, categoryName } = inactiveRental;
                    nextActiveDate = nextActiveDate.toISOString().split('T')[0];
                    const currentDate = new Date().toISOString().split('T')[0];
                    const message = `
                    You have been credited ${settings.fixedAmount} due to not returning lost book on time. \n
                    BookId: ${bookId} \n
                    Book name: ${nameOfBook} \n
                    Book category: ${categoryName} \n \n \n \n
                    done at: ${new Date().toLocaleDateString()}
                    `;
                    currentDate >= nextActiveDate ? await Student.findByIdAndUpdate(studentId, {$inc: {fine: settings.fixedAmount}, $push: {messages: {subject: "Overdue Rental Fine", message}}}) : await Student.findByIdAndUpdate(studentId, {$inc: {fine: 0}})
                    inactiveRental.active = null;
                    inactiveRental.nextActiveDate = null;
                    await inactiveRental.save({validateModifiedOnly: true});
                }
            }
        } catch (e) {
            console.log(e)
            console.log('Something went wrong with inactive rentals cron job')
        }
    }, { timezone: "Africa/Kigali", scheduled: true })
    task.start();
}

exports.notifyStudents = () => {
    const task = cron.schedule('0 0 * * *', async () => {
        try {
            const today = new Date();
            let tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow = tomorrow.toISOString().split('T')[0];
            const rentals = await Rental.find({returned: false, active: true, dueDate: {$eq: new Date(tomorrow)}});
            if (rentals) {
                for (const rental of rentals) {
                    const { nameOfBook, studentId, dueDate, bookId, categoryName } = rental;
                    const message = `
                    ⚠ Reminder: Please remember to return the book with following details to avoid fines, \n
                    BookId: ${bookId} \n
                    Book name: ${nameOfBook} \n
                    Due date: ${dueDate.toISOString().split('T')[0]} \n
                    Book category: ${categoryName} \n \n \n \n
                    Enjoy your day !. \n
                    done at: ${new Date().toLocaleDateString()}.
                    `;
                    await Student.findByIdAndUpdate(studentId, {$push: {messages: {subject: "Overdue Rental Reminder", message}}});
                }
            }
        } catch (e) {
            console.log(e.message);
            console.log('Something went wrong with cron job for notifying students about overdue rentals');
        }
    }, {timezone: "Africa/Kigali", scheduled: true});
    task.start();
}
