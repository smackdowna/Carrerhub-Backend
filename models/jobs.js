const mongoose = require("mongoose");

const ApplicantSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
  },
  appliedDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["APPLIED", "REJECTED", "HIRED", "INTERVIEW"],
    default: "APPLIED",
  },
  isViewed: {
    type: Boolean,
    default: false,
  },
});
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
  location: {
    type: String,
    required: true,
  },
  employmentType: {
    type: String,
    enum: ["Job", "Internship"],
    required: true,
  },
  employmentTypeCategory: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        if (this.employmentType === "Job") {
          return ["Full-Time", "Part-Time", "Contract"].includes(value);
        } else if (this.employmentType === "Internship") {
          return ["Shadow Internship", "Practice Internship"].includes(value);
        }
        return false;
      },
      message: (props) => `${props.value} is not a valid employmentTypeCategory for ${props.instance.employmentType}`,
    },
  },

  department: {
    type: String,
    required: true,
  },
  subDepartment: {
    type: String,
    required: true,
  },

  
  employmentDuration: {
    type: Number,
    required: true,
  }, // Duration in months, optional
  salary: {
    type: Number,
    required: true,//salary range per month
  }, // Optional 
  companyDetails: {
    companyName: {
      type: String,
      required: [true, "Please Enter job location !"],
    },
    industryType: {
      type: String,
      required: true,
    },
    // websiteLink: {
    //   type: String,
    // },
    bio: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
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
  extraBenefits: {
    type: String,
    required: true,
  },
  experience: {
    type: String,
    required: [
      true,
      "Please Enter your experience which are you looking for !",
    ],
  },
  applicants: [ApplicantSchema], // Array of applicant IDs
});
jobSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Jobs", jobSchema);
