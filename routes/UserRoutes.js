const router = require('express').Router()
const bcrypt = require('bcryptjs')
const User = require('../models/UserModel')
router.post('/register', async (req, res) => {
  try {
    const { hovaten, email, password, role, phone } = req.body

    // Kiểm tra số điện thoại
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' })
    }
    const exitphone = await User.findOne({ phone })
    if (exitphone) {
      return res.status(400).json({ message: 'Số điện thoại đã được đăng kí' })
    }

    // Kiểm tra email đúng định dạng
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được đăng ký' })
    }

    // Kiểm tra mật khẩu mạnh
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/
    if (!password || !passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = new User({
      hovaten,
      email,
      password: hashedPassword,
      role,
      phone
    })
    await user.save()
    res.json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Đã xảy ra lỗi.' })
  }
})

router.post('/loginfull', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })

    if (!user) {
      res.json({ message: 'email không chính xác' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      res.json({ message: 'nhập sai mật khẩu' })
    }

    if (user.role === 'admin') {
      res.json({ role: 'admin', user: user })
    } else if (user.role === 'staff') {
      res.json({ role: 'staff', user: user })
    } else {
      res.json({ role: 'user', user: user })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Đã xảy ra lỗi.' })
  }
})
router.post('/themgplx/:iduser', async (req, res) => {
  try {
    const iduser = req.params.iduser
    const { sogiayphep, ngaysinh } = req.body
    const user = await User.findById(iduser)
    user.sogiayphep = sogiayphep
    user.ngaysinh = ngaysinh
    await user.save()
    res.json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Đã xảy ra lỗi.' })
  }
})


module.exports = router
