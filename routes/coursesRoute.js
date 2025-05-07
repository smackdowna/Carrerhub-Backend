const express = require("express");
const { isAuthenticatedAdmin, isAuthenticatedEmployeer, isAuthenticatedAdminOrEmployer } = require("../middleware/auth");
const {
    createCourse,
    deleteCourse,
    getAllCourses,
    getCourseDetails,
    updateCourse,
    getAllEmployerCourses,
} = require("../controllers/courseController.js");
const handleMultiMediaUpload = require("../middleware/mediaUpload.js");
const router = express.Router();
router.route("/courses/create").post(isAuthenticatedAdminOrEmployer, handleMultiMediaUpload, createCourse);
router
  .route("/employeer/course")
  .get(isAuthenticatedEmployeer, getAllEmployerCourses);
router.route("/courses").get(getAllCourses);
router.route("/courses/:id")
    .get(getCourseDetails)
    .delete(isAuthenticatedAdmin, deleteCourse)
    .put(isAuthenticatedAdmin, handleMultiMediaUpload, updateCourse);

module.exports = router;
