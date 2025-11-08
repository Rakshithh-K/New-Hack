import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  createFaculty,
  getFaculty,
  updateFaculty,
  deleteFaculty,
  getPendingFaculty,
  approveFaculty,
} from "../controllers/facultyController.js";

const router = express.Router();

router.route("/")
  .get(protect, getFaculty)
  .post(protect, adminOnly, createFaculty);

router.route("/:id")
  .put(protect, adminOnly, updateFaculty)
  .delete(protect, adminOnly, deleteFaculty);

// Admin verification routes
router.get("/pending", protect, adminOnly, getPendingFaculty);
router.post("/approve/:facultyId", protect, adminOnly, approveFaculty);

export default router;
