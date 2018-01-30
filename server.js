const express = require('express');
// create express.js app
const app = express();
// requires for pathing
const path = require('path');
// adding for ability to parse json
const bodyParser = require('body-parser');
// validations
// const expressValidator = require('express-validator');

const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');

const axios = require('axios');

// get our config json
const config = require('./config.json');

const handlebars = require('express-hbs');

// set the view engine
app.set('view engine', 'hbs');

// configure the view engine 
app.engine('hbs', handlebars.express4());
// configure views path
app.set('views', path.join(__dirname,'/'));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/registration/:site', [

	check('site', 'no site provided').isLength({ min: 1 })

	], function(req, res) {
    // res.sendFile(path.join(__dirname + '/index.html'));
    // const indexTemplate = handlebars.compile(path.join(__dirname + '/index.html'));
    // console.log(indexTemplate)
    // const html = indexTemplate({ site: req.site })
    // res.sendFile(html)

     res.render('index', { site: req.params.site });
});

app.post('/registration/:site', [
	check('mail').isEmail().withMessage('must be a valid email address').trim().normalizeEmail(),
	check('firstName', 'first name is required').isLength({ min: 8 }),
	check('lastName', 'first name is required').isLength({ min: 8 }),
	check('pass1', 'passwords must be at least 8 chars long').isLength({ min: 8 }),
	check('pass2', 'passwords must be at least 8 chars long').isLength({ min: 8 }),
	],function(req, res) {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.mapped() });
  }

  const newUser = matchedData(req);

  // console.log(newUser)

  axios.post( 'http://bovinegenome.org/apollo-lsaa/user/createUser', {
 	email: newUser.email,
    newPassword: newUser.pass1,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    role: 'user',
    username: 'admin_email',
    password: 'admin_password'
  }).then((resp) => {
	console.log(resp);
  	// send off the user's group
  	axios.post( 'http://bovinegenome.org/apollo-lsaa/user/addUserToGroup', {
	    username: "admin_username",
	    password: "admin_password",
	    group: "group name",
	    user: newUser.email
	}).then((resp) => {
		return res.status(200).json({ success: true })
	}).catch((error) => {
		throw(error)
	})
  }).catch((error) => {
    return res.status(422).json({ errors: error });
  })

});

app.get('/registration/success/:site', function(req, res) {
     res.render('success', { site_url: 'www.google.com/stuff' });
});

app.listen(5000);