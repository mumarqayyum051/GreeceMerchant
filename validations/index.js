const { check, body, validationResult } = require("express-validator");
const {
  BadRequestResponse,
  OkResponse,
  InternalServerErrorResponse,
} = require("express-http-response");
const mongoose = require("mongoose");
const User = require("../models/User");
const validateName = [
  //Check if name not empty neither shorter than 3

  check("name")
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage("User name can not be empty!")
    .bail()
    .isLength({ min: 3 })
    .withMessage("Minimum 3 characters required!"),
];
//Check if email not empty neither invalid

const validateEmail = [
  check("email")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Email name can not be empty!")
    .bail()
    .isEmail()
    .withMessage("Invalid email address!")
    .bail(),
];
//Check if password not empty
const validatePassword = [
  check("password")
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage("Password Can't be empty!")
    .bail(),
];
//Check both password equal
const isPasswordSame = [
  check("confirmPassword")
    .trim()
    .custom(async (confirmPassword, { req }) => {
      console.log(confirmPassword);
      console.log(req.body.password);
      if (req.body.password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
    }),
];

const isEmailAlreadyExit = function (req, res, next) {
  console.log(req.body.email);
  try {
    User.findOne({ email: req.body.email }, function (err, user) {
      if (err) {
        next(new InternalServerErrorResponse());
      } else if (user) {
        next(new BadRequestResponse("Email Already Exist", 422));
      } else {
        next();
      }
    });
  } catch (err) {
    console.log(err);
  }
};

const validator = (req, res, next) => {
  const errors = validationResult(req);
  console.log(errors);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  } else if (Object.keys(req.body).length === 0) {
    next(new BadRequestResponse("Missing Required Parameteres"));
  } else {
    next();
  }
};

module.exports = {
  validateName,
  validateEmail,
  validatePassword,
  isPasswordSame,
  isEmailAlreadyExit,
  validator,
};
