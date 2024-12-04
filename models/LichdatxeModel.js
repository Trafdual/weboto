const mongoose = require('mongoose')

const lichdatxeSchema = new mongoose.Schema({
  ngaynhan: { type: Date },
  ngaytra: { type: Date },
  nguoidat: { type: mongoose.Types.ObjectId, ref: 'user' },
  xe: { type: mongoose.Types.ObjectId, ref: 'xe' },
  trangthai: { type: String },
  tiencoc: { type: Number }
})

const Lichdatxe = mongoose.model('lichdatxe', lichdatxeSchema)
module.exports = Lichdatxe
