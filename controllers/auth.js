const express = require("express");
const User = require("../Model/user");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const checkDbConnection = () => {
  return mongoose.connection.readyState === 1;
};

exports.signup = async (req, res, next) => {
  if (!checkDbConnection()) {
    const error = new Error("Database connection unavailable");
    error.statusCode = 503;
    return next(error);
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("SignUp Validation Failed");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const { email, password, name } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      const error = new Error("Email already exists!");
      error.statusCode = 422;
      throw error;
    }

    const hashedPw = await bcrypt.hash(password, 12);
    const user = new User({ name, password: hashedPw, email });
    const result = await user.save();

    res.status(201).json({
      message: "Successfully SignedUP!",
      userId: result._id,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  if (!checkDbConnection()) {
    const error = new Error("Database connection unavailable");
    error.statusCode = 503;
    return next(error);
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("Email Not Found!");
      error.statusCode = 401;
      throw error;
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Password Does Not Match");
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      token: token,
      userId: user._id.toString(),
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getStatus = async (req, res, next) => {
  if (!checkDbConnection()) {
    const error = new Error("Database connection unavailable");
    error.statusCode = 503;
    return next(error);
  }

  try {
    const user = await User.findById(req.userId).select("status");

    if (!user) {
      const error = new Error("User not Found!");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ status: user.status });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  if (!checkDbConnection()) {
    const error = new Error("Database connection unavailable");
    error.statusCode = 503;
    return next(error);
  }

  const { status } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { status: status },
      { new: true }
    );

    if (!user) {
      const error = new Error("User not Found!");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ message: "User status updated" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
