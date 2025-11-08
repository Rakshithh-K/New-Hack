import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  generateNaiveTimetable,
  getLatestTimetable,
  getStudentTimetable,
} from "../controllers/timetableController.js";

const router = express.Router();

router.post("/generate", protect, adminOnly, generateNaiveTimetable);
router.get("/latest", protect, getLatestTimetable);
router.get("/student", protect, getStudentTimetable);

export default router;
