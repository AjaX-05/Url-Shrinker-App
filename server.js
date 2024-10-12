require("dotenv").config();
const express = require("express");

const ejs = require("ejs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const SignUp = require("./model/signup.model");
const Shrinker = require("./model/shrinker.model");
const Auth = require("./model/authorize.model");

const mongoose = require("mongoose");

const app = express();
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.render("signup");
});

app.get("/login", (req, res) => {
  res.render("signin");
});

app.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const shortUrls = await Shrinker.find();
    // console.log(shortUrls);
    res.render("userhomepage", { shortUrls: shortUrls });
  } catch (error) {
    console.log(error.message);
  }
});

app.post("/bigUrl", async (req, res) => {
  try {
    const fullurl = req.body.input_url;
    const urlExists = await Shrinker.findOne({ fullUrl: fullurl });
    if (urlExists) {
      return res.redirect("/dashboard");
    }
    await Shrinker.create({ fullUrl: fullurl });
    return res.redirect("/dashboard");
  } catch (error) {
    console.log(error.message);
  }
});

app.get("/:shortUrl", async (req, res) => {
  const shortUrl = await Shrinker.findOne({ shortUrl: req.params.shortUrl });
  if (shortUrl === null) return res.sendStatus(404);

  shortUrl.clicks++;
  shortUrl.save();

  res.redirect(shortUrl.fullUrl);
});

app.post("/signup", async (req, res) => {
  try {
    const email = req.body.email;
    const passwordRaw = req.body.password;

    // Email Already Signed Up ?
    const emailExists = await SignUp.findOne({ email: email });
    if (emailExists) {
      console.log(409);
      return res.status(409).redirect("login");
    }

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(passwordRaw, salt);

    await SignUp.create({ email, password });

    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("An error occured during sign up");
  }
});

app.post("/signin", async (req, res) => {
  try {
    const email = req.body.email;
    const passwordRaw = req.body.password;

    // Email Already Signed Up ?
    //   If Not Send Status
    let userEmail = await SignUp.findOne({ email: email });
    if (!userEmail) {
      return res.status(404).send("SignUp to Login");
    }

    const validPassword = await bcrypt.compare(passwordRaw, userEmail.password);

    if (!validPassword) {
      return res.sendStatus(403);
    }

    const user = { email: userEmail.email };
    const accessToken = generateAccessToken(user);

    res.cookie("token", accessToken, { httpOnly: true, secure: true });
    console.log("Logged in");

    res.render("home");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("An error occured during sign up");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "10m" });
}

function authenticateToken(req, res, next) {
  // const authHeader = req.headers["authorization"];
  // const token = authHeader.split(" ")[1];

  const token = req.cookies.token;

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

mongoose
  .connect("mongodb://localhost/url-shortner")
  .then(() => {
    console.log("Connected to DB");
    app.listen(5000, () => {
      console.log("Listening on port 5000");
    });
  })
  .catch((err) => {
    console.log(err);
  });
