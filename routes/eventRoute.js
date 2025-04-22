const express = require("express");
const { isAuthenticatedAdmin } = require("../middleware/auth");
const singleUpload = require("../middleware/multer");
const { createEvent, getAllEvents } = require("../controllers/eventController");
const router = express.Router();

// Only for admin
router.post("/admin/events/create-event", isAuthenticatedAdmin, singleUpload, createEvent);

// Public routes
router.get("/events", getAllEvents);

module.exports = router;
