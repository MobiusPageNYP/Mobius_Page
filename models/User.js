const mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
// var passportLocalMongoose=require("passport-local-mongoose");
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    school: {
        type: String,
        required: true
    },
    admin: {
        type: Boolean,
        required: true
    },
    firstlogin: {
        type: Boolean
    },
    date: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    }
});

// UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', UserSchema);

module.exports = User;