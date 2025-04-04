import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  username: String,
  firstName: String,
  lastName: String,
}, { timestamps: true })

export default mongoose.model('User', userSchema);