const express = require("express");
const mongoose = require("mongoose");
var mongoosePaginition = require("mongoose-paginate-v2");
var crypto = require("crypto");
const bcrypt = require("bcrypt");
const faker = require("faker");
const JWT = require("jsonwebtoken");
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      requierd: true,
    },
    email: {
      type: String,
      requierd: true,
    },
    isEmailVerified: { type: Boolean, default: false },
    password: {
      type: String,
      requierd: true,
    },

    //TODO  save hash and salt in schema/databse not password...

    OTP: {
      type: String,
      default: null,
    },
    OTPExpiration: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      expireAfterSeconds: 30,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// @ts-ignore
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// userSchema.methods.hashPass = async function (password) {
//   await bcrypt.hash(password, 10, function () {});
// };

// userSchema.methods.comparePassword = function (password) {
//   console.log(password, this.hash);
//   bcrypt.compare(password, this.hash, function (result) {
//     if (result) {
//       return true;
//     } else {
//       return false;
//     }
//   });
// };
userSchema.methods.setOTP = function () {
  this.OTP = faker.datatype.number({ max: 9999, min: 999 });
  this.OTPExpiration = Date.now() + 3600000;
};

//TODO function name generateJWT()
userSchema.methods.generateToken = function () {
  const secret = "secret"; //TODO bring secret from config file
  return JWT.sign(
    {
      id: this._id,
      email: this.email,
    },
    secret,
  );
};

userSchema.methods.generateResetPasswordToken = function () {
  this.passwordResetToken = crypto.randomBytes(48).toString("hex");
};

userSchema.methods.toAuthJSON = function () {
  return {
    name: this.name,
    email: this.email,
    token: this.generateToken(),
  };
};

userSchema.methods.toJSON = function () {
  return {
    name: this.name,
    email: this.email,
  };
};

userSchema.plugin(mongoosePaginition);
module.exports = mongoose.model("Users", userSchema);
