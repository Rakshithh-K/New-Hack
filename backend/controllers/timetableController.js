import Course from "../models/Course.js";
import Faculty from "../models/Faculty.js";
import Room from "../models/Room.js";
import Timetable from "../models/Timetable.js";

// 9-5 time slots (8 hours, no breaks)
const timeSlots = [
  "09:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "12:00-13:00",
  "13:00-14:00",
  "14:00-15:00",
  "15:00-16:00",
  "16:00-17:00",
];

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// AI-powered timetable generation for student courses
export const generateStudentTimetable = async (studentCourses) => {
  try {
    console.log('🎯 Generating timetable for courses:', studentCourses);
    
    const courses = await Course.find({ _id: { $in: studentCourses } });
    const faculty = await Faculty.find();
    const rooms = await Room.find();

    console.log('📊 Data available - Courses:', courses.length, 'Faculty:', faculty.length, 'Rooms:', rooms.length);
    console.log('👨‍🏫 Faculty names:', faculty.map(f => f.name || f.department).join(', '));

    if (!courses.length || !faculty.length || !rooms.length) {
      throw new Error(`Missing data - Courses: ${courses.length}, Faculty: ${faculty.length}, Rooms: ${rooms.length}`);
    }

    const timetable = [];
    const usedSlots = new Set();

    for (const course of courses) {
      // Find faculty with matching expertise
      const availableFaculty = faculty.filter(f => 
        f.expertise.some(exp => 
          course.title.toLowerCase().includes(exp.toLowerCase()) ||
          exp.toLowerCase().includes(course.title.toLowerCase())
        )
      );

      const selectedFaculty = availableFaculty.length > 0 
        ? availableFaculty[0] 
        : faculty[Math.floor(Math.random() * faculty.length)];

      // Find available time slot
      let assigned = false;
      for (const day of days) {
        const dayKey = day.toLowerCase();
        const facultyAvailability = selectedFaculty.availability[dayKey] || [];
        
        for (const timeSlot of facultyAvailability) {
          const slotKey = `${day}-${timeSlot}`;
          if (!usedSlots.has(slotKey)) {
            const room = rooms[Math.floor(Math.random() * rooms.length)];
            
            timetable.push({
              course: course.title,
              faculty: selectedFaculty.name || selectedFaculty.department || 'Faculty',
              room: room.name,
              day: day,
              time: timeSlot
            });
            
            usedSlots.add(slotKey);
            assigned = true;
            break;
          }
        }
        if (assigned) break;
      }

      // Fallback if no slot found
      if (!assigned) {
        const fallbackDay = days[Math.floor(Math.random() * days.length)];
        const fallbackTime = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        
        timetable.push({
          course: course.title,
          faculty: selectedFaculty.name || selectedFaculty.department || 'Faculty',
          room: room.name,
          day: fallbackDay,
          time: fallbackTime
        });
      }
    }

    return timetable;
  } catch (error) {
    console.error('Timetable generation error:', error);
    throw error;
  }
};

export const generateNaiveTimetable = async (req, res) => {
  try {
    const courses = await Course.find();
    const timetable = await generateStudentTimetable(courses.map(c => c._id));

    const saved = await Timetable.create({
      version_name: `v${Date.now()}`,
      data: timetable,
    });

    res.json({
      message: "AI timetable generated successfully",
      totalSessions: timetable.length,
      timetable: saved.data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Generation failed", error: err.message });
  }
};

export const getLatestTimetable = async (req, res) => {
  const latest = await Timetable.findOne().sort({ created_at: -1 });
  if (!latest) return res.status(404).json({ message: "No timetable found" });
  res.json({ data: latest.data });
};

// Generate and save individual student timetable
export const generateAndSaveStudentTimetable = async (studentId, courseIds) => {
  try {
    const courses = await Course.find({ _id: { $in: courseIds } });
    const faculty = await Faculty.find();
    const rooms = await Room.find();
    
    if (!courses.length || !faculty.length || !rooms.length) {
      throw new Error(`Missing data - Courses: ${courses.length}, Faculty: ${faculty.length}, Rooms: ${rooms.length}`);
    }

    // Get existing timetables to check faculty availability
    const existingTimetables = await Timetable.find({});
    const occupiedSlots = new Map();
    
    // Track occupied faculty slots
    existingTimetables.forEach(tt => {
      tt.data.forEach(session => {
        const key = `${session.faculty}-${session.day}-${session.time}`;
        occupiedSlots.set(key, true);
      });
    });

    const timetable = [];
    
    for (const course of courses) {
      let assigned = false;
      
      // Find faculty with matching expertise
      const availableFaculty = faculty.filter(f => 
        f.expertise.some(exp => 
          course.title.toLowerCase().includes(exp.toLowerCase()) ||
          exp.toLowerCase().includes(course.title.toLowerCase())
        )
      );

      const facultyToTry = availableFaculty.length > 0 ? availableFaculty : faculty;
      
      for (const selectedFaculty of facultyToTry) {
        if (assigned) break;
        
        console.log(`🔍 Trying faculty: ${selectedFaculty.name || selectedFaculty.department}`);
        
        // Check faculty availability
        for (const day of days) {
          if (assigned) break;
          const dayKey = day.toLowerCase();
          const facultyAvailability = selectedFaculty.availability[dayKey] || [];
          
          for (const timeSlot of facultyAvailability) {
            const facultySlotKey = `${selectedFaculty.name}-${day}-${timeSlot}`;
            
            if (!occupiedSlots.has(facultySlotKey)) {
              const room = rooms[Math.floor(Math.random() * rooms.length)];
              
              const facultyName = selectedFaculty.name || selectedFaculty.department || 'Faculty';
              
              timetable.push({
                course: course.title,
                faculty: facultyName,
                room: room.name,
                day: day,
                time: timeSlot
              });
              
              // Mark this slot as occupied
              occupiedSlots.set(facultySlotKey, true);
              console.log(`✅ Assigned: ${course.title} -> ${facultyName} -> ${day} ${timeSlot}`);
              assigned = true;
              break;
            } else {
              console.log(`❌ Slot occupied: ${facultyName} -> ${day} ${timeSlot}`);
            }
          }
        }
      }
      
      // Fallback if no available slot found
      if (!assigned) {
        const fallbackFaculty = faculty[0];
        const fallbackDay = days[Math.floor(Math.random() * days.length)];
        const fallbackTime = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        
        const facultyName = fallbackFaculty.name || fallbackFaculty.department || 'Faculty';
        
        timetable.push({
          course: course.title,
          faculty: facultyName,
          room: room.name,
          day: fallbackDay,
          time: fallbackTime
        });
      }
    }

    // Save student timetable
    await Timetable.findOneAndUpdate(
      { student_id: studentId },
      {
        student_id: studentId,
        version_name: `student_${studentId}_${Date.now()}`,
        data: timetable
      },
      { upsert: true, new: true }
    );

    return timetable;
  } catch (error) {
    console.error('Timetable generation error:', error);
    throw error;
  }
};

export const getStudentTimetable = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get saved timetable for this student
    const savedTimetable = await Timetable.findOne({ student_id: userId });
    
    if (!savedTimetable || !savedTimetable.data.length) {
      return res.json([]);
    }
    
    // Format for frontend display
    const dayMapping = {
      'Mon': 'monday',
      'Tue': 'tuesday', 
      'Wed': 'wednesday',
      'Thu': 'thursday',
      'Fri': 'friday',
      'Sat': 'saturday'
    };
    
    const formattedTimetable = timeSlots.map(time => {
      const slot = { time };
      days.forEach(day => {
        const dayKey = dayMapping[day];
        const session = savedTimetable.data.find(t => t.day === day && t.time === time);
        slot[dayKey] = session ? `${session.course} (${session.faculty})` : null;
      });
      return slot;
    });

    res.json(formattedTimetable);
  } catch (error) {
    console.error('Student timetable error:', error);
    res.status(500).json({ message: error.message });
  }
};

