const mongoose = require("mongoose");
const { FileSchema } = require("./file.js");

const courseSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: [true, "Please Enter Your Course Name"],
    },
    courseOverview: {
      type: String,
      required: [true, "Please Enter Your Course Description In Short"],
    },
    courseDescription: {
      type: String,
    },
    courseType: {
      type: String,
      enum: ["Certificate", "Diploma", "Bachelor", "Master"],
      required: [true, "Please Select Course Type"],
    },
    department: {
      type: String,
      required: [true, "Please Enter Course Department Name"],
    },
    duration: {
      type: String,
      required: [true, "Please Enter Course Duration"],
    },
    desiredQualificationOrExperience: {
      type: String,
    },
    courseLink: {
      type: String,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    fee: {
      type: Number,
      default: 0,
    },
    numberOfSeats: {
      type: Number,
      default: 0,
    },
    isIncludedCertificate: {
      type: Boolean,
      default: false,
    },
    thumbnail: FileSchema,
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employeer",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Courses", courseSchema);
