const mongoose = require('mongoose');
const isEmail = require('validator/lib/isEmail');

const librarianSchema = new mongoose.Schema();

module.exports = mongoose.model('Librarian', librarianSchema);
