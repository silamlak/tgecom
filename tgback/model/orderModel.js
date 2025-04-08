import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    phone: String,
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "accept", "reject", "shipped", "paid", "completed"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
