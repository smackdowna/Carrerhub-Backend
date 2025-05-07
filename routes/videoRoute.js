const express = require("express");
const { isAuthenticatedAdmin, isAuthenticatedEmployeer, isAuthenticatedAdminOrEmployer } = require("../middleware/auth");
const handleMultiMediaUpload = require("../middleware/mediaUpload.js");
const { createVideo, deleteVideo, getVideo, updateVideo } = require("../controllers/videoController.js");
const router = express.Router();

router.route("/video/create").post(isAuthenticatedAdminOrEmployer, handleMultiMediaUpload, createVideo);
router.route("/video/create").post(isAuthenticatedEmployeer, handleMultiMediaUpload, createVideo);
router.route("/video/:id")
    .get(getVideo)
    .put(isAuthenticatedAdmin, handleMultiMediaUpload, updateVideo)
    .delete(isAuthenticatedAdmin, deleteVideo);

module.exports = router;