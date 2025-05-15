const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const ApiFeatures = require("../utils/apifeatures.js");
const Skill = require("../models/skill.js");
const {
  uploadFile,
  deleteFile,
  bulkDeleteFiles,
} = require("../utils/uploadFile.js");
const getDataUri = require("../utils/dataUri.js");
const Video = require("../models/videos.js");

// Create Skill with Videos
exports.createSkills = catchAsyncErrors(async (req, res, next) => {
  const {
    skillProgrammeName,
    programmeOverview,
    programmeDescription="",
    programmeType,
    department,
    duration,
    desiredQualificationOrExperience="",
    programmeLink="",
    pricingType="Free",
    fee,
    numberOfSeats,
    isIncludedCertificate
  } = req.body;

  // Validate required fields
  if (
    !skillProgrammeName ||
    !programmeOverview ||
    !department ||
    !duration
  ) {
    return next(new ErrorHandler("Please fill all required fields", 400));
  }

  // Check for thumbnail image
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
      skillProgrammeName,
      programmeOverview,
      programmeDescription,
      programmeType,
      department,
      duration,
      desiredQualificationOrExperience,
      programmeLink,
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
      skill,
      message: "Skill Programme created successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});


// Update Skill
exports.updateSkill = catchAsyncErrors(async (req, res, next) => {
  const id = req.params.id;

  const {
    name,
    description,
    skillProgrammeName,
    programmeOverview,
    programmeDescription,
    programmeType,
    department,
    duration,
    desiredQualificationOrExperience,
    programmeLink,
    pricingType,
    fee,
    numberOfSeats,
    isIncludedCertificate,
  } = req.body;

  const skill = await Skill.findById(id);
  if (!skill) {
    return next(new ErrorHandler("Skill not found", 404));
  }

  // 🔐 Authorization Check
  const isAdmin = req.admin;
  const isOwner =
    req.user && skill.postedBy.toString() === req.user._id.toString();

  if (!isAdmin && !isOwner) {
    return next(
      new ErrorHandler("You are not authorized to update this skill", 403)
    );
  }

  // 🛠️ Update fields
  if (name) skill.name = name;
  if (description) skill.description = description;

  if (skillProgrammeName) skill.skillProgrammeName = skillProgrammeName;
  if (programmeOverview) skill.programmeOverview = programmeOverview;
  if (programmeDescription) skill.programmeDescription = programmeDescription;
  if (programmeType) skill.programmeType = programmeType;
  if (department) skill.department = department;
  if (duration) skill.duration = duration;
  if (desiredQualificationOrExperience) skill.desiredQualificationOrExperience = desiredQualificationOrExperience;
  if (programmeLink) skill.programmeLink = programmeLink;
  if (pricingType) skill.pricingType = pricingType;
  if (typeof fee !== "undefined") skill.fee = fee;
  if (typeof numberOfSeats !== "undefined") skill.numberOfSeats = numberOfSeats;
  if (typeof isIncludedCertificate !== "undefined") skill.isIncludedCertificate = isIncludedCertificate;

  // 🖼️ Thumbnail upload handling
  const thumbnailFile = req.files?.image?.[0];
  if (thumbnailFile) {
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
      url: thumbnail.url,
    };
  }

  await skill.save();

  res.status(200).json({
    success: true,
    skill,
  });
});


// Other controller methods remain the same...
exports.getAllSkills = catchAsyncErrors(async (req, res) => {
  const { keyword, programmeType, department, pricingType } = req.query;

  const filter = {};

  // Filter by programmeType
  if (programmeType) {
    filter.programmeType = programmeType;
  }

  // Filter by department
  if (department) {
    filter.department = department;
  }

  // Filter by pricingType
  if (pricingType) {
    filter.pricingType = pricingType;
  }

  // Search by courseName
  if (keyword) filter.skillProgrammeName = { $regex: keyword, $options: "i" };
  const skills = await Skill.find(filter);

  res.status(200).json({
    success: true,
    skills,
  });
});

exports.getSkillDetails = catchAsyncErrors(async (req, res, next) => {
  const skill = await Skill.findById(req.params.id).populate("postedBy");

  if (!skill) {
    return next(new ErrorHandler("Skill not found", 404));
  }

  res.status(200).json({
    success: true,
    skill,
  });
});

// Get all courses for employer
exports.getAllEmployerSkillProgrammes = catchAsyncErrors(
  async (req, res, next) => {
    const resultPerPage = 15;
    const skillProgrammesCount = await Skill.countDocuments({
      postedBy: req.user.id,
    });

    const apiFeature = new ApiFeatures(
      Skill.find({ postedBy: req.user.id }),
      req.query
    )
      .search()
      .filter()
      .pagination(resultPerPage);
    const skills = await apiFeature.query;

    res.status(200).json({
      success: true,
      skillProgrammesCount,
      skills,
      resultPerPage,
      filteredJobsCount: skills?.length,
    });
  }
);

exports.deleteSkill = catchAsyncErrors(async (req, res, next) => {
  const id = req.params.id;

  if (!id) {
    return next(new ErrorHandler("Skill ID is required", 400));
  }

  const skill = await Skill.findById(id).populate("video");

  if (!skill) {
    return next(new ErrorHandler("Skill not found", 404));
  }

  // 🔐 Authorization: allow if admin OR posting employer
  const isAdmin = req.admin;
  const isOwner =
    req.user && skill.postedBy.toString() === req.user._id.toString();

  if (!isAdmin && !isOwner) {
    return next(
      new ErrorHandler("You are not authorized to delete this skill", 403)
    );
  }

  // 🗑️ Gather file IDs for deletion
  const fileIdsToDelete = [];
  const videoIdsToDelete = [];

  if (skill.thumbnail) {
    fileIdsToDelete.push(skill.thumbnail.fileId);
  }

  if (skill.video) {
    fileIdsToDelete.push(skill.video.fileId);
    videoIdsToDelete.push(skill.video._id);
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

  await skill.deleteOne();

  res.status(200).json({
    success: true,
    message: "Skill deleted successfully",
  });
});
