// Needs to be rewritten
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("./catchAsyncError");
const jwt = require("jsonwebtoken");
const Employee = require("../models/employee");
const Employeer = require("../models/employeer");
const {
  EMPLOYER_AUTH_TOKEN,
  EMPLOYEE_AUTH_TOKEN,
} = require("../constants/cookies.constant");

//for employee
exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies;

  if (!token[EMPLOYEE_AUTH_TOKEN]) {
    return next(new ErrorHandler("Please Login as Employee", 401));
  }

  let decodedData;
  try {
    decodedData = jwt.verify(
      token[EMPLOYEE_AUTH_TOKEN],
      process.env.JWT_SECRET
    );
  } catch (error) {
    return next(
      new ErrorHandler("Invalid or expired token, please login again", 401)
    );
  }

  if (!decodedData || !decodedData.id) {
    return next(
      new ErrorHandler("Invalid token data, please login again", 401)
    );
  }

  req.user = await Employee.findById(decodedData.id);

  if (!req.user) {
    return next(new ErrorHandler("User not found, please login again", 404));
  }

  next();
});

//for employeer
exports.isAuthenticatedEmployeer = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies;

  if (!token[EMPLOYER_AUTH_TOKEN]) {
    return next(new ErrorHandler("Please Login", 401));
  }

  let decodedData;
  try {
    decodedData = jwt.verify(
      token[EMPLOYER_AUTH_TOKEN],
      process.env.JWT_SECRET
    );
  } catch (error) {
    return next(
      new ErrorHandler("Invalid or expired token, please login again", 401)
    );
  }

  if (!decodedData || !decodedData.id) {
    return next(
      new ErrorHandler("Invalid token data, please login again", 401)
    );
  }

  req.user = await Employeer.findById(decodedData.id);

  if (!req.user) {
    return next(new ErrorHandler("User not found, please login again", 404));
  }

  next();
});
