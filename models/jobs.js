const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  requirements: {
    type: String,
    required: true,
  },
  // Array of strings
  requiredSkills: [
    {
      type: String,
      required: true,
    },
  ], // Array of strings
  responsibilities: {
    type: String,
    required: true,
  },
  locationType: {
    type: String,
    enum: ["Remote", "Onsite", "Hybrid"],
    required: true,
  },
  employmentType: {
    type: String,
    enum: ["Full-Time", "Part-Time", "Contract", "Internship"],
    required: true,
  },
  employmentDuration: {
    type: String,
    required: true,
  }, // Duration in months, optional
  salary: {
    type: String,
    required: true,
  }, // Optional
  companyDetails: {
    companyName: {
      type: String,
      required: true,
    },
    industryType: {
      type: String,
      required: true,
    },
    websiteLink: {
      type: String,
      required: true,
    },
  }, //we can get this from the user who created instead of asking each time
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employeer",
    required: true,
  },
  postedAt: {
    type: Date,
    default: Date.now,
  },
  applicationDeadline: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["Open", "Closed"],
    default: "Open",
  },
  applicants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
  ], // Array of applicant IDs
});

module.exports = mongoose.model("Jobs", jobSchema);
