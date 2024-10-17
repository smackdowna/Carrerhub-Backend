const express = require("express");
const { isAuthenticatedAdmin } = require("../middleware/auth");
const { createSkills, deleteSkill, getAllSkills, getSkillDetails, updateSkill } = require("../controllers/skillsController.js");
const handleMultiMediaUpload = require("../middleware/mediaUpload.js");
const router = express.Router();

router.route("/skills/create").post(isAuthenticatedAdmin, handleMultiMediaUpload, createSkills);
router.route("/skills").get(getAllSkills);
router.route("/skills/:id")
    .get(getSkillDetails)
    .delete(isAuthenticatedAdmin, deleteSkill)
    .put(isAuthenticatedAdmin, handleMultiMediaUpload, updateSkill);
module.exports = router;