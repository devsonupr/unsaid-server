import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  content: { 
  type: String, 
  required: true,
  get: function(content) {
    // Convert non-breaking spaces back to regular spaces when retrieving
    return content.replace(/\u00A0/g, ' ');
  },
  set: function(content) {
    // Convert regular spaces to non-breaking spaces when saving
    return content.replace(/ /g, '\u00A0');
  }
},
  image: String,
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Like'
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  commentsCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Update likes count when likes array changes
postSchema.pre('save', function(next) {
  this.likesCount = this.likes.length;
   this.commentsCount = this.comments.length;
  next();
});

export default mongoose.model('Post', postSchema);