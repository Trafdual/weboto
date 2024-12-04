const router = require('express').Router()
const XeChoThue = require('../models/XeChoThueModel')
const User = require('../models/UserModel')
const upload = require('./upload')
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'trafdual0810@gmail.com',
    pass: 'plfu ulbm xnwj obha'
  }
})

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

    const xechothuejson = xechothue
      .map(xe => {
        if (xe.duyet === true) {
          return {
            _id: xe._id,
            mauxe: xe.mauxe,
            namsanxuat: xe.namsanxuat,
            truyendong: xe.truyendong,
            loaixe: xe.loaixe,
            giachothue: xe.giachothue,
            diachixe: xe.diachixe,
            giaotannoi: xe.giaotannoi,
            image: xe.image[0] || '',
            chuxe: xe.chuxe,
          }
        }
        return null
      })
      .filter(xe => xe !== null)

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
      xechothue.image = image
      xechothue.loaixe = 'xe tự lái'
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

      const mailOptions = {
        from: 'trafdual0810@gmail.com',
        to: 'totnghiepduan2023@gmail.com',
        subject: 'Xác nhận đăng ký xe tự lái',
        html: `
          <h3>Thông tin đăng ký xe tự lái của bạn:</h3>
          <p>Biển số: ${bienso}</p>
          <p>Hãng xe: ${hangxe}</p>
          <p>Mẫu xe: ${mauxe}</p>
          <p>Số ghế: ${soghe}</p>
          <p>Năm sản xuất: ${namsanxuat}</p>
          <p>Giá cho thuê: ${giachothue} VND</p>
          <p>Địa chỉ xe: ${diachixe}</p>
          <p><strong>Cảm ơn bạn đã đăng ký!</strong></p>
          ;<p>
  <strong>Đơn đăng ký của bạn đang được xem xét, chúng tôi sẽ phản hổi lại sớm nhât!</strong>
</p>
        `
      }

      await transporter.sendMail(mailOptions)

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
      quangduonggiaoxe: xechothue.quangduonggiaoxe || 0,
      phigiaoxe: xechothue.phigiaoxe || 0,
      mienphigxkm: xechothue.mienphigxkm || 0,
      gioihan: xechothue.gioihan,
      sokmtrongngay: xechothue.sokmtrongngay || 0,
      phivuotgh: xechothue.phivuotgh || 0,
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

router.get('/getduyetxe', async (req, res) => {
  try {
    const xechothue = await XeChoThue.find({ duyet: false }).lean()
    const xechothuejson = await Promise.all(
      xechothue.map(async xe => {
        const user = await User.findById(xe.chuxe)
        return {
          _id: xe._id,
          bienso: xe.bienso,
          hangxe: xe.hangxe,
          mauxe: xe.mauxe,
          soghe: xe.soghe,
          loaixe: xe.loaixe,
          namsanxuat: xe.namsanxuat,
          truyendong: xe.truyendong,
          mota: xe.mota,
          giachothue: xe.giachothue,
          diachixe: xe.diachixe,
          dieukhoan: xe.dieukhoan,
          image: xe.image[0],
          chuxe: {
            hovaten: user.hovaten,
            phone: user.phone,
            email: user.email,
            giaypheplaixe: user.giaypheplaixe || 'không có'
          }
        }
      })
    )
    res.json(xechothuejson)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Đã xảy ra lỗi.' })
  }
})
router.post('/duyetxedangky/:idxechothue', async (req, res) => {
  try {
    const idxechothue = req.params.idxechothue
    const xechothue = await XeChoThue.findById(idxechothue)
    xechothue.duyet = true
    const mailOptions = {
      from: 'trafdual0810@gmail.com',
      to: 'totnghiepduan2023@gmail.com',
      subject: 'Xác nhận đăng ký xe tự lái',
      html: `
          <h3>Thông tin đăng ký xe tự lái của bạn:</h3>
          <p>Biển số: ${xechothue.bienso}</p>
          <p>Hãng xe: ${xechothue.hangxe}</p>
          <p>Mẫu xe: ${xechothue.mauxe}</p>
          <p>Số ghế: ${xechothue.soghe}</p>
          <p>Năm sản xuất: ${xechothue.namsanxuat}</p>
          <p>Giá cho thuê: ${xechothue.giachothue} VND</p>
          <p>Địa chỉ xe: ${xechothue.diachixe}</p>
          <p><strong>Cảm ơn bạn đã đăng ký!</strong></p>
          ;<p>
  <strong>Đơn đăng ký của bạn đã được duyệt!</strong>
</p>
        `
    }

    await transporter.sendMail(mailOptions)
    await xechothue.save()

    res.json({ message: 'duyệt xe thành công' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Đã xảy ra lỗi.' })
  }
})

router.get('/getxedadangky/:userid', async (req, res) => {
  try {
    const iduser = req.params.userid
    const user = await User.findById(iduser)
    const xechothue = await Promise.all(
      user.xechothue.map(async xe => {
        const xedetail = await XeChoThue.findById(xe._id)
        return {
          _id: xedetail._id,
          bienso: xedetail.bienso,
          hangxe: xedetail.hangxe,
          mauxe: xedetail.mauxe,
          soghe: xedetail.soghe,
          loaixe: xedetail.loaixe,
          truyendong: xedetail.truyendong,
          giachothue: xedetail.giachothue,
          duyet: xedetail.duyet
        }
      })
    )
    res.json(xechothue)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Đã xảy ra lỗi.' })
  }
})

module.exports = router
