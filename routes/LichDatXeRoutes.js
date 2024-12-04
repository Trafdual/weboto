const router = require('express').Router()
const HoaDon = require('../models/HoaDonModel')
const XeChoThue = require('../models/XeChoThueModel')
const User = require('../models/UserModel')
const moment = require('moment')
const LuuTru = require('../models/LuuTruModels')

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

    if (order.lichdat) {
      const datlich = await LichDat.findById(order.lichdat)
      datlich.trangthai = 'đã thanh toán'
      const hoadon = new HoaDon({
        nguoidat: order.nguoidatId,
        lichdat: datlich._id,
        noidung:
          `thanh toán thuê xe biển số ${xechothue.bienso}: ` + datlich._id
      })
      chuxe.tien += order.amount
      nguoiDat.hoadon.push(hoadon._id)
      await nguoiDat.save()
      await chuxe.save()
      await datlich.save()
      await hoadon.save()
    } else {
      if (order.trangthai === 'đặt cọc') {
        const lichdat = new LichDat({
          ngaynhan: ngaynhanDate,
          ngaytra: ngaytraDate,
          nguoidat: order.nguoidatId,
          xe: order.idxe,
          trangthai: 'đã cọc',
          tiencoc: order.amount
        })

        const hoadon = new HoaDon({
          nguoidat: order.nguoidatId,
          lichdat: lichdat._id,
          noidung:
            `Đặt cọc thuê xe biển số ${xechothue.bienso}: ` + lichdat._id,
          tongtien: order.amount
        })
        chuxe.tien += order.amount

        nguoiDat.lichdatxe.push(lichdat._id)
        nguoiDat.hoadon.push(hoadon._id)
        await nguoiDat.save()
        await chuxe.save()
        await lichdat.save()
        await hoadon.save()
      } else {
        const lichdat = new LichDat({
          ngaynhan: ngaynhanDate,
          ngaytra: ngaytraDate,
          nguoidat: order.nguoidatId,
          xe: order.idxe,
          trangthai: 'đã thanh toán',
          tiencoc: order.amount
        })

        const hoadon = new HoaDon({
          nguoidat: order.nguoidatId,
          lichdat: lichdat._id,
          noidung:
            `thanh toán thuê xe biển số ${xechothue.bienso}: ` + lichdat._id,
          tongtien: order.amount
        })
        chuxe.tien += order.amount

        nguoiDat.lichdatxe.push(lichdat._id)
        nguoiDat.hoadon.push(hoadon._id)
        await nguoiDat.save()
        await chuxe.save()
        await lichdat.save()
        await hoadon.save()
      }
    }
    await LuuTru.deleteOne({ orderId: orderId })

    res.json({ message: 'thanh toán thành công' })
  } else {
    await LuuTru.deleteOne({ orderId: orderId })
    res.json({ message: 'thanh toán thất bại' })
  }
})

module.exports = router
