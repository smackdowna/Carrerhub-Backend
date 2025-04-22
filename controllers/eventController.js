const Event = require("../models/events.js");
const getDataUri = require("../utils/dataUri");
const ErrorHandler = require("../utils/errorhandler");
const { uploadFile } = require("../utils/uploadFile");
const catchAsyncErrors = require("../middleware/catchAsyncError");

// Get all events
exports.createEvent = catchAsyncErrors(async (req, res, next) => {
  const { date, time, eventName, company, skillCovered } = req.body;

  if (!date || !time || !eventName || !company || !skillCovered) {
    return next(new ErrorHandler("Please Enter All Fields", 400));
  }

  const file = req.file;
  console.log(file);
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
    data : events,
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
    data : event,
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
  
