const catchAsyncErrors = require("../middleware/catchAsyncError");
const { Event } = require("../models/events");
const getDataUri = require("../utils/dataUri");
const ErrorHandler = require("../utils/errorhandler");
const { uploadFile } = require("../utils/uploadFile");

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
