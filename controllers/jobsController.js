const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const sendEmail = require("../utils/sendEmail.js");
const Emp = require("../models/employee.js");
const Employeer = require("../models/employeer.js");
const Jobs = require("../models/jobs.js");
const ApiFeatures = require("../utils/apifeatures.js");
const mongoose = require("mongoose");

//create JOB
exports.createJob = catchAsyncErrors(async (req, res, next) => {
  const {
    title,
    description,
    requirements,
    requiredSkills,
    responsibilities,
    locationType,
    employmentType,
    employmentDuration,
    salary,
    applicationDeadline,
    extraBenefits,
    experience,
    location,
  } = req.body;

  const userId = req.user.id;
  const user = req.user;

  if (
    !title ||
    !description ||
    !requirements ||
    !Array.isArray(requiredSkills) ||
    !responsibilities ||
    !locationType ||
    !employmentType ||
    !employmentDuration ||
    !salary ||
    !applicationDeadline ||
    !extraBenefits ||
    !experience ||
    !location
  ) {
    return next(new ErrorHandler("Please Enter All Fields", 400));
  }

  job = await Jobs.create({
    title,
    description,
    requirements,
    requiredSkills,
    responsibilities,
    locationType,
    employmentType,
    companyDetails: {
      companyName: user.companyDetails[0].companyName,
      industryType: user.companyDetails[0].industryType,
      websiteLink: user.companyDetails[0].websiteLink,
      bio: user.companyDetails[0].bio,
      logo: user.company_avatar.url,
    },
    employmentDuration,
    salary,
    postedBy: userId,
    applicationDeadline,
    extraBenefits,
    experience,
    location,
  });

  res.status(201).json({
    success: true,
    message: `You have Successfully Created ${employmentType} Opportunity`,
  });
});

//get all job--all user
exports.getAllJob = catchAsyncErrors(async (req, res, next) => {
  const resultPerPage = 15;
  const jobsCount = await Jobs.countDocuments();

  const apiFeature = new ApiFeatures(
    Jobs.find().sort({
      postedAt: -1,
    }),
    req.query,
  )
    .search()
    .filter();

  let jobs = await apiFeature.query;

  let filteredJobsCount = jobs.length;

  apiFeature.pagination(resultPerPage);

  jobs = await apiFeature.query;

  res.status(200).json({
    success: true,
    jobsCount,
    jobs,
    resultPerPage,
    filteredJobsCount,
  });
});

//get a single job--all user
exports.getSingleJob = catchAsyncErrors(async (req, res, next) => {
  const jobs = await Jobs.findById(req.params.id);

  if (!jobs) {
    return next(new ErrorHandler("Jobs Doesn't exist with this ID", 404));
  }

  res.status(200).json({
    success: true,
    jobs,
  });
});

// Delete Job--those who hav created they can only delete
exports.deletejob = catchAsyncErrors(async (req, res, next) => {
  const job = await Jobs.findOne({
    _id: req.params.id,
    postedBy: req.user.id,
  });

  if (!job) {
    return next(new ErrorHandler("Not found or you are not authorized", 404));
  }

  // const userId = req.user.id;
  // const created = job.postedBy;

  // if (userId == created) {
  await job.remove();

  res.status(200).json({
    success: true,
    message: "Deleted Successfully",
  });
  // } else {
  //   return next(new ErrorHandler("You cannot delete this JOb", 404));
  // }
});

//update job who has created them
exports.updateJob = catchAsyncErrors(async (req, res, next) => {
  const {
    title,
    description,
    requirements,
    requiredSkills,
    responsibilities,
    locationType,
    employmentType,
    employmentDuration,
    salary,
    applicationDeadline,
    status,
    extraBenefits,
    experience,
    location,
  } = req.body;
  const jobs = await Jobs.findOne({
    _id: req.params.id,
    postedBy: req.user.id,
  });

  if (!jobs) {
    return next(new ErrorHandler("Not found or you are not authorized", 404));
  }

  if (title) jobs.title = title;
  if (description) jobs.description = description;
  if (requirements) jobs.requirements = requirements;
  if (requiredSkills && Array.isArray(requiredSkills))
    jobs.requiredSkills = requiredSkills;
  if (responsibilities) jobs.responsibilities = responsibilities;
  if (locationType) jobs.locationType = locationType;
  if (employmentType) jobs.employmentType = employmentType;
  if (employmentDuration) jobs.employmentDuration = employmentDuration;
  if (salary) jobs.salary = salary;
  if (applicationDeadline) jobs.applicationDeadline = applicationDeadline;
  if (status) jobs.status = status;
  if (extraBenefits) jobs.extraBenefits = extraBenefits;
  if (experience) jobs.experience = experience;
  if (location) jobs.location = location;

  await jobs.save();

  res.status(200).json({
    success: true,
    message: `${jobs.title} Job has been updated`,
  });
});

//get all employer job
exports.getAllEmployeerJob = catchAsyncErrors(async (req, res, next) => {
  const resultPerPage = 15;
  const jobsCount = await Jobs.countDocuments({ postedBy: req.user.id });

  const apiFeature = new ApiFeatures(
    Jobs.find({ postedBy: req.user.id }),
    req.query,
  )
    .search()
    .filter();

  let jobs = await apiFeature.query;

  let filteredJobsCount = jobs.length;

  apiFeature.pagination(resultPerPage);

  jobs = await apiFeature.query;

  res.status(200).json({
    success: true,
    jobsCount,
    jobs,
    resultPerPage,
    filteredJobsCount,
  });
});

//Employee Apply for JOB
exports.ApplyJob = catchAsyncErrors(async (req, res, next) => {
  const jobs = await Jobs.findById(req.params.id).populate(
    "postedBy",
    "name email",
  );

  const employer = jobs.postedBy.email;

  const userId = req.user.id;
  const user = req.user;

  if (!jobs) {
    return next(new ErrorHandler("Jobs Doesn't exist with this ID", 404));
  }

  // Check if the job is still open
  if (jobs.status === "Closed") {
    return next(new ErrorHandler("Job is closed", 404));
  }

  // Check if the user has already applied
  if (
    jobs.applicants.find(
      (applicant) => applicant.employee.toString() === userId,
    )
  ) {
    return next(new ErrorHandler("You have already applied for the job", 404));
  }

  // Add the user's ID to the applicants array
  jobs.applicants.push({
    employee: userId,
  });

  // Save the job document
  await jobs.save();

  const emailMessage = `Dear ${user.full_name},

Thank you for choosing Carrer Hub! 🏆

You Have Successfully Applied for ${jobs.title} for ${jobs.employmentType} Position

Thank you for your trust in Carrer Hub.

Best regards,

Carrer Hub 🏅
    `;

  await sendEmail(
    user.email,
    "Application Successfully Received",
    emailMessage,
  );

  const emailMessage2 = `Dear ${user.full_name},

Thank you for choosing Carrer Hub! 🏆

You Have Received a New Application  for ${jobs.title} for ${jobs.employmentType} Position

Thank you for your trust in Carrer Hub.

Best regards,

Carrer Hub 🏅
    `;

  await sendEmail(employer, "New Application Received", emailMessage2);

  res.status(200).json({
    success: true,
    message: "Successfully Applied",
  });
});

//get all employee job
exports.getAllEmployeeJob = catchAsyncErrors(async (req, res, next) => {
  const resultPerPage = 15;
  const objectId = mongoose.Types.ObjectId(req.user.id);

  const jobsCount = await Jobs.countDocuments({
    applicants: {
      $elemMatch: {
        employee: objectId,
      },
    },
  });

  const apiFeature = new ApiFeatures(
    Jobs.find({
      applicants: {
        $elemMatch: {
          employee: objectId,
        },
      },
    }),
    req.query,
  )
    .search()
    .filter();

  let jobs = await apiFeature.query;

  let filteredJobsCount = jobs.length;

  apiFeature.pagination(resultPerPage);

  jobs = await apiFeature.query;

  res.status(200).json({
    success: true,
    jobsCount,
    jobs,
    resultPerPage,
    filteredJobsCount,
  });
});

//withdraw application
exports.withdrawApplication = catchAsyncErrors(async (req, res, next) => {
  const jobs = await Jobs.findById(req.params.id);
  const userId = req.user.id;

  if (!jobs) {
    return next(new ErrorHandler("Jobs Doesn't exist with this ID", 404));
  }

  // Check if the user has already applied
  if (
    !jobs.applicants.find(
      (applicant) => applicant.employee.toString() === userId,
    )
  ) {
    return next(new ErrorHandler("You have not  applied for the job", 404));
  }

  // Remove the user's ID from the applicants array
  jobs.applicants = jobs.applicants.filter(
    (applicant) => applicant.employee.toString() !== userId,
  );

  // Save the updated job document
  await jobs.save();

  res.status(200).json({
    success: true,
    message: "You have withdraw your application",
  });
});

//get a employee details
exports.getSingleEmployee = catchAsyncErrors(async (req, res, next) => {
  const emp = await Emp.findById(req.params.id);

  if (!emp) {
    return next(new ErrorHandler("Employee Doesn't exist with this ID", 404));
  }

  res.status(200).json({
    success: true,
    emp,
  });
});

exports.manageAppliedJobs = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;
  const { jobId, applicantId, status } = req.body;
  const job = await Jobs.findById(jobId);
  if (!job.postedBy.toString() === userId) {
    return next(new ErrorHandler("You have not created this job!", 404));
  }
  let applicationStatus = job.applicants.find(
    (applicant) => applicant.employee.toString() === applicantId,
  );
  if (!applicationStatus) {
    return next(new ErrorHandler("User has not applied for this job!", 404));
  }
  applicationStatus.status = status;
  job.save();

  res.status(200).json({
    success: true,
    message: `Job status has been changed to ${status}!`,
  });
});

exports.jobIsViewed = catchAsyncErrors(async (req, res, next) => {
  const { jobId, applicantId } = req.body;
  const userId = req.user.id;
  const job = await Jobs.findById(jobId);
  if (!job.postedBy.toString() === userId) {
    return next(new ErrorHandler("You have not created this job!", 404));
  }

  const isApplied = job.applicants.find(
    (applicant) => applicant.employee.toString() === applicantId,
  );

  if (!isApplied) {
    return next(
      new ErrorHandler("This user with has not applied for this job!", 404),
    );
  }
  isApplied.isViewed = true;
  await job.save();
  res.status(200).json({
    success: true,
    message: "Jobs has been viwed by Employer!",
  });
});

// exports.searchJob = catchAsyncErrors(async (req, res, next) => {
//   try {
//     const { query: searchQuery = "", jobType } = req.query;

//     // Construct search criteria
//     let searchCriteria = {};

//     if (searchQuery) {
//       searchCriteria.$text = { $search: searchQuery };
//     }

//     if (jobType) {
//       searchCriteria.employmentType = jobType;
//     }

//     // Find jobs matching the criteria
//     const jobs = await Jobs.find(searchCriteria);

//     // Handle no jobs found
//     if (jobs.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No jobs found for the given search query.",
//       });
//     }

//     // Send response with found jobs
//     res.status(200).json({
//       success: true,
//       jobs,
//     });
//   } catch (error) {
//     console.error(error);
//     return next(
//       new ErrorHandler("An error occurred while searching for jobs", 500)
//     );
//   }
// });
