const express = require("express");
const { isAuthenticatedAdmin } = require("../middleware/auth");
const singleUpload = require("../middleware/multer");
const { createEvent, getAllEvents, getEventById, deleteEvent, updateEvent } = require("../controllers/eventController");
const router = express.Router();

// Only for admin
router.post("/admin/events/create-event", isAuthenticatedAdmin, singleUpload, createEvent);
router.delete("/admin/events/:id", isAuthenticatedAdmin, deleteEvent);
router.put("/admin/events/update/:id", isAuthenticatedAdmin, singleUpload, updateEvent);

// Public routes
router.get("/events", getAllEvents);
router.get("/event/:id", getEventById);

module.exports = router;
