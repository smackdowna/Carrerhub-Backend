const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const ApiFeatures = require("../utils/apifeatures.js");
const Skill = require("../models/skill.js");
const { uploadFile, deleteFile } = require("../utils/uploadFile.js");
const getDataUri = require("../utils/dataUri.js");

// Create Skill with Videos
exports.createSkills = catchAsyncErrors(async (req, res, next) => {
    const { name, description, skillCovered, videoId } = req.body;

    if (!name || !description || !skillCovered || !videoId) {
        return next(new ErrorHandler("Please Enter All Fields", 400));
    }

    const thumbnailFile = req.files?.image?.[0];
    if (!thumbnailFile) {
        return next(new ErrorHandler("Please Upload a Thumbnail", 400));
    }

    try {
        const thumbnailUri = getDataUri(thumbnailFile);
        const thumbnail = await uploadFile(
            thumbnailUri.content,
            thumbnailUri.fileName,
            "skill-thumbnails"
        );

        const skill = await Skill.create({
            name,
            description,
            skillCovered,
            video: videoId,
            thumbnail: {
                fileId: thumbnail.fileId,
                name: thumbnail.name,
                url: thumbnail.url
            }
        });

        const populatedSkill = await Skill.findById(skill._id)
            .populate("video", "name url createdAt");

        res.status(201).json({
            success: true,
            skill: populatedSkill,
            message: "Skill created successfully"
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});


// Update Skill
exports.updateSkill = catchAsyncErrors(async (req, res, next) => {
    const id = req.params.id;
    const { name, description, skillCovered, videoId } = req.body; // Changed from videos to videoId
    const skill = await Skill.findById(id);

    if (!skill) {
        return next(new ErrorHandler("Skill not found", 404)); // Handle case where skill does not exist
    }

    // Update skill fields
    if (name) skill.name = name;
    if (description) skill.description = description;
    if (skillCovered) skill.skillCovered = skillCovered;
    if (videoId) skill.video = videoId; // Update the video field

    // Handle thumbnail upload
    const thumbnailFile = req.files?.image?.[0];
    if (thumbnailFile) {
        // Delete old thumbnail if exists
        if (skill.thumbnail) {
            await deleteFile(skill.thumbnail.fileId);
        }

        const thumbnailUri = getDataUri(thumbnailFile);
        const thumbnail = await uploadFile(
            thumbnailUri.content,
            thumbnailUri.fileName,
            "skill-thumbnails"
        );

        skill.thumbnail = {
            fileId: thumbnail.fileId,
            name: thumbnail.name,
            url: thumbnail.url
        };
    }

    await skill.save();

    // Populate the updated skill data for the response
    const populatedSkill = await Skill.findById(skill._id)
        .populate("video", "name url createdAt"); // Populate the video field

    res.status(200).json({
        success: true,
        skill: populatedSkill // Return the populated skill
    });
});


// Other controller methods remain the same...
exports.getAllSkills = catchAsyncErrors(async (req, res, next) => {
    const apiFeature = new ApiFeatures(
        Skill.find().populate("video", "name url createdAt"), // Changed from videos to video
        req.query
    )
        .search()
        .filter();

    const skills = await apiFeature.query;

    res.status(200).json({
        success: true,
        skills
    });
});


exports.getSkillDetails = catchAsyncErrors(async (req, res, next) => {
    const skill = await Skill.findById(req.params.id)
        .populate("video", "name url createdAt"); // Changed from videos to video

    if (!skill) {
        return next(new ErrorHandler("Skill not found", 404));
    }

    res.status(200).json({
        success: true,
        skill
    });
});


exports.deleteSkill = catchAsyncErrors(async (req, res, next) => {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
        return next(new ErrorHandler("Skill not found", 404));
    }
    if (skill.thumbnail) {
        await deleteFile(skill.thumbnail.fileId);
    }
    await skill.deleteOne();

    res.status(200).json({
        success: true,
        message: "Skill deleted successfully"
    });
});