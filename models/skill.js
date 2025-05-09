const mongoose = require("mongoose");
const { FileSchema } = require("./file.js");

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please Enter Your Skill Name"],
      unique: true,
    },
    description: {
      type: String,
      required: [true, "Please Enter Your Skill Description"],
    },
    skillCovered: {
      type: String,
      required: [true, "Please Enter Your Skill Covered"],
    },
    video: {
      // Single video reference
      type: mongoose.Schema.ObjectId,
      ref: "Video",
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
