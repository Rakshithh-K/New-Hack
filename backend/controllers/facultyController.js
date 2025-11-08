import Faculty from "../models/Faculty.js";

export const createFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.create(req.body);
    res.status(201).json(faculty);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find()
      .populate("user_id", "name email isApproved")
      .lean();

    // Show only verified faculty or pre-approved mock data
    const visible = faculty
      .filter(f => f.user_id?.isApproved === true)
      .map(f => ({
        ...f,
        displayName: f.name || (f.user_id ? f.user_id.name : 'Unknown'),
        canTeach: f.expertise || [],
        isApproved: f.user_id ? f.user_id.isApproved : true
      }));

    res.json(visible);
  } catch (err) {
    console.error("Get faculty error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getPendingFaculty = async (req, res) => {
  try {
    const pendingFaculty = await Faculty.find()
      .populate("user_id", "name email isApproved facultyId")
      .lean();

    const pending = pendingFaculty
      .filter(f => f.user_id?.isApproved === false)
      .map(f => ({
        _id: f.user_id._id,
        name: f.name || f.user_id.name,
        email: f.user_id.email,
        facultyId: f.user_id.facultyId,
        department: f.department,
        expertise: f.expertise || []
      }));

    res.json(pending);
  } catch (err) {
    console.error("Get pending faculty error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const approveFaculty = async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    const user = await User.findByIdAndUpdate(
      facultyId,
      { isApproved: true },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: "Faculty not found" });
    }
    
    res.json({ message: "Faculty approved successfully", user });
  } catch (err) {
    console.error("Approve faculty error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const updateFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(faculty);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    await Faculty.findByIdAndDelete(req.params.id);
    res.json({ message: "Faculty deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getMyFacultyProfile = async (req, res) => {
  try {
    let faculty = await Faculty.findOne({ user_id: req.user._id });
    if (!faculty) {
      faculty = await Faculty.create({
        user_id: req.user._id,
        department: "Not assigned",
        max_weekly_hours: 20,
        availability: {}
      });
    }
    res.json(faculty);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
