const orderSchema = {
  userId: String,
  modelFile: String,
  specifications: {
    material: String,
    quality: String,
    color: String,
    quantity: Number
  },
  pricing: {
    materialCost: Number,
    laborCost: Number,
    totalPrice: Number
  },
  status: String,
  createdAt: Date
}; 