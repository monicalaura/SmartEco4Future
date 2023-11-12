const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: 'This field is required.',
    unique: true
  },
  content: {
    type: String,
    required: 'This field is required.'
  },
  category: {
    type: String, 
    required: 'This field is required.'
  },
  image: {
    type: String,
   
  },
});

postSchema.index({ title: 'text', content: 'text', category: 'text' });


module.exports = mongoose.model('Post', postSchema);