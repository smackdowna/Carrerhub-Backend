const express = require("express");
const { isAuthenticatedAdmin } = require("../middleware/auth");
const {
    createCourse,
    deleteCourse,
    getAllCourses,
    getCourseDetails,
    updateCourse,
} = require("../controllers/courseController.js");
const handleMultiMediaUpload = require("../middleware/mediaUpload.js");
const router = express.Router();
router.route("/courses/create").post(isAuthenticatedAdmin, handleMultiMediaUpload, createCourse);
router.route("/courses").get(getAllCourses);
router.route("/courses/:id")
    .get(getCourseDetails)
    .delete(isAuthenticatedAdmin, deleteCourse)
    .put(isAuthenticatedAdmin, handleMultiMediaUpload, updateCourse);

module.exports = router;
