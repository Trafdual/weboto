const mongoose = require('mongoose')

const luutruSchema = new mongoose.Schema({
  orderId: { type: String },
  nguoidatId: { type: String },
  idxe: { type: String },
  ngaynhan: {
    type: String
  },
  ngaytra: {
    type: String
  },
  lichdat: {
    type: String
  },
  amount: {
    type: Number
  },
  tiencoc: {
    type: Number
  },
  trangthai: {
    type: String
  }
})

const LuuTru = mongoose.model('luutru', luutruSchema)
module.exports = LuuTru
