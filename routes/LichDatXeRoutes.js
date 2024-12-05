const router = require('express').Router()
const HoaDon = require('../models/HoaDonModel')
const XeChoThue = require('../models/XeChoThueModel')
const User = require('../models/UserModel')
const moment = require('moment')
const LuuTru = require('../models/LuuTruModels')
const transporter = require('./transporter')

const LichDat = require('../models/LichdatxeModel')
function sortObject (obj) {
  let sorted = {}
  let str = []
  let key
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key))
    }
  }
  str.sort()
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+')
  }
  return sorted
}

router.post('/create_payment_url', async (req, res, next) => {
  process.env.TZ = 'Asia/Ho_Chi_Minh'

  let date = new Date()
  let createDate = moment(date).format('YYYYMMDDHHmmss')

  let ipAddr =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress

  let config = require('config')

  let tmnCode = config.get('vnp_TmnCode')
  let secretKey = config.get('vnp_HashSecret')
  let vnpUrl = config.get('vnp_Url')
  let returnUrl = config.get('vnp_ReturnUrl')
  let orderId = moment(date).format('DDHHmmss')
  let amount = req.body.amount
  let bankCode = req.body.bankCode

  let locale = req.body.language
  let idxe = req.body.idxe

  let nguoidat = req.body.nguoidat

  let ngaynhan = req.body.ngaynhan

  let ngaytra = req.body.ngaytra
  let lichdat = req.body.lichdat
  let trangthai = req.body.trangthai
  const xechothue = await XeChoThue.findById(idxe)
  if (locale === null || locale === '') {
    locale = 'vn'
  }
  let currCode = 'VND'
  let vnp_Params = {}
  vnp_Params['vnp_Version'] = '2.1.0'
  vnp_Params['vnp_Command'] = 'pay'
  vnp_Params['vnp_TmnCode'] = tmnCode
  vnp_Params['vnp_Locale'] = locale
  vnp_Params['vnp_CurrCode'] = currCode
  vnp_Params['vnp_TxnRef'] = orderId
  vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId
  vnp_Params['vnp_OrderType'] = 'other'
  vnp_Params['vnp_Amount'] = amount * 100
  vnp_Params['vnp_ReturnUrl'] = returnUrl
  vnp_Params['vnp_IpAddr'] = ipAddr
  vnp_Params['vnp_CreateDate'] = createDate
  if (bankCode !== null && bankCode !== '') {
    vnp_Params['vnp_BankCode'] = bankCode
  }
  let ngaynhan1 = new Date(ngaynhan)
  let ngaytra1 = new Date(ngaytra)
  let soNgayThue = (ngaytra1 - ngaynhan1) / (1000 * 60 * 60 * 24)

  let order = new LuuTru({
    orderId: orderId,
    nguoidatId: nguoidat,
    idxe: idxe,
    ngaynhan: ngaynhan,
    ngaytra: ngaytra,
    lichdat: lichdat,
    amount: amount,
    trangthai: trangthai
  })
  order.tiencoc = xechothue.giachothue * soNgayThue - order.amount
  await order.save()

  vnp_Params = sortObject(vnp_Params)

  let querystring = require('qs')
  let signData = querystring.stringify(vnp_Params, { encode: false })
  let crypto = require('crypto')
  let hmac = crypto.createHmac('sha512', secretKey)
  let signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex')
  vnp_Params['vnp_SecureHash'] = signed
  vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false })

  res.json(vnpUrl)
})

router.get('/vnpay_return', async (req, res) => {
  let vnp_Params = req.query

  let secureHash = vnp_Params['vnp_SecureHash']
  let orderId = vnp_Params['vnp_TxnRef']
  let order = await LuuTru.findOne({ orderId: orderId })

  delete vnp_Params['vnp_SecureHash']
  delete vnp_Params['vnp_SecureHashType']
  vnp_Params = sortObject(vnp_Params)

  let config = require('config')
  let secretKey = config.get('vnp_HashSecret')

  let querystring = require('qs')
  let signData = querystring.stringify(vnp_Params, { encode: false })
  let crypto = require('crypto')
  let hmac = crypto.createHmac('sha512', secretKey)
  let signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex')

  if (secureHash === signed) {
    const xechothue = await XeChoThue.findById(order.idxe)
    const chuxe = await User.findById(xechothue.chuxe)
    const ngaynhanDate = moment(order.ngaynhan, 'YYYYMMDD').toDate()
    const ngaytraDate = moment(order.ngaytra, 'YYYYMMDD').toDate()
    const nguoiDat = await User.findById(order.nguoidatId)
    if (!chuxe.tien) {
      chuxe.tien = 0 // Khởi tạo nếu chưa có
    }
    if (vnp_Params['vnp_ResponseCode'] === '00') {
      const lichdat = new LichDat({
        ngaynhan: ngaynhanDate,
        ngaytra: ngaytraDate,
        nguoidat: order.nguoidatId,
        xe: order.idxe,
        trangthai: 'đã thanh toán',
        tiencoc: order.tiencoc
      })

      const hoadon = new HoaDon({
        nguoidat: order.nguoidatId,
        lichdat: lichdat._id,
        noidung:
          `Thanh toán thuê xe biển số ${xechothue.bienso}: ` + lichdat._id,
        tongtien: order.amount
      })
      const fulltien = order.amount + order.tiencoc
      chuxe.tien += fulltien

      nguoiDat.lichdatxe.push(lichdat._id)
      nguoiDat.hoadon.push(hoadon._id)
      await nguoiDat.save()
      await chuxe.save()
      await lichdat.save()
      await hoadon.save()
      await LuuTru.deleteOne({ orderId: orderId })

      const mailOptions = {
        from: nguoiDat.email,
        to: nguoiDat.email, // Email của người đặt
        subject: 'Xác nhận thanh toán hóa đơn thuê xe',
        html: `
          <h1>Hóa đơn thuê xe</h1>
          <p>Xin chào, ${nguoiDat.hovaten},</p>
          <p>Chúng tôi đã nhận được thanh toán cho dịch vụ thuê xe của bạn.</p>
          <h3>Thông tin hóa đơn:</h3>
          <ul>
            <li>Biển số xe: ${xechothue.bienso}</li>
            <li>Ngày nhận xe: ${moment(ngaynhanDate).format('DD/MM/YYYY')}</li>
            <li>Ngày trả xe: ${moment(ngaytraDate).format('DD/MM/YYYY')}</li>
            <li>Giá cho thuê: ${xechothue.giachothue.toLocaleString()} VND/ngày</li>
            <li>Tiền cọc: ${order.tiencoc.toLocaleString()} VND</li>
            <li>Tổng tiền: ${fulltien.toLocaleString()} VND</li>
          </ul>
          <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
        `
      }
      await transporter.sendMail(mailOptions)

      res.redirect('http://localhost:3000/user')
    }
  } else {
    res.redirect('http://localhost:3000/user')
  }
})

router.get('/getlichdadat/:userId', async (req, res) => {
  try {
    const userID = req.params.userId
    const user = await User.findById(userID)
    const lichdat = await Promise.all(
      user.lichdatxe.map(async lich => {
        const ld = await LichDat.findById(lich._id)
        const xe = await XeChoThue.findById(ld.xe)
        const chuxe = await User.findById(xe.chuxe)
        const ngaynhan = new Date(ld.ngaynhan)
        const ngaytra = new Date(ld.ngaytra)
        const soNgayThue = (ngaytra - ngaynhan) / (1000 * 60 * 60 * 24)
        const chuathanhtoan = xe.giachothue * soNgayThue - ld.tiencoc

        return {
          _id: ld._id,
          ngaynhan: moment(ld.ngaynhan).format('YYYY-MM-DD'),
          ngaytra: moment(ld.ngaynhan).format('YYYY-MM-DD'),
          bienso: xe.bienso,
          chuxe: chuxe.hovaten,
          tiencoc: ld.tiencoc,
          tongtien: xe.giachothue * soNgayThue,
          phaitra: chuathanhtoan,
          trangthai: ld.trangthai
        }
      })
    )
    res.json(lichdat)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Đã xảy ra lỗi.' })
  }
})

module.exports = router
