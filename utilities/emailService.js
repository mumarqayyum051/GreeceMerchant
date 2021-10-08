const nodemailer = require("nodemailer");
const express = require("express");
const router = express.Router();

const transporter = nodemailer.createTransport({
  // @ts-ignore
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  service: "gmail", //TODO use Email template
  auth: {
    user: "zyansheikhofficial@gmail.com",
    pass: "umarahmadR.", //TODO bring user and password from config file
  },
});

const sendEmailOTPVerificationCode = function (user) {
  console.log("Email::", user.email, "::OTP::", user.OTP);
  transporter.sendMail(
    {
      from: "zyansheikh@gmail.com",
      to: user.email,
      subject: "OTP",
      text: `The is your OTP ${user.OTP}`,
    },
    (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log(info);
      }
    },
  );
};

const ResendEmailVerificationOTPCode = function (user) {
  console.log("Email::", user.email, "::OTP::", user.OTP);
  transporter.sendMail(
    {
      from: "zyansheikh@gmail.com",
      to: user.email,
      subject: "OTP",
      text: `New OTP ${user.OTP}`,
    },
    (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log(info);
      }
    },
  );
};
module.exports = {
  sendEmailOTPVerificationCode,
  ResendEmailVerificationOTPCode,
};
