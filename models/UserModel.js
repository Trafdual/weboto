const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  hovaten: { type: String },
  phone: { type: String },
  email: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user', 'staff'], default: 'user' },
  hoadon: [{ type: mongoose.Schema.Types.ObjectId, ref: 'hoadon' }],
  xechothue: [{ type: mongoose.Schema.Types.ObjectId, ref: 'xe' }],
  sogiayphep: { type: String },
  date: { type: String },
  xacthucgiayphep:{type: String },
  lichdatxe:[{type:mongoose.Schema.Types.ObjectId, ref: 'lichdatxe'}]
})

const User = mongoose.model('user', userSchema)
module.exports = User
