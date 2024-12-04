const router = require('express').Router()
const XeChoThue = require('../models/XeChoThueModel')
const User = require('../models/UserModel')
const upload = require('./upload')

router.get('/getxechothue/:loaixe', async (req, res) => {
  try {
    const loaixe = req.params.loaixe
    const xechothue = await XeChoThue.find({ loaixe: loaixe }).lean()
    const xechothuejson = xechothue.map(xe => {
      return {
        _id: xe._id,
        mauxe: xe.mauxe,
        namsanxuat: xe.namsanxuat,
        truyendong: xe.truyendong,
        giachothue: xe.giachothue,
        diachixe: xe.diachixe,
        giaotannoi: xe.giaotannoi,
        image: xe.image[0] || ''
      }
    })
    res.json(xechothuejson)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Đã xảy ra lỗi.' })
  }
})
router.get('/getxechothue', async (req, res) => {
  try {
    const xechothue = await XeChoThue.find().lean()
    const xechothuejson = xechothue.map(xe => {
      return {
        _id: xe._id,
        mauxe: xe.mauxe,
        namsanxuat: xe.namsanxuat,
        truyendong: xe.truyendong,
        loaixe:xe.loaixe,
        giachothue: xe.giachothue,
        diachixe: xe.diachixe,
        giaotannoi: xe.giaotannoi,
        image: xe.image[0] || ''
      }
    })
    res.json(xechothuejson)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Đã xảy ra lỗi.' })
  }
})

router.post(
  '/dangkyxetulai/:userId',
  upload.fields([{ name: 'image', maxCount: 100 }]),
  async (req, res) => {
    try {
      const userId = req.params.userId
      const domain = 'http://localhost:8080'
      const image = req.files['image']
        ? req.files['image'].map(file => `${domain}/${file.filename}`)
        : []

      const user = await User.findById(userId)
      const {
        bienso,
        hangxe,
        mauxe,
        soghe,
        loaixe,
        namsanxuat,
        truyendong,
        loainhienlieu,
        muctieuthunl,
        mota,
        tinhnang,
        giachothue,
        giamgia,
        diachixe,
        giaotannoi,
        quangduonggiaoxe,
        phigiaoxe,
        mienphigxkm,
        gioihan,
        sokmtrongngay,
        phivuotgh,
        dieukhoan
      } = req.body
      const xechothue = new XeChoThue({
        bienso,
        hangxe,
        mauxe,
        soghe,
        loaixe,
        namsanxuat,
        truyendong,
        loainhienlieu,
        muctieuthunl,
        mota,
        giachothue,
        giamgia,
        diachixe,
        giaotannoi,
        gioihan,
        dieukhoan,
        tinhnang
      })
      xechothue.image.push(image)
      if (giaotannoi === true) {
        xechothue.quangduonggiaoxe = quangduonggiaoxe
        xechothue.phigiaoxe = phigiaoxe
        xechothue.mienphigxkm = mienphigxkm
      }
      if (gioihan === true) {
        xechothue.sokmtrongngay = sokmtrongngay
        xechothue.phivuotgh = phivuotgh
      }
      xechothue.chuxe = user._id
      user.xechothue = xechothue._id
      await xechothue.save()
      await user.save()
      res.json({ message: 'đăng ký xe tự lái thành công' })
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: 'Đã xảy ra lỗi.' })
    }
  }
)

router.post(
  '/postxe/:userId',
  upload.fields([{ name: 'image', maxCount: 100 }]),
  async (req, res) => {
    try {
      const userId = req.params.userId
      const domain = 'http://localhost:8080'
      const image = req.files['image']
        ? req.files['image'].map(file => `${domain}/${file.filename}`)
        : []

      const user = await User.findById(userId)
      const {
        bienso,
        hangxe,
        mauxe,
        soghe,
        loaixe,
        namsanxuat,
        truyendong,
        loainhienlieu,
        muctieuthunl,
        mota,
        tinhnang,
        giachothue,
        giamgia,
        diachixe,
        giaotannoi,
        quangduonggiaoxe,
        phigiaoxe,
        mienphigxkm,
        gioihan,
        sokmtrongngay,
        phivuotgh,
        dieukhoan
      } = req.body
      const xechothue = new XeChoThue({
        bienso,
        hangxe,
        mauxe,
        soghe,
        loaixe,
        namsanxuat,
        truyendong,
        loainhienlieu,
        muctieuthunl,
        mota,
        giachothue,
        giamgia,
        diachixe,
        giaotannoi,
        gioihan,
        dieukhoan,
        tinhnang,
        duyet: true
      })
      xechothue.image = image
      if (giaotannoi === true) {
        xechothue.quangduonggiaoxe = quangduonggiaoxe
        xechothue.phigiaoxe = phigiaoxe
        xechothue.mienphigxkm = mienphigxkm
      }
      if (gioihan === true) {
        xechothue.sokmtrongngay = sokmtrongngay
        xechothue.phivuotgh = phivuotgh
      }
      xechothue.chuxe = user._id
      user.xechothue = xechothue._id
      await xechothue.save()
      await user.save()
      res.json({ message: 'thêm xe thành công' })
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: 'Đã xảy ra lỗi.' })
    }
  }
)

router.get('/getchitietxechothue/:idxechothue', async (req, res) => {
  try {
    const idxechothue = req.params.idxechothue
    const xechothue = await XeChoThue.findById(idxechothue)
    const user = await User.findById(xechothue.chuxe)
    const xechothuejson = {
      bienso: xechothue.bienso,
      hangxe: xechothue.hangxe,
      mauxe: xechothue.mauxe,
      soghe: xechothue.soghe,
      loaixe: xechothue.loaixe,
      namsanxuat: xechothue.namsanxuat,
      truyendong: xechothue.truyendong,
      loainhienlieu: xechothue.loainhienlieu,
      muctieuthunl: xechothue.muctieuthunl,
      mota: xechothue.mota,
      tinhnang: xechothue.tinhnang,
      giachothue: xechothue.giachothue,
      giamgia: xechothue.giamgia,
      diachixe: xechothue.diachixe,
      giaotannoi: xechothue.giaotannoi,
      quangduonggiaoxe: xechothue.quangduonggiaoxe,
      phigiaoxe: xechothue.phigiaoxe,
      mienphigxkm: xechothue.mienphigxkm,
      gioihan: xechothue.gioihan,
      sokmtrongngay: xechothue.sokmtrongngay,
      phivuotgh: xechothue.phivuotgh,
      dieukhoan: xechothue.dieukhoan,
      image: xechothue.image,
      chuxe: {
        hovaten: user.hovaten,
        phone: user.phone,
        email: user.email
      }
    }
    res.json(xechothuejson)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Đã xảy ra lỗi.' })
  }
})
module.exports = router
