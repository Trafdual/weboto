const mongoose = require('mongoose')

const hoadonSchema = new mongoose.Schema({
  date: { type: Date },
  nguoidat: { type: mongoose.Types.ObjectId, ref: 'user' },
  lichdat: { type: mongoose.Types.ObjectId, ref: 'lichdatxe' },
  noidung:{ type: String },
  tongtien:{type:Number}
})

const Hoadon = mongoose.model('hoadon', hoadonSchema)
module.exports = Hoadon
