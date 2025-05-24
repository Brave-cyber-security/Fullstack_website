import mongoose from 'mongoose';

const sparePartSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['cpu', 'memory', 'storage', 'motherboard', 'power', 'display', 'peripheral', 'network', 'other']
  },
  compatibleDevices: [{
    type: String,
    enum: ['desktop', 'laptop', 'tablet', 'smartphone', 'printer', 'server', 'network', 'other']
  }],
  stockQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  supplier: {
    name: String,
    contactInfo: String
  },
  location: {
    type: String,
    trim: true
  },
  minimumStockLevel: {
    type: Number,
    default: 5
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Virtual for checking if part is low in stock
sparePartSchema.virtual('isLowStock').get(function() {
  return this.stockQuantity <= this.minimumStockLevel;
});

const SparePart = mongoose.model('SparePart', sparePartSchema);

export default SparePart;
