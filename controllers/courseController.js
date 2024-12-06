const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const ApiFeatures = require("../utils/apifeatures.js");
const Course = require("../models/courses.js");
const { uploadFile, bulkDeleteFiles, deleteFile } = require("../utils/uploadFile.js");
const getDataUri = require("../utils/dataUri.js");
const Video = require("../models/videos.js");

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
            .populate("videos", "name title url createdAt"); // Populate the videos field

        res.status(201).json({
            success: true,
            course: populatedCourse,
            message: "Course created successfully"
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});



// Get All Courses
exports.getAllCourses = catchAsyncErrors(async (req, res, next) => {
    const apiFeature = new ApiFeatures(
        Course.find().populate({
            path: 'videos',
            select: 'name url title createdAt'
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
            select: 'name url title createdAt'
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

    const course = await Course.findById(id).populate("videos");

    if (!course) {
        return next(new ErrorHandler("Course not found", 404));
    }

    const fileIdsToDelete = [];
    if (course.thumbnail) {
        fileIdsToDelete.push(course.thumbnail.fileId);
    }

    const videoIdsToDelete = [];
    if (course.videos && course.videos.length > 0) {
        course.videos.forEach(video => {
            fileIdsToDelete.push(video.fileId);
            videoIdsToDelete.push(video._id);
        });
    }
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
        message: "Course deleted successfully"
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


    if (name) course.name = name;
    if (description) course.description = description;

    if (videos || course.videos) {
        const validExistingVideos = [];
        for (const videoId of course.videos) {
            const videoExists = await Video.exists({ _id: videoId });
            if (videoExists) {
                validExistingVideos.push(videoId);
            }
        }

        course.videos = [...validExistingVideos, ...videos];

    }
    const thumbnailFile = req.files?.image?.[0];
    if (course.thumbnail && thumbnailFile) {
        await deleteFile(course.thumbnail.fileId);
    }

    if (thumbnailFile) {
        const thumbnailUri = getDataUri(thumbnailFile);
        const thumbnail = await uploadFile(thumbnailUri.content, thumbnailUri.fileName, "course-thumbnails");
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
