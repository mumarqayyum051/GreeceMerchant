const JWT = require("jsonwebtoken");
let mongoose = require("mongoose");
const User = require("../models/User");
const {
  ForbiddenResponse,
  BadRequestResponse,
} = require("express-http-response");

function getTokenFromHeader(req) {
  if (
    (req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Token") ||
    (req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer")
  ) {
    return req.headers.authorization.split(" ")[1];
  }

  return null;
}
const user = (req, res, next) => {
  User.findById(req.payload.id)
    .then(function (user) {
      if (!user) {
        console.log("NO");
        next(new ForbiddenResponse());
      }

      req.user = user;
      next();
    })
    .catch((e) => {
      next(new ForbiddenResponse());
    });
};

const isToken = function (req, res, next) {
  if (
    (req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Token") ||
    (req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer")
  ) {
    var token = req.headers.authorization.split(" ");
    if (typeof token[1] === "undefined" || typeof token[1] === null) {
      res.status(400).send("You are not logged in");
    } else {
      JWT.verify(token[1], "secret", (err, data) => {
        if (err) {
          next(
            new BadRequestResponse(
              "You are not authorized to access this",
              401,
            ),
          );
        } else {
          req.user = data.user;
          next();
        }
      });
    }
  } else {
    next(new BadRequestResponse("Authentication Error", 401));
  }
};

module.exports = isToken;
