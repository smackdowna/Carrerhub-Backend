const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const ApiFeatures = require("../utils/apifeatures.js");
const Course = require("../models/courses.js");
const { uploadFile } = require("../utils/uploadFile.js");
const getDataUri = require("../utils/dataUri.js");

// Create Course with Videos
exports.createCourse = catchAsyncErrors(async (req, res, next) => {
    const { name, description, videos } = req.body;
    console.log(typeof videos, videos);
    // Basic validation
    if (!name || !description) {
        return next(new ErrorHandler("Please Enter All Fields", 400));
    }

    // Validate thumbnail upload
    const thumbnailFile = req.files?.image?.[0];
    if (!thumbnailFile) {
        return next(new ErrorHandler("Please Upload a Thumbnail", 400));
    }

    try {
        // Handle thumbnail upload
        const thumbnailUri = getDataUri(thumbnailFile);
        const thumbnail = await uploadFile(
            thumbnailUri.content,
            thumbnailUri.fileName,
            "course-thumbnails"
        );

        // Create course with validated data
        const course = await Course.create({
            name,
            description,
            videos, // Expecting an array of video IDs
            thumbnail: {
                fileId: thumbnail.fileId,
                name: thumbnail.name,
                url: thumbnail.url
            }
        });

        // Populate the videos field for response
        const populatedCourse = await Course.findById(course._id)
            .populate("videos", "name url createdAt"); // Populate the videos field

        res.status(201).json({
            success: true,
            course: populatedCourse,
            message: "Course created successfully"
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});


// Update Course
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

    if (name) course.name = name;
    if (description) course.description = description;
    if (videos) course.videos = videos;

    const thumbnailFile = req.files?.image?.[0];
    if (course.thumbnail && thumbnailFile) {
        // Delete old thumbnail
        await deleteFile(course.thumbnail.fileId);
    } else if (thumbnailFile) {
        const thumbnailUri = getDataUri(thumbnailFile);
        const thumbnail = await uploadFile(
            thumbnailUri.content,
            thumbnailUri.fileName,
            "course-thumbnails"
        );
        course.thumbnail = {
            fileId: thumbnail.fileId,
            name: thumbnail.name,
            url: thumbnail.url
        };
    }

    await course.save();
    res.status(200).json({
        success: true,
        course
    });
});

// Get All Courses
exports.getAllCourses = catchAsyncErrors(async (req, res, next) => {
    const apiFeature = new ApiFeatures(
        Course.find().populate({
            path: 'videos',
            select: 'name url createdAt'
        }),
        req.query
    )
        .search()
        .filter();

    const courses = await apiFeature.query;

    res.status(200).json({
        success: true,
        courses
    });
});

// Get Course Details
exports.getCourseDetails = catchAsyncErrors(async (req, res, next) => {
    const id = req.params.id;
    if (!id) {
        return next(new ErrorHandler("Course ID is required", 400));
    }
    const course = await Course.findById(id)
        .populate({
            path: 'videos',
            select: 'name url createdAt'
        });

    if (!course) {
        return next(new ErrorHandler("Course not found", 404));
    }

    res.status(200).json({
        success: true,
        course
    });
});

// Delete Course
exports.deleteCourse = catchAsyncErrors(async (req, res, next) => {
    const id = req.params.id;
    if (!id) {
        return next(new ErrorHandler("Course ID is required", 400));
    }
    const course = await Course.findById(id);

    if (!course) {
        return next(new ErrorHandler("Course not found", 404));
    }
    if (course.thumbnail) {
        await deleteFile(course.thumbnail.fileId);
    }
    await course.deleteOne();

    res.status(200).json({
        success: true,
        message: "Course deleted successfully"
    });
});
