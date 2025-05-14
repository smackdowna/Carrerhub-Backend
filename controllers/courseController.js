const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const ApiFeatures = require("../utils/apifeatures.js");
const Course = require("../models/courses.js");
const {
  uploadFile,
  bulkDeleteFiles,
  deleteFile,
} = require("../utils/uploadFile.js");
const getDataUri = require("../utils/dataUri.js");
const Video = require("../models/videos.js");

exports.createCourse = catchAsyncErrors(async (req, res, next) => {
  const {
    courseName,
    courseOverview,
    courseDescription = "",
    courseType,
    department,
    duration,
    desiredQualificationOrExperience = "",
    courseLink = "",
    pricingType = "Free",
    fee = 0,
    numberOfSeats = 0,
    isIncludedCertificate = false,
  } = req.body;

  // Validate required fields
  if (!courseName || !courseOverview || !department || !duration) {
    return next(new ErrorHandler("Please fill all required fields", 400));
  }

  // Validate thumbnail upload
  const thumbnailFile = req.files?.image?.[0];
  if (!thumbnailFile) {
    return next(new ErrorHandler("Please upload a thumbnail", 400));
  }

  // Upload thumbnail
  const thumbnailUri = getDataUri(thumbnailFile);
  const thumbnail = await uploadFile(
    thumbnailUri.content,
    thumbnailUri.fileName,
    "course-thumbnails"
  );

  // Create the course
  const course = await Course.create({
    courseName,
    courseOverview,
    courseDescription,
    courseType,
    department,
    duration,
    desiredQualificationOrExperience,
    courseLink,
    pricingType,
    fee,
    numberOfSeats,
    isIncludedCertificate,
    thumbnail: {
      fileId: thumbnail.fileId,
      name: thumbnail.name,
      url: thumbnail.url,
    },
    postedBy: req?.user?.id || req?.admin?.id,
  });

  res.status(201).json({
    success: true,
    course,
    message: "Course created successfully",
  });
});


// Get All Courses
exports.getAllCourses = catchAsyncErrors(async (req, res, next) => {

  const courses = await Course.find();

  res.status(200).json({
    success: true,
    courses,
  });
});

// Get Course Details
exports.getCourseDetails = catchAsyncErrors(async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return next(new ErrorHandler("Course ID is required", 400));
  }
  const course = await Course.findById(id).populate({
    path: "videos",
    select: "name url title createdAt",
  });

  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }

  res.status(200).json({
    success: true,
    course,
  });
});

// Delete Course
exports.deleteCourse = catchAsyncErrors(async (req, res, next) => {
  const id = req.params.id;

  if (!id) {
    return next(new ErrorHandler("Course ID is required", 400));
  }

  const course = await Course.findById(id).populate("videos");

  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }

  // 🔐 Authorization Check
  const isAdmin = req.admin;
  const isOwner =
    req.user && course.postedBy.toString() === req.user._id.toString();

  if (!isAdmin && !isOwner) {
    return next(
      new ErrorHandler("You are not authorized to delete this course", 403)
    );
  }

  // 📁 Gather all files to delete
  const fileIdsToDelete = [];

  if (course.thumbnail) {
    fileIdsToDelete.push(course.thumbnail.fileId);
  }

  const videoIdsToDelete = [];
  if (course.videos && course.videos.length > 0) {
    course.videos.forEach((video) => {
      fileIdsToDelete.push(video.fileId);
      videoIdsToDelete.push(video._id);
    });
  }

  // 🗑️ Delete files and videos
  if (fileIdsToDelete.length > 0) {
    try {
      await bulkDeleteFiles(fileIdsToDelete);
    } catch (error) {
      console.log(error);
      return next(new ErrorHandler("Failed to delete files", 500));
    }
  }

  if (videoIdsToDelete.length > 0) {
    await Video.deleteMany({ _id: { $in: videoIdsToDelete } });
  }

  await course.deleteOne();

  res.status(200).json({
    data: course,
    success: true,
    message: "Course deleted successfully",
  });
});

exports.updateCourse = catchAsyncErrors(async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return next(new ErrorHandler("Course ID is required", 400));
  }

  const { name, description, videos } = req.body;

  const course = await Course.findById(id);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }

  // 🔐 Authorization Check
  const isAdmin = req.admin;
  const isOwner =
    req.user && course.postedBy.toString() === req.user._id.toString();

  if (!isAdmin && !isOwner) {
    return next(
      new ErrorHandler("You are not authorized to update this course", 403)
    );
  }

  // 🛠️ Update fields
  if (name) course.name = name;
  if (description) course.description = description;

  if (videos) {
    const validExistingVideos = [];
    for (const videoId of course.videos) {
      const videoExists = await Video.exists({ _id: videoId });
      if (videoExists) {
        validExistingVideos.push(videoId);
      }
    }

    course.videos = [...validExistingVideos, ...videos];
  }

  // 🖼️ Thumbnail Upload
  const thumbnailFile = req.files?.image?.[0];

  if (course.thumbnail && thumbnailFile) {
    await deleteFile(course.thumbnail.fileId);
  }

  if (thumbnailFile) {
    const thumbnailUri = getDataUri(thumbnailFile);
    const thumbnail = await uploadFile(
      thumbnailUri.content,
      thumbnailUri.fileName,
      "course-thumbnails"
    );

    course.thumbnail = {
      fileId: thumbnail.fileId,
      name: thumbnail.name,
      url: thumbnail.url,
    };
  }

  await course.save();

  res.status(200).json({
    success: true,
    course,
  });
});

// Get all courses for employer
exports.getAllEmployerCourses = catchAsyncErrors(async (req, res, next) => {
  const resultPerPage = 15;
  const courseCount = await Course.countDocuments({ postedBy: req.user.id });

  const apiFeature = new ApiFeatures(
    Course.find({ postedBy: req.user.id }),
    req.query
  )
    .search()
    .filter()
    .pagination(resultPerPage);
  const courses = await apiFeature.query;

  res.status(200).json({
    success: true,
    courseCount,
    courses,
    resultPerPage,
    filteredJobsCount: courses.length,
  });
});
