const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/User.js");
module.exports = function (passport) {
  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },

      (email, password, done) => {
        console.log(email, password);
        User.findOne({ email: email }, async function (err, user) {
          if (err) {
            return done(err);
          }
          if (!user) {
            return done(null, false, {
              message: "No User found against this email address",
            });
          } else if (!user.isEmailVerified) {
            return done(null, false, {
              message: "User needs to verify the OTP",
            });
          }
          var result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Incorrect Password" });
          }
        });
      },
    ),
  );
};
