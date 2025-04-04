import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: String, // Optional: Store name for easier reference
  price: Number, // Optional: Store price at the time of purchase
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);
