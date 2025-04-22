const express = require("express");
const { isAuthenticatedAdmin } = require("../middleware/auth");
const singleUpload = require("../middleware/multer");
const { createEvent, getAllEvents, getEventById, deleteEvent } = require("../controllers/eventController");
const router = express.Router();

// Only for admin
router.post("/admin/events/create-event", isAuthenticatedAdmin, singleUpload, createEvent);
router.delete("/admin/events/:id", isAuthenticatedAdmin, deleteEvent);

// Public routes
router.get("/events", getAllEvents);
router.get("/events/:id", getEventById);

module.exports = router;
