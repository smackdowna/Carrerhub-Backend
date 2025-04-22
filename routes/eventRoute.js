const express = require("express");
const { isAuthenticatedAdmin } = require("../middleware/auth");
const singleUpload = require("../middleware/multer");
const { createEvent } = require("../controllers/eventController");
const router = express.Router();

router.post("/admin/create-event", isAuthenticatedAdmin, singleUpload, createEvent);

module.exports = router;
