const express = require("express");
const {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  getAllEmployers,
  getSingleEmployer,
  getAllEmployees,
  getSingleEmployee,
} = require("../controllers/adminController");
const { isAuthenticatedAdmin } = require("../middleware/auth");
const router = express.Router();

//admin register api
router.route("/register/admin").post(registerAdmin);
//admin login api
router.route("/login/admin").post(loginAdmin);
//admin logout api
router.route("/logout/admin").get(logoutAdmin);
//admin get all employers api
router.route("/admin/allEmployers").get(isAuthenticatedAdmin, getAllEmployers);
//admin get single employer api
router
  .route("/admin/employer/:id")
  .get(isAuthenticatedAdmin, getSingleEmployer);
//admin get all employees api
router.route("/admin/allEmployees").get(isAuthenticatedAdmin, getAllEmployees);
//admin get single employee api
router
  .route("/admin/employee/:id")
  .get(isAuthenticatedAdmin, getSingleEmployee);

module.exports = router;
