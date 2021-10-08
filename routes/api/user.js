var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var path = require("path");
var filePath = path.join(process.cwd(), "public", "images");
var bcrypt = require("bcrypt");
const {
  BadRequestResponse,
  OkResponse,
  ForbiddenResponse,
  UnauthorizedResponse,
} = require("express-http-response");

const httpResponse = require("express-http-response");
const passport = require("passport");
require("../../middlewares/passport")(passport);
const InternalServerErrorResponse = require("express-http-response/lib/http/InternalServerErrorResponse");
const {
  validateName,
  validateEmail,
  validatePassword,
  validator,
  isEmailAlreadyExit,
} = require("../../validations");
const {
  sendEmailOTPVerificationCode,
  ResendEmailVerificationOTPCode,
} = require("../../utilities/emailService");
const User = require("../../models/User");
const auth = require("../auth");
const isToken = require("../auth");

//TODO getAll
router.get("/get", isToken, (req, res, next) => {
  const options = {
    page: +req.query.page || 1,
    limit: +req.query.limit || 10,
  };
  const query = {};
  User.paginate(query, options, function (err, user) {
    console.log(err, user);
    if (err) {
      next(new BadRequestResponse(err));
    }
    next(new OkResponse({ result: user }));
  });
});

router.post(
  "/register",
  validateName,
  validateEmail,
  validatePassword,

  validator,
  isEmailAlreadyExit,
  function (req, res, next) {
    console.log("::::Body::::::", req.payload);
    const user = new User();
    user.name = req.body.name;
    user.email = req.body.email;
    user.password = req.body.password;
    user.setOTP();
    user
      .save()
      .then(function (user) {
        next(new OkResponse({ user: user.toAuthJSON() }));
        sendEmailOTPVerificationCode({ email: user.email, OTP: user.OTP });
      })
      .catch((err) => {
        console.log(err);
      });
  },
);

router.post("/verifyOTP", validateEmail, (req, res, next) => {
  const query = {
    email: req.body.email,
  };

  User.findOne(query, function (err, user) {
    if (user.OTP !== req.body.OTP) {
      next(new UnauthorizedResponse("OTP Invalid or Expired", 401));
    }
    console.log("::user", user);
    user.OTP = null;
    user.isEmailVerified = true;
    if (req.body.type == 1) {
      user.generateResetPasswordToken();
    }
    user.save().then(function (user) {
      if (req.body.type == 1) {
        next(new OkResponse({ passwordResetToken: user.passwordResetToken }));
      } else {
        next(new OkResponse("User Verified", 200));
      }
    });
  });
});
router.post("/verifyOTP", validateEmail, (req, res, next) => {
  const email = {
    email: req.body.email,
  };

  User.findOne(email, function (err, user) {
    if (!user || err) {
      next(new UnauthorizedResponse("User does not exist", 401));
    }

    if (user.OTP == req.body.OTP) {
      user.isEmailVerified = true;
      next(new OkResponse({ user: user.toAuthJSON() }));
      if (req.body.type == 1) {
        user.generateResetPasswordToken();
      }
    }

    user.save().then(function (user) {
      if (req.body.type == 1) {
        next(new OkResponse({ passwordResetToken: user.passwordResetToken }));
      } else {
        next(new OkResponse("User Verified", 200));
      }
    });
  });
});
router.post(
  "/login",
  validateEmail,
  validatePassword,
  validator,
  (req, res, next) => {
    passport.authenticate(
      "local",
      { session: false },
      function (err, user, info) {
        console.log("::Err::", err, "::User::", user, "::Info::", info);
        if (err) {
          console.log(err);
          next(new BadRequestResponse(err));
        }

        if (!user) {
          next(new UnauthorizedResponse(info.message, 401));
        } else {
          next(new OkResponse({ user: user.toAuthJSON() }));
        }
      },
    )(req, res, next);
  },
);

router.get("/get/:email", validateEmail, (req, res, next) => {
  console.log(req.params.email);
  if (!req.params.email) {
    next(new BadRequestResponse("Invalid email address", 401));
  }
  const query = { email: req.params.email };
  console.log(query);

  User.findOne(query, (err, user) => {
    if (err || !user) {
      next(new BadRequestResponse("No user found against this email", 400));
    } else {
      next(new OkResponse({ user: user.toJSON() }));
    }
  });
});

router.put(
  "/update/:email",
  validateEmail,
  validator,
  isToken,
  function (req, res, next) {
    let user = req.body;
    if (!req.body.name || !req.body.password) {
      throw new BadRequestResponse("Missing required parameter.", 422.0);
    }
    console.log("here");
    User.findOne({ email: req.params.email }).then(function (user) {
      {
        if (user) {
          console.log(user);
          user.name = req.body.name;
          user.password = req.body.password; //TODO check old password then update password
          user
            .save()
            .then(function (user) {
              if (user) {
                next(new OkResponse({ user: user.toAuthJSON() }));
              }
            })
            .catch((err) => {
              next(new BadRequestResponse(err));
              console.log(err);
            });
        } else {
          console.log("hereerer");
          next(new BadRequestResponse("hereerer"));
        }
      }
    });
  },
);

router.post("/forgetPassword", (req, res, next) => {
  User.findOne({ email: req.body.email }, function (err, user) {
    console.log("err:::", err, "::User::", user);
    if (err || !user) {
      next(new BadRequestResponse("User not found"));
    } else {
      user.setOTP();
      user.save((err, user) => {
        ResendEmailVerificationOTPCode({ email: user.email, OTP: user.OTP });
      });
      next(new OkResponse(`An OTP has been sent to ${user.email}`));
    }
  }).catch((err) => {
    console.log(err);
  });
});

router.post("/resetPassword/:token", (req, res, next) => {
  const token = { passwordResetToken: req.params.token };

  if (req.body.password === null || req.body.password === undefined) {
    next(new BadRequestResponse("Missing Required Parameteres", 422));
  }
  User.findOne(token, function (err, user) {
    if (user) {
      user.password = req.body.password;
      user.passwordResetToken = null;
      user.save((err, user) => {
        if (user) {
          next(new OkResponse("Password Reset Succesfully", 200));
        } else {
          next(new BadRequestResponse({ err: err }));
        }
      });
    } else {
      next(new BadRequestResponse("Invalid password reset token", 401));
    }
  });
});

router.use(httpResponse.Middleware);
module.exports = router;
