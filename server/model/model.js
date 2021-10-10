const mongoose = require('mongoose');

var schema = new mongoose.Schema({
    userName : {
        type : String,
        required: true
    },
    careerType : {
        type: String,
        required: true,
        unique: true
    },
    gender : String,
    status : String
})

const Userdb = mongoose.model('userdb', schema);

module.exports = Userdb;