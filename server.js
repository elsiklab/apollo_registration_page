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

    let selectedSite = config.sites.filter((site) => {
    	return site.name === req.params.site
    })

    if(selectedSite.length > 0){
    	res.render('index', { 
    		site: selectedSite[0].name, 
    		site_url: selectedSite[0].url
    	});
    }  else {
    	return res.status(400).send("<p>This is not the page you are looking for</p>")
    }
});

app.post('/registration/:site', [
	check('mail').isEmail().withMessage('must be a valid email address').trim().normalizeEmail(),
	check('firstName', 'first name is required').isLength({ min: 1 }),
	check('lastName', 'first name is required').isLength({ min: 1 }),
	check('pass1', 'passwords must be at least 8 chars long').isLength({ min: 8 }),
	check('pass2', 'passwords must be at least 8 chars long').isLength({ min: 8 }),
	],function(req, res) {

    const errors = validationResult(req);

	if (!errors.isEmpty()) {
		console.log(errors)
		return res.status(422).json({ errors: errors.mapped() });
	}

	let selectedSite = config.sites.filter((site) => {
		return site.name === req.params.site
	})

    if(selectedSite.length > 0){

	  const newUser = matchedData(req);

	  axios.post( selectedSite[0].user_url, {
	 	email: newUser.mail,
	    newPassword: newUser.pass1,
	    firstName: newUser.firstName,
	    lastName: newUser.lastName,
	    role: selectedSite[0].role,
	    username: selectedSite[0].admin.username,
	    password: selectedSite[0].admin.password
	  }).then((userResp) => {
		console.log({ user: userResp.data });

		if(JSON.stringify(userResp.data) === '{}'){
		  	// send off the user's group
		  	axios.post( selectedSite[0].group_url, {
			    username: selectedSite[0].admin.username,
			    password: selectedSite[0].admin.password,
			    group: selectedSite[0].group,
			    user: newUser.mail
			}).then((groupResp) => {
				console.log({ group: groupResp.data })
				return res.status(200).json({ success: true })
			}).catch((error) => {
				throw(error)
			})
		} else {
			throw(userResp.data.error);
		}
	  }).catch((error) => {
	    return res.status(422).json({ errors: error });
	  })
    }

});

app.listen(5000);