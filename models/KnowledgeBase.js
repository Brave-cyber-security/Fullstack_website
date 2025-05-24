import mongoose from 'mongoose';

const knowledgeBaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  deviceTypes: [{
    type: String,
    enum: ['desktop', 'laptop', 'tablet', 'smartphone', 'printer', 'server', 'network', 'other']
  }],
  category: {
    type: String,
    required: true,
    enum: ['hardware', 'software', 'network', 'security', 'maintenance', 'troubleshooting', 'other']
  },
  tags: [{
    type: String,
    trim: true
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  viewCount: {
    type: Number,
    default: 0
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  notHelpfulCount: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Add text index for search functionality
knowledgeBaseSchema.index({ 
  title: 'text', 
  content: 'text', 
  tags: 'text' 
});

const KnowledgeBase = mongoose.model('KnowledgeBase', knowledgeBaseSchema);

export default KnowledgeBase;
