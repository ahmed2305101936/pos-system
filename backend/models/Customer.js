import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: String,
  phone: String,
  address: String,
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  totalPurchases: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('Customer', customerSchema);