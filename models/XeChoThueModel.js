const mongoose = require('mongoose')

const xeSchema = new mongoose.Schema({
  bienso: { type: String },
  hangxe: { type: String },
  mauxe: { type: String },
  soghe: { type: String },
  loaixe: { type: String },
  namsanxuat: { type: String },
  truyendong: { type: String },
  loainhienlieu: { type: String },
  muctieuthunl: { type: String },
  mota: { type: String },
  tinhnang: [{ type: String }],
  giachothue: { type: Number },
  giamgia: { type: Number },
  diachixe: { type: String },
  giaotannoi: { type: Boolean, default: false },
  quangduonggiaoxe: { type: Number },
  phigiaoxe: { type: Number },
  mienphigxkm: { type: String },
  gioihan: { type: Boolean, default: false },
  sokmtrongngay: { type: Number },
  phivuotgh: { type: Number },
  dieukhoan: { type: String },
  image: [{ type: String }],
  duyet: { type: Boolean, default: false },
  chuxe: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  lichdat:[{type: mongoose.Schema.Types.ObjectId, ref: 'lichdatxe'}]
})

const Xe = mongoose.model('xe', xeSchema)
module.exports = Xe
