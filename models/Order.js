import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'collected'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: String,
      enum: ['sender', 'collector'],
      default: 'sender',
    },
  },
  {
    timestamps: true,
  },
)

const Order = mongoose.model('Order', orderSchema)
export default Order
