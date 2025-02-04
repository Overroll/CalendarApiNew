const db = require('../utils/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { convertProvince, convertDistrict, convertSubDistrict } = require('../helpers/addressConverter');

async function loginByIdNumber(idnumber, password) {
  const user = await db.User.findOne({ idnumber });
  if (!user) return { status: 1, message: 'ไม่พบผู้ใข้งานนี้ในระบบ' };

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return { status: 2, message: 'เลขบัตรประชาชน หรือ รหัสผ่านผิดพลาด' };

  if (user.deletedBy) return { status: 3, message: 'ผู้ใช้งานถูกลบ' };

  const token = jwt.sign({ id: user.id, idnumber: user.idnumber, name: `${user.firstname} ${user.lastname}`, role: user.role }, process.env.JWT_SECRET);
  return { status: 0, token, message: 'เข้าสู่ระบบสำเร็จ' };
}

async function loginByEmail(email, password) {
  const user = await db.User.findOne({ email });
  if (!user) return { status: 1, message: 'ไม่พบผู้ใข้งานนี้ในระบบ' };

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return { status: 2, message: 'อีเมล์ หรือ รหัสผ่านผิดพลาด' };

  if (user.deletedBy) return { status: 3, message: 'ผู้ใช้งานถูกลบ' };

  if (user && user.role == 'user') return { status: 3, message: 'ไม่มีสิทธิ์เข้าใช้งาน' };

  const token = jwt.sign({ id: user.id, email: user.email, firstname: user.firstname, lastname: user.lastname, name: `${user.firstname} ${user.lastname}`, role: user.role }, process.env.JWT_SECRET);
  return { status: 0, token, message: 'เข้าสู่ระบบสำเร็จ' };
}

async function loginByEmailAdmin(email, password) {
  const user = await db.User.findOne({ email });
  if (!user) return { status: 1, message: 'ไม่พบผู้ใข้งานนี้ในระบบ' };

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return { status: 2, message: 'อีเมล์ หรือ รหัสผ่านผิดพลาด' };

  if (user && user.role !== 'admin') return { status: 3, message: 'ไม่มีสิทธิ์เข้าใช้งาน' };

  const token = jwt.sign({ id: user.id, email: user.email, name: `${user.firstname} ${user.lastname}`, role: user.role }, process.env.JWT_SECRET);
  return { status: 0, token, message: 'เข้าสู่ระบบสำเร็จ' };
}

async function createUser(params, creator) {
  // const email = 's4nthiti@gmail.com';
  // const idnumber = '1959900679521';
  // const password = await bcrypt.hash('admin123456', 10);
  // const firstname = 'administrator';
  // const lastname = 'account';
  // const birthdate = new Date('01/01/2000');
  // const address = '11/111';
  // const province = convertProvince(75);
  // const district = convertDistrict(977);
  // const subdistrict = convertSubDistrict(8713);
  // const role = 'Admin';
  // await db.User.create({ email, idnumber, password, firstname, lastname, birthdate, address, province, district, subdistrict, role});
  // return { status: 0, message: 'ลงทะเบียนเสร็จสิ้น' };

  const role = params.role || 'user';

  if (creator.role == 'researcher') {
    if (role == 'researcher' || role == 'admin')
      return { status: 2, message: 'ไม่สามารถลงทะเบียนได้' };
  }

  const email = params.email || null;
  const idnumber = params.idnumber || null;
  const password = await bcrypt.hash(params.password, 10);
  const firstname = params.firstname;
  const lastname = params.lastname;
  const birthdate = params.birthdate;
  const address = params.address || "";
  const province = params.province || 75;
  const district = params.district;
  const subdistrict = params.subdistrict;
  const zipcode = params.zipcode;

  if (role == 'admin' || role == 'researcher') {
    if (!email) return { status: 3, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' };
    const user = await db.User.findOne({ email });
    if (user) return { status: 1, message: 'อีเมล์ถูกใช้แล้ว' };
    const newUser = new db.User({ email, password, firstname, lastname, birthdate, address, province, district, subdistrict, zipcode, role, createdBy: creator.id });
    await newUser.save();
    return { status: 0, message: 'ลงทะเบียนเสร็จสิ้น' };
  }
  else {
    if (!idnumber) return { status: 3, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' };
    const user = await db.User.findOne({ idnumber });
    if (user) return { status: 1, message: 'หมายเลขบัตรประจำตัวประชาชนถูกใช้แล้ว' };
    const newUser = new db.User({ idnumber, password, firstname, lastname, birthdate, address, province, district, subdistrict, zipcode, role, createdBy: creator.id });
    await newUser.save();
    return { status: 0, message: 'ลงทะเบียนเสร็จสิ้น' };
  }
}

// async function forgotPassword(email) {
//   const user = await User.findOne({ email });
//   if (!user) throw new Error('User not found');

//   const token = randomstring.generate(20);
//   user.resetPasswordToken = token;
//   user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
//   await user.save();

//   const message = {
//     to: user.email,
//     subject: 'Password Reset',
//     text: `Please click on the following link, or paste it into your browser to reset your password: ${process.env.APP_BASE_URL}/reset-password/${token}`,
//   };

//   // Send email with the password reset link
//   // Example using SendGrid API:
//   // await sendgrid.send(message);

//   return { message: 'Password reset link sent to your email' };
// }

// async function resetPassword(token, password) {
//   const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
//   if (!user) throw new Error('Invalid token');

//   const hashedPassword = await bcrypt.hash(password, 10);
//   user.password = hashedPassword;
//   user.resetPasswordToken = undefined;
//   user.resetPasswordExpires = undefined;
//   await user.save();

//   return { message: 'Password reset successful' };
// }

module.exports = {
  loginByIdNumber,
  loginByEmail,
  loginByEmailAdmin,
  createUser
  //   forgotPassword,
  //   resetPassword,
};
