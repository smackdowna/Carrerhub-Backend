import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  companyLocation: { type: String, required: true },
});

const eventSchema = new mongoose.Schema({
  image: {
    fileId: { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
  },
  eventName: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  company: { type: companySchema, required: true },
  skillCovered: { type: [String], required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
});

export const Event = mongoose.model("Event", eventSchema);
