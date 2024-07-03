const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const Employeer = require("../models/employeer.js");
const sendToken = require("../utils/jwtToken");
const crypto = require("crypto");
// const cloudinary = require("cloudinary");
const sendEmail = require("../utils/sendEmail.js");
const getDataUri = require("../utils/dataUri.js");
const { EMPLOYER_AUTH_TOKEN } = require("../constants/cookies.constant");
const ik = require("../config/imageKit.js");
const fs = require("fs");
const { uploadImage, deleteImage } = require("../utils/uploadImage.js");

async function deleteUsersWithExpiredOTP() {
  try {
    const currentTime = Date.now();
    await Employeer.deleteMany({
      otp_expiry: { $lte: currentTime },
      otp: { $ne: null }, // Exclude users who have already verified OTP
    });
  } catch (error) {
    console.error("Error deleting users with expired OTP:", error);
  }
}

setInterval(deleteUsersWithExpiredOTP, 1 * 60 * 1000);

// Register a User
exports.registerEmployeer = catchAsyncErrors(async (req, res, next) => {
  const { full_name, mobilenumber, email, password, confirm_password } =
    req.body;

  if (!full_name || !mobilenumber || !email || !password || !confirm_password)
    return next(new ErrorHandler("Please fill all details", 400));

  if (password != confirm_password)
    return next(
      new ErrorHandler("Password and Confirm Password Doesn't Match", 400)
    );

  let user = await Employeer.findOne({ email });

  if (user) {
    return res
      .status(400)
      .json({ success: false, message: "User already exists" });
  }

  const otp = Math.floor(Math.random() * 100000);
  console.log("This is The registration OTP", otp);

  user = await Employeer.create({
    full_name,
    email,
    mobilenumber,
    password,
    otp,
    otp_expiry: new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000),
  });

  const emailMessage = `Dear ${user.full_name},

Thank you for choosing Carrer Hub! 🏆

To ensure the security of your account and expedite your registration process, please verify your account by entering the following One-Time Password (OTP):

OTP: ${otp}

This OTP is exclusively for you and will expire after a limited time. 
  
Thank you for your trust in Carrer Hub. We can't wait to see you in action!

Best regards,

Carrer Hub 🏅
    `;

  await sendEmail(email, "Verify your account", emailMessage);

  res.status(201).json({
    success: true,
    message: "OTP sent to your registered Email ID",
  });
});

//verify
exports.verify = catchAsyncErrors(async (req, res, next) => {
  const otp = Number(req.body.otp);

  const user = await Employeer.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User Doesn't exist", 404));
  }

  if (user.otp !== otp || user.otp_expiry < Date.now()) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid OTP or has been Expired" });
  }

  user.verified = true;
  user.otp = null;
  user.otp_expiry = null;

  await user.save();

  const emailMessage = `Dear ${user.full_name},

Thank you for choosing Carrer Hub! 🏆

You are a Verified User Start Posting JOb/Internship. 
  
Thank you for your trust in Carrer Hub. We can't wait to see you in action!

Best regards,

Carrer Hub 🏅
    `;

  await sendEmail(user.email, "Welcome To Carrer Hub", emailMessage);

  sendToken(user, 200, res, "Account Verified", EMPLOYER_AUTH_TOKEN);
});

//login user
exports.loginEmployeer = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  // checking if user has given password and email both

  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email & Password", 400));
  }

  const user = await Employeer.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  sendToken(user, 200, res, "Logged in Successfully!", EMPLOYER_AUTH_TOKEN);
});

// Logout User
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie(EMPLOYER_AUTH_TOKEN, "", {
    expires: new Date(0), // Set the expiration date to a past date to immediately expire the cookie
    httpOnly: true,
    secure: "true", // Set to true in production, false in development
    sameSite: "None", // Ensure SameSite is set to None for cross-site cookies
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler("Please enter email", 404));
  }

  const user = await Employeer.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Get ResetPassword Token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const frontendurl = `https://localhost:7000/reset-password/${resetToken}`;

  const message = `Dear ${user.name},

    We hope this email finds you well. It appears that you've requested to reset your password for your Carrer Hub account. We're here to assist you in securely resetting your password and getting you back to enjoying our platform hassle-free.

    To reset your password, please click on the following link:

    ${frontendurl}

    This link will expire in 15 minutes for security reasons, so please make sure to use it promptly. If you didn't initiate this password reset request, please disregard this email, and your account will remain secure.

    If you encounter any issues or have any questions, feel free to reach out to our support team at [support email] for further assistance. We're here to help you every step of the way.

    Thank you for choosing Carrer Hub. We appreciate your continued support.

    Best regards,
    Carrer Hub Team`;

  try {
    await sendEmail(
      user.email,
      "Password Reset Link for Carrer Hub Account",
      message
    );

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  // creating token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await Employeer.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler(
        "Reset Password Token is invalid or has been expired",
        400
      )
    );
  }

  if (!req.body.password || !req.body.confirmPassword) {
    return next(new ErrorHandler("Please Enter Password", 400));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not password", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully ",
  });
});

//Enter company Details
exports.EnterEmployeerDetails = catchAsyncErrors(async (req, res, next) => {
  const { address, companyDetails } = req.body;

  if (!Array.isArray(address) || !Array.isArray(companyDetails)) {
    return next(new ErrorHandler("Please Enter All Fields", 400));
  }

  // Assuming req.user contains the authenticated user info
  const userId = req.user.id;

  // Update user details in the database
  const updatedUser = await Employeer.findByIdAndUpdate(
    userId,
    {
      address,
      companyDetails,
    },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(201).json({
    success: true,
    message: "Details Updated Successfully",
  });
});

//get employer profile
exports.getEmployerDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await Employeer.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

//update user details
exports.updateEmployeerDetails = catchAsyncErrors(async (req, res, next) => {
  const { full_name, email, mobilenumber } = req.body;

  const file = req.file; // Assuming you are using multer or similar middleware for file uploads

  const user = await Employeer.findById(req.user._id);

  if (full_name) user.full_name = full_name;
  if (email) user.email = email;
  if (mobilenumber) user.mobilenumber = mobilenumber;

  if (!user.company_avatar) {
    user.company_avatar = {};
  }

  if (file) {
    const fileUri = getDataUri(file);
    // const mycloud = await cloudinary.v2.uploader.upload(fileUri.content, {
    //   folder: "company_avatar",
    //   width: 150,
    //   crop: "scale",
    // });

    const result = await uploadImage(
      fileUri.content,
      fileUri.fileName,
      "company_avatar"
    );
    if (user.company_avatar.public_id && user.company_avatar.url) {
      await deleteImage(user.company_avatar.public_id);
      await deleteImage(user.company_avatar.thumbnailUrl);
      //await cloudinary.v2.uploader.destroy(user.company_avatar.public_id);
    }
    user.company_avatar = {
      public_id: result.fileId,
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
    };
    await user.save();
    res.status(200).json({
      success: true,
      message: "Profile is updated successfully ",
    });
  }
});

// update Employeer password
exports.updatePasswordEmployeer = catchAsyncErrors(async (req, res, next) => {
  if (!req.body.oldPassword) {
    return next(new ErrorHandler("please enter your OLd password", 400));
  }

  const user = await Employeer.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("password does not match", 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully ",
  });
});
