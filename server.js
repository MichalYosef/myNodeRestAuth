const express     = require('express');
const app         = express();
const bodyParser  = require('body-parser');
const morgan      = require('morgan');
const mongoose    = require('mongoose');
const passport	  = require('passport');
const config      = require('./server/config/database'); // get db config file

const User        = require('./server/app/models/user'); // get the mongoose model
const port 	      = process.env.PORT || 8080;
const jwt 			  = require('jwt-simple');
const path      = require('path');
const dbCon = require( './server/dal/database' );
/* if an error occurs prevent crash and an error log is printed in the 
   console.
*/
process.on('uncaughtException', function(err) {
  console.log(err);
});

// log to console
app.use(morgan('dev'));

// Use the passport package in our application
app.use(passport.initialize());


// handle CORS

app.use(function (req, res, next) 
{
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') 
    {
      res.end();
    } 
    else 
    {
      next();
    }
});

// enable static files loading for the client
app.use('/client', express.static( path.join(__dirname, 'client')));
app.use("/css", express.static(__dirname + '/client/css'));
app.use("/img", express.static(__dirname + '/client/img'));
app.use("/js", express.static(__dirname + '/client/js'));
app.use("/templates", express.static(__dirname + '/client/templates'));

// get request parameters
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.sendFile( path.join( __dirname, './client/index.html'));
});


// DB Connect
/*
// Use native Node promises
mongoose.Promise = global.Promise; 

// connect to database
mongoose.connect(config.dbUri); //, {useMongoClient: true}

var con = mongoose.connection;

con.on('error', function(err){
  console.log("Mongoose default connection has occured "+err+" error");
});

con.once('open', function () {
  console.log("Mongoose default connection is open to ", config.dbUri);
});

con.on('disconnected', function(){
  console.log("Mongoose default connection is disconnected");
});

*/
// pass passport for configuration
require('./server/config/passport')(passport);

// TODO: take the router out of here 
// https://stackoverflow.com/questions/28305120/differences-between-express-router-and-app-get


// load the routes
// require('./server/routes')(app);


// bundle our routes
var apiRoutes = express.Router();

// create a new user account (POST http://localhost:8080/api/signup)
apiRoutes.post('/signup', function(req, res) {
  if (!req.body.name || !req.body.password) {
    res.json({success: false, msg: 'Please pass name and password.'});
  } else {
    var newUser = new User({
      name: req.body.name,
      password: req.body.password
    });
    // save the user
    console.log('create new user: ' + newUser);
    newUser.save(function(err) {
      if (err) {
        res.json({success: false, msg: 'Username already exists.'});
        throw err;
      }
      res.json({success: true, msg: 'Successful created new user.'});
    });
  }
});

// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/authenticate', function(req, res) {
  User.findOne({
    name: req.body.name
  }, function(err, user) {
    if (err) throw err;

    if (!user) {
      return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      // check if password matches
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          // if user is found and password is right create a token
          var token = jwt.encode(user, config.secret);
          // return the information including token as JSON
          res.json({success: true, token: 'JWT ' + token});
        } else {
          return res.status(403).send({success: false, msg: 'Authentication failed. Wrong password.'});
        }
      });
    }
  });
});

// route to a restricted info (GET http://localhost:8080/api/memberinfo)
apiRoutes.get('/memberinfo', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  console.log('the token: ' + token);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    User.findOne({
      name: decoded.name
    }, function(err, user) {
        if (err) throw err;

        if (!user) {
          return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
        } else {
          res.json({success: true, msg: 'Welcome in the member area ' + user.name + '!'});
        }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

// connect the api routes under /api/*
app.use('/api', apiRoutes);

// load the routes
// require('./routes')(app);


// Start the server

app.listen(port, function () {
  console.log(`Server is running on: http://localhost:${port}`);
})

