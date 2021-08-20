const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const async = require('async');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs')
const bodyParser = require('body-parser');
const csv = require('csv-parser');
const multer = require('multer');
const upload = multer({ dest: 'public/files/CSV' });
const { ensureAuthenticated } = require('../config/auth');

// User model - ./ means go out this file and go in another so ../ means go out of file and folder and go in another folder or file etc
const User = require('../models/User');

const DEFAULT_PASSWORD = "#P@ssw0rd&"

// Login Page
router.get('/login', (req, res) => res.render('login'));


// First Time Login Page
router.get('/first_login', ensureAuthenticated, (req, res) => {
	// bcrypt.compare(DEFAULT_PASSWORD, req.user.password, (err, isMatch) => {
	// 	if (err) throw err;

	// 	if (isMatch) {
	// 		res.render('first_login', { LoginUser: req.user, name: req.user.name });
	// 	} else {
	// 		res.redirect('/exLandingPage');
	// 	}
	// });

	first_login = req.user.firstlogin;
	if (first_login) {
		res.render('first_login', { LoginUser: req.user, name: req.user.name });
	} else {
		req.flash('success_msg', 'Welcome back ' + req.user.name);
		res.redirect('/exLandingPage');
	}
});

router.post('/first_login', ensureAuthenticated, (req, res) => {
	async.waterfall([
		function (done) {
			//check if email given is registered with mobius
			User.findOne({ email: req.user.email }, function (err, user) {
				if (!user) {
					req.flash('error', 'No account with that email address exists.');
					return res.redirect('/users/login');
				}
				const { password, password2 } = req.body;
				let errors = [];

				// Check required fields
				if (!password || !password2) {
					errors.push({ msg: 'Please fill in all fields' });
				}

				// Check passwords match
				if (password !== password2) {
					errors.push({ msg: 'Passwords do not match' });
				}

				// Check pass length
				if (password.length < 8) {
					errors.push({ msg: 'Password should be at least 8 characters' });
				}

				if (errors.length > 0) {
					res.render('first_login', {
						errors,
						LoginUser: req.user,
						name: req.user.name,
						password,
						password2
					});
				}
				else {
					bcrypt.genSalt(10, (err, salt) =>
						bcrypt.hash(password, salt, (err, hash) => {
							if (err) throw err;
							// Set password to hashed
							user.password = hash;
							user.firstlogin = false;
							// Save user
							user.save(function (err) {
								req.logIn(user, function (err) {
									done(err, user);
								});
							});
						}))
				}
			});
		},

		//Upon success in changing password
		//An email will be sent to use as a receipt
		function (user, done) {
			console.log(user.email);
			var smtpTransport = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: 'mobiuspage@gmail.com',
					pass: 'Mobiuspage123!'
				}
			});
			var mailOptions = {
				to: user.email,
				from: 'servertestNYP@gmail.com',
				subject: 'Mobius Application Password Reset',
				text: 'Hello,\n\n' +
					'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
			};
			smtpTransport.sendMail(mailOptions);
			console.log('Mail sent!');
			res.redirect('/exLandingPage');

		}
	], function (err) {
		res.redirect('/exLandingPage');
	});

});


// Admin Register Page
router.get('/register_admin', ensureAuthenticated, (req, res) => {
	if (req.user.admin == true) {
		res.render('register_admin', { LoginUser: req.user, name: req.user.name });
	}
	else {
		req.flash('error_msg', 'Only admins allowed. Please log in with admin account');
		res.redirect('/exLandingPage');
	}
});

router.post('/register_admin', ensureAuthenticated, async (req, res) => {
	const { name, email, school, school_admin, admin } = req.body;
	var is_admin = false;
	if (admin == "admin") {
		is_admin = true;
	}
	let errors = [];
	var school_final = req.user.school.toUpperCase();
	var email_final = email.trim().toLowerCase();
	console.log("Start")
	console.log(typeof errors)
	if (req.user.email == "mobiusnyp@gmail.com") {
		//Cannot compare with null- Does not trigger if statement
		if (name == '' || email == '' || school_admin == '') {
			errors.push({ msg: 'Please fill in all fields' });
		}
		else {
			var school_final = school_admin.toUpperCase();
		}
	}
	else {
		// Check required fields
		if (name == '' || email == '') {
			errors.push({ msg: 'Please fill in all fields' });
		}
	}

	if (errors.length > 0) {
		res.render('register_admin', {
			LoginUser: req.user,
			errors,
			name,
			email,
			school,
			admin
		});
		return
	}
	try {
		user = await User.findOne({ email: email_final })
		console.log(user)
		if (user) {
			errors.push({ msg: 'Email is already registered' });
			res.render('register_admin', {
				LoginUser: req.user,
				errors,
				name,
				email,
				school,
				admin
			});
			return
		}

		var password_salt = await bcrypt.genSalt(10);
		var password_rand = await bcrypt.genSalt(10);
		var password_length = 12
		var password_final = password_rand.substring(7, password_length + 7)
		console.log(password_final);
		var hashed_password = await bcrypt.hash(password_final, password_salt);

		console.log(email_final);
		var smtpTransport = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: 'automobiusnyp@gmail.com',
				pass: 'mobiusnyp123!'
			},
			tls: {
				rejectUnauthorized: false
			}
		});
		var mailOptions = {
			to: email_final,
			from: 'automobiusnyp@gmail.com',
			subject: 'Mobius Application Account Registration',
			text: 'Hello,\n\n' +
				'  A new mobius account has been registered with the email: ' + email_final + '\n' +
				'The password for the account:' + password_final + '\n'
		};
		smtpTransport.sendMail(mailOptions, function (err) {
			if (err) {
				console.log('error occur', err);
			} else {
				console.log('Mail sent!');
				req.flash('success_msg', 'Success! Your password has been changed.');
			}
		});

		var newUser = new User()
		newUser.name = name
		newUser.email = email_final
		newUser.password = hashed_password
		newUser.school = school_final
		newUser.admin = is_admin
		newUser.firstlogin = true
		await newUser.save()

		req.flash('success_msg', 'New user registered and can log in');
		res.redirect('/users/register_admin');

	} catch (err) {
		console.log("[Error]", err)
	}

});

router.get('/csvupload', ensureAuthenticated, (req, res) => {
	if (req.user.admin == true) {
		res.render('register_csv', { LoginUser: req.user, name: req.user.name });
	}
	else {
		req.flash('error_msg', 'Only admins allowed. Please log in with an admin account');
		res.redirect('/exLandingPage');
	}
});

router.post("/csvupload", upload.single("namelist"), ensureAuthenticated, function (req, res, next) {
	let errors = [];
	let successes = [];
	var csvfile = req.file;
	if (csvfile == null) {
		console.log("Inside already")
		req.flash('error_msg', 'No File Uploaded!');
		res.redirect('/users/csvupload');
		return
	}
	async.waterfall([
		function (done) {
			var results = [];
			fs.createReadStream(csvfile.path)
				.pipe(csv())
				.on('data', (data) => results.push(data))
				.on('end', () => {
					console.log('CSV file successfully processed');
					console.log(results)
					done(null, results);
				});
		},
		async function (results, done) {
			for (var line in results) {
				if (req.user.email == "mobiusnyp@gmail.com") {
					if (results[line].Email == null || results[line].Name == null || results[line].School == null || results[line].Admin == null) {
						if (results[line].Email != null) {
							errors.push({ msg: 'At least one of the fields is missing for: ' + results[line].Email });
						}
						else {
							errors.push({ msg: 'At least one of the fields is missing for: ' + results[line].Name });
						}
						continue;
					}
					var line_Admin = results[line].Admin;
					var line_School = results[line].School;
					if (line_Admin.toLowerCase() == 'true') {
						line_Admin = true
					}
					else {
						line_Admin = false
					}
				}
				else {
					if (results[line].Email == null || results[line].Name == null) {
						if (results[line].Email != null) {
							errors.push({ msg: 'At least one of the fields is missing for: ' + results[line].Email });
						}
						else {
							errors.push({ msg: 'At least one of the fields is missing for: ' + results[line].Name });
						}
						continue;
					}
					var line_Admin = false;
					var line_School = req.user.school;
				}
				var line_Email = results[line].Email;
				var line_Name = results[line].Name;



				console.log(line_Email, line_Name, line_School, line_Admin)
				try {
					user = await User.findOne({ email: line_Email })
					console.log(user);
					if (user) {
						var registered = String('Email ' + line_Email + ' is already registered');
						// errorlist.push('error_msg', 'The e-mail ' + line_Email + ' has already been registered ');
						errors.push({ msg: registered });
						continue;
					}
					var password_salt = await bcrypt.genSalt(10);
					var password_rand = await bcrypt.genSalt(10);
					var password_length = 12
					var password_final = password_rand.substring(7, password_length + 7)
					console.log(password_final);
					var hashed_password = await bcrypt.hash(password_final, password_salt);

					var smtpTransport = nodemailer.createTransport({
						service: 'gmail',
						auth: {
							user: 'automobiusnyp@gmail.com',
							pass: 'mobiusnyp123!'
						},
						tls: {
							rejectUnauthorized: false
						}
					});
					var mailOptions = {
						to: line_Email,
						from: 'mobiuspage@gmail.com',
						subject: 'Mobius Application Account Registration',
						text: 'Hello,\n\n' +
							'  A new mobius account has been registered with the email: ' + line_Email + '\n' +
							'The password for the account:  ' + password_final + '\n'
					};


					var newUser = new User()
					newUser.name = line_Name;
					newUser.email = line_Email;
					newUser.password = hashed_password;
					newUser.school = line_School;
					newUser.admin = line_Admin;
					newUser.firstlogin = true;
					await newUser.save();

					successes.push({ msg: 'Successfully registered: ' + line_Email });

					smtpTransport.sendMail(mailOptions, function (err) {
						console.log('Mail sent!');

					});
				} catch (err) {
					console.log("[Error]", err)
				}
			}
			// done(null, successes, errorlist);
		}
		// function(successes, errorlist, done) {
		// 	res.render('register_csv', {
		// 		successes,
		// 		errorlist
		// 	});
		// 	callback(null, 'done');
		// }
	], function (err) {
		if (err) return next(err);
		console.log(errors)
		console.log(successes)
		// req.flash(errors);
		// req.flash(successes);
		// res.redirect("/users/csvupload")
		res.render('register_admin', {
			LoginUser: req.user,
			name: req.user.name,
			errors,
			successes
		});
		return
	});
});





// if(req.files){
//     console.log("Yes")
//     console.log(req.files)
// }
// console.log("No")




// Login Handle
router.post('/login', (req, res, next) => {
	passport.authenticate('local', {
		successRedirect: '/users/first_login',
		failureRedirect: '/users/login',
		failureFlash: true
	})(req, res, next);
});

// Logout Handle
router.get('/logout', (req, res) => {
	req.logout();
	req.flash('success_msg', 'You are logged out');
	res.redirect('/users/login');
});

//Forgot password
router.get('/forgot', (req, res) => {
	res.render('forgot');
});


router.post('/forgot', function (req, res, next) {
	async.waterfall([
		function (done) {
			crypto.randomBytes(20, function (err, buf) {
				//generate random token
				var token = buf.toString('hex');
				done(err, token);
			});
		},
		function (token, done) {
			//check if email given is registered with mobius
			User.findOne({ email: req.body.email }, function (err, user) {
				if (!user) {
					req.flash('error', 'No account with that email address exists.');
					return res.redirect('/users/forgot');
				}

				//token is assigned to the user
				//valid for only an hour
				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

				user.save(function (err) {
					done(err, token, user);
				});
			});
		},
		//Send the email to user
		function (token, user, done) {
			var smtpTransport = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: 'automobiusnyp@gmail.com',
					pass: 'mobiusnyp123!'
				},
				tls: {
					rejectUnauthorized: false
				}
			});
			var mailOptions = {
				to: user.email,
				from: 'servertestNYP@gmail.com',
				subject: 'Mobius Application Password Reset',
				text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
					'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
					'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
					'If you did not request this, please ignore this email and your password will remain unchanged.\n'
			};
			smtpTransport.sendMail(mailOptions, function (err) {
				console.log('Mail sent!');
				req.flash('success_msg', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
				done(err, 'done');
			});
		}
	], function (err) {
		if (err) return next(err);
		res.redirect('/users/forgot');
	});
});

//link in email is clicked and redirected to reset password page
router.get('/reset/:token', function (req, res) {
	User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
		if (!user) {
			req.flash('error', 'Password reset token is invalid or has expired.');
			return res.redirect('/users/forgot');
		}
		res.render('reset', { token: req.params.token });
	});
});

//Saving new password
router.post('/reset/:token', function (req, res) {
	async.waterfall([
		function (done) {
			User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
				if (!user) {
					req.flash('error', 'Password reset token is invalid or has expired.');
					return res.redirect('back');
				}

				const { password, confirm } = req.body;
				let errors = [];

				// Check required fields
				if (!confirm || !password) {
					req.flash("error", "Please fill in all fields");
					// errors.push({ msg: 'Please fill in all fields' });
					return res.redirect('back');
				}

				// Check pass length
				if (password.length < 8) {
					req.flash("error", "Password should be at least 8 characters");
					// errors.push({ msg: 'Password should be at least 8 characters' });
					return res.redirect('back');

				}


				if (req.body.password !== req.body.confirm) {
					// errors.push({ msg: 'Passwords do not match.' });
					req.flash("error", "Passwords do not match.");
					return res.redirect('back');
				}

				else {
					bcrypt.genSalt(10, (err, salt) =>
						bcrypt.hash(req.body.password, salt, (err, hash) => {
							if (err) throw err;
							// Set password to hashed
							user.password = hash;
							user.resetPasswordToken = undefined;
							user.resetPasswordExpires = undefined;
							// Save user
							user.save(function (err) {
								req.logIn(user, function (err) {
									done(err, user);
								});
							});
						}))
				}
			});
		},
		//Upon success in changing password
		//An email will be sent to use as a receipt
		function (user, done) {
			var smtpTransport = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: 'servertestNYP@gmail.com',
					pass: 'Mobiuspage123!'
				},
				tls: {
					rejectUnauthorized: false
				}
			});
			var mailOptions = {
				to: user.email,
				from: 'servertestNYP@gmail.com',
				subject: 'Mobius Application Password Reset',
				text: 'Hello,\n\n' +
					'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
			};
			smtpTransport.sendMail(mailOptions, function (err) {
				console.log('Mail sent!');
				req.flash('success_msg', 'Success! Your password has been changed.');
				done(err);
			});
		}
	], function (err) {
		res.redirect('/exLandingPage');
	});
});

module.exports = router;