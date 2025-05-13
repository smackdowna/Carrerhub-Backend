const mongoose = require("mongoose");
const { FileSchema } = require("./file.js");

const skillSchema = new mongoose.Schema(
  {
    skillProgrammeName: {
      type: String,
      required: [true, "Please Enter Your Skill Programme Name"],
    },
    programmeOverview: {
      type: String,
      required: [true, "Please Enter Your Programme Overview"],
    },
    programmeDescription: {
      type: String,
    },
    programmeType: {
      type: String,
      enum: ["Certificate", "Diploma", "Bachelor", "Master"],
    },
    department: {
      type: String,
      required: [true, "Please Enter Programme Department Name"],
    },
    subDepartment: {
      type: String,
      required: [true, "Please Enter Programme Sub-Department Name"],
    },
    duration: {
      type: String,
      required: [true, "Please Enter Programme Duration"],
    },
    desiredQualificationOrExperience: {
      type: String,
    },
    programmeLink: {
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

module.exports = mongoose.model("Skills", skillSchema);
