const mongoose    = require('mongoose');
const config      = require('../config/database'); // get db config file

// Use native Node promises
mongoose.Promise = global.Promise; 

// connect to database
mongoose.connect(config.dbUri); //, {useMongoClient: true}

var con = mongoose.connection;

con.on('error', function(err){
  console.log("Mongoose default connection has occured "+err+" error");
});

con.on('open', function () {
  console.log("Mongoose default connection is open on ", config.dbUri);
});

con.on('disconnected', function(){
  console.log("Mongoose default connection is disconnected");
});

process.on('SIGINT', function(){ // beforeExit
    mongoose.connection.close(function(){
      console.log("Mongoose default connection is disconnected due to application termination");
       process.exit(0);
      });
  });
  

module.exports = con;

/*
The require(‘mongoose’) call above returns a Singleton object. 
It means that the first time you call require(‘mongoose’), it is creating 
an instance of the Mongoose class and returning it. On subsequent calls, 
it will return the same instance that was created and returned to you the 
first time because of how module import/export works in ES6.
*/


// const server = '127.0.0.1:27017'; // REPLACE WITH YOUR DB SERVER
// const database = 'fcc-Mail';      // REPLACE WITH YOUR DB NAME

/*
class Database 
{
    constructor() 
    {
        this._connect()
    }

    _connect() 
    {
        mongoose.connect( config.dbUri) //`mongodb://${server}/${database}`)
        .then(() => 
        {
            console.log('Database connection successful')
        })
        .catch( err => 
        {
            console.error('Database connection error')
        })
    }
}

module.exports = new Database()
*/
/*
Similarly, we have turned our Database class into a singleton by returning an 
instance of the class in the module.exports statement because we only need a 
single connection to the database.

ES6 makes it very easy for us to create a singleton (single instance) pattern 
because of how the module loader works by caching the response of a previously 
imported file.
*/