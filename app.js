const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const methodOverride = require('method-override');
const $ = require('jquery');
const bodyParser = require('body-parser');
const csv = require('csv-parser');
const fs = require('fs');
var multer = require('multer');
var upload = multer({ dest: 'public/files/CSV' });
const app = express();


//
const publicDir = require('path').join(__dirname, '/public');
app.use(express.static(publicDir));

// Passport config
require('./config/passport')(passport);

// DB Config
const db = require('./config/keys').MongoURI;
const { type } = require('os');

// Connect to Mongo
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

// Bodyparser
app.use(express.urlencoded({ extended: false }));

// Express Session
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

//Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global Vars
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

//Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
// app.use('/test', require('./routes/test'));

//Method Override
app.use(methodOverride('_method'));
app.use(bodyParser.json());
const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server started on port ${PORT}`));

app.get('/csvupload', (req, res) => {
    res.render('register_csv');
    // if (req.user.email == "mobiusnyp@gmail.com") {
    // 	res.render('register_csv', { LoginUser: req.user, name: req.user.name});
    // }
    // else {
    // 	req.flash('error_msg', 'Only admins allowed. Please log in with the correct admin account');
    // 	res.redirect('/exLandingPage');
    // }
});

