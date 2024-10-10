const express = require("express");

const ejs = require("ejs");
const bcrypt = require("bcrypt");

const SignUp = require("./model/signup.model");
const Shrinker = require("./model/shrinker.model");

const mongoose = require("mongoose");
const { use } = require("bcrypt/promises");

const app = express();
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("signup");
});

app.get("/login", (req, res) => {
  res.render("signin");
});

app.get("/dashboard", async (req, res) => {
  try {
    const shortUrls = await Shrinker.find();
    console.log(shortUrls);
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
    const userEmail = await SignUp.findOne({ email: email });
    if (!userEmail) {
      return res.status(404).send("SignUp to Login");
    }

    const user = await bcrypt.compare(passwordRaw, userEmail.password);

    if (!user) {
      return res.sendStatus(403);
    }
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("An error occured during sign up");
  }
});

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
