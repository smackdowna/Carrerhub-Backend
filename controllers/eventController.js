const Event = require("../models/events.js");
const getDataUri = require("../utils/dataUri");
const ErrorHandler = require("../utils/errorhandler");
const { uploadFile, deleteFile } = require("../utils/uploadFile");
const catchAsyncErrors = require("../middleware/catchAsyncError");

// Get all events
exports.createEvent = catchAsyncErrors(async (req, res, next) => {
  const { date, time, eventName, company, skillCovered } = req.body;

  if (!date || !time || !eventName || !company || !skillCovered) {
    return next(new ErrorHandler("Please Enter All Fields", 400));
  }

  const file = req.file;
  if (!file) {
    return next(new ErrorHandler("Please Upload an Event Image", 400));
  }

  try {
    const imageUri = getDataUri(file);
    const uploadedImage = await uploadFile(
      imageUri.content,
      imageUri.fileName,
      "event-thumbnails"
    );

    const event = await Event.create({
      date,
      time,
      eventName,
      company: JSON.parse(company),
      skillCovered: JSON.parse(skillCovered),
      image: {
        fileId: uploadedImage.fileId,
        name: uploadedImage.name,
        url: uploadedImage.url,
      },
      createdBy: req.admin._id,
    });

    const populatedEvent = await Event.findById(event._id).populate(
      "createdBy",
      "full_name email"
    );

    res.status(201).json({
      success: true,
      event: populatedEvent,
      message: "Event created successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get all events
exports.getAllEvents = catchAsyncErrors(async (req, res, next) => {
  const events = await Event.find().populate("createdBy", "full_name email");
  res.status(200).json({
    success: true,
    data: events,
  });
});

// Get single event by ID
exports.getEventById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const event = await Event.findById(id).populate(
    "createdBy",
    "full_name email"
  );

  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  res.status(200).json({
    success: true,
    data: event,
  });
});

// Update event by id
exports.updateEvent = catchAsyncErrors(async (req, res, next) => {
  const id = req.params.id;
  let { eventName, date, time, company, skillCovered } = req.body;

  const event = await Event.findById(id);

  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  // Update simple fields
  if (eventName) event.eventName = eventName;
  if (date) event.date = date;
  if (time) event.time = time;

  // Parse and update company
  if (company) {
    try {
      const parsedCompany = JSON.parse(company);
      if (!event.company) {
        event.company = {};
      }
      if (parsedCompany.companyName)
        event.company.companyName = parsedCompany.companyName;
      if (parsedCompany.companyLocation)
        event.company.companyLocation = parsedCompany.companyLocation;
    } catch (error) {
      console.error("Failed to parse company JSON:", error);
    }
  }

  // Parse and update skillCovered
  if (skillCovered) {
    try {
      const parsedSkills = JSON.parse(skillCovered);
      if (Array.isArray(parsedSkills)) {
        event.skillCovered = parsedSkills;
      }
    } catch (error) {
      console.error("Failed to parse skillCovered JSON:", error);
    }
  }

  // Handle image upload
  const imageFile = req.file;
  if (imageFile) {
    if (event.image) {
      await deleteFile(event.image.fileId);
    }

    const imageUri = getDataUri(imageFile);
    const image = await uploadFile(
      imageUri.content,
      imageUri.fileName,
      "event-images"
    );

    event.image = {
      fileId: image.fileId,
      name: image.name,
      url: image.url,
    };
  }

  await event.save();

  const populatedEvent = await Event.findById(event._id).populate(
    "image",
    "name url createdAt"
  );

  res.status(200).json({
    success: true,
    event: populatedEvent,
  });
});

// Delete an event by ID
exports.deleteEvent = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const event = await Event.findById(id);

  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  await event.deleteOne();

  res.status(200).json({
    success: true,
    message: "Event deleted successfully",
  });
});
