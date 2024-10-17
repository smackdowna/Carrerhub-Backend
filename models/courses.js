const mongoose = require("mongoose");
const { FileSchema } = require("./file.js");

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please Enter Your Course Name"],
        unique: true,
    },
    description: {
        type: String,
        required: [true, "Please Enter Your Course Description"],
    },
    videos: {
        type: [
            {
                type: mongoose.Schema.ObjectId,
                ref: "Video",
            },
        ],
        default: [],
    },
    thumbnail: FileSchema,
}, {
    timestamps: true,
});

module.exports = mongoose.model("Courses", courseSchema);
