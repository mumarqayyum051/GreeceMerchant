var express = require("express");
var app = express();
var cors = require("cors");
require("dotenv").config();
var passport = require("passport");
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
const httpResponse = require("express-http-response");
const port = process.env.PORT || 4000;
// Mongo

var mongoose = require("mongoose");
var url = "mongodb://localhost/GreeceMerchant";

//TODO The link of database should come from config

// @ts-ignore
mongoose.connect(url, { useNewUrlParser: true });
const con = mongoose.connection;

con.on("open", () => {
  console.log(":::::::::DB Connected:::::::");
});

app.use(passport.initialize());
app.use(httpResponse.Middleware);
app.use("/", require("./routes"));

app.listen(port, () => {
  console.log(`${process.env.SERVER_STARTED_TEXT}${port}`);
});
