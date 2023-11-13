const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, { 
  useNewUrlParser: true, 
  dbName: 'Blog' });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'DB connection error:'));
db.once('open', function(){
  console.log('Connected to Mongo DB')
});

// Models
require('./Category');
require('./Post');