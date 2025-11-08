import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  createFaculty,
  getFaculty,
  updateFaculty,
  deleteFaculty,
  getPendingFaculty,
  approveFaculty,
  getMyFacultyProfile,
} from "../controllers/facultyController.js";

const router = express.Router();

// Faculty routes
router.route("/")
  .get(protect, getFaculty)
  .post(protect, adminOnly, createFaculty);

// Faculty personal profile route
router.get("/me", protect, getMyFacultyProfile);

// Admin verification routes
router.get("/pending", protect, adminOnly, getPendingFaculty);
router.post("/approve/:facultyId", protect, adminOnly, approveFaculty);

// Update or delete a specific faculty (admin only)
router.route("/:id")
  .put(protect, adminOnly, updateFaculty)
  .delete(protect, adminOnly, deleteFaculty);

export default router;
