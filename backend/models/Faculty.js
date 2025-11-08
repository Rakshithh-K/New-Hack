import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  department: { type: String, required: true },
  expertise: [{ type: String }], // Courses they can teach
  max_weekly_hours: { type: Number, default: 20 },
  availability: {
    monday: [{ type: String }],
    tuesday: [{ type: String }],
    wednesday: [{ type: String }],
    thursday: [{ type: String }],
    friday: [{ type: String }],
    saturday: [{ type: String }]
  },
  isVerified: { type: Boolean, default: false }, // Admin verification status
  created_at: { type: Date, default: Date.now },
});


export default mongoose.model("Faculty", facultySchema);
