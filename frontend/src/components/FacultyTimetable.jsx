import React, { useState, useEffect } from "react";
import axios from "axios";

export default function FacultyTimetable() {
  const [myTimetable, setMyTimetable] = useState([]);
  const [facultyProfile, setFacultyProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMyTimetable();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMyTimetable, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMyTimetable = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Get faculty profile first
      const profileRes = await axios.get(
        `${import.meta.env.VITE_API_BASE}/faculty/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFacultyProfile(profileRes.data);
      console.log('Faculty profile:', profileRes.data);

      // Get full timetable and filter for this faculty
      const timetableRes = await axios.get(
        `${import.meta.env.VITE_API_BASE}/timetable/latest`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const allTimetable = timetableRes.data.data || [];
      console.log('All timetable:', allTimetable);
      
      const myClasses = allTimetable.filter(slot => {
        console.log('Comparing:', slot.faculty_id, 'with', profileRes.data._id);
        return slot.faculty_id === profileRes.data._id;
      });
      
      console.log('My classes:', myClasses);
      setMyTimetable(myClasses);
    } catch (err) {
      console.error("Failed to fetch my timetable:", err);
    }
  };

  const isAvailable = (day, timeSlot) => {
    const dayMap = {"Mon": "Monday", "Tue": "Tuesday", "Wed": "Wednesday", "Thu": "Thursday", "Fri": "Friday"};
    return facultyProfile?.availability?.[dayMap[day]]?.[timeSlot] !== false;
  };

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const timeSlots = ["09:00-10:00", "10:00-11:00", "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00"];

  return (
    <div className="p-6 bg-white rounded shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-blue-700">
          My Teaching Schedule
        </h2>
        <button
          onClick={fetchMyTimetable}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Debug info */}
      <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
        <p><strong>Faculty ID:</strong> {facultyProfile?._id || 'Not found'}</p>
        <p><strong>Total Classes:</strong> {myTimetable.length}</p>
        <p><strong>Sample class:</strong> {JSON.stringify(myTimetable[0])}</p>
      </div>

      <div className="mb-4 p-3 bg-blue-50 rounded">
        <p className="text-sm text-blue-800">
          <strong>Total Classes:</strong> {myTimetable.length} | 
          <strong> Unavailable Slots:</strong> {myTimetable.filter(slot => !isAvailable(slot.day, slot.time_slot)).length}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2 bg-gray-100">Time</th>
              {days.map(day => (
                <th key={day} className="border border-gray-300 p-2 bg-gray-100">
                  {day === "Mon" ? "Monday" : day === "Tue" ? "Tuesday" : day === "Wed" ? "Wednesday" : day === "Thu" ? "Thursday" : "Friday"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(timeSlot => (
              <tr key={timeSlot}>
                <td className="border border-gray-300 p-2 font-medium bg-gray-50">
                  {timeSlot}
                </td>
                {days.map(day => {
                  const mySlot = myTimetable.find(t => 
                    t.day === day && t.time_slot === timeSlot
                  );
                  
                  if (!mySlot) {
                    return (
                      <td key={`${day}-${timeSlot}`} className="border border-gray-300 p-2 text-center text-gray-400">
                        Free
                      </td>
                    );
                  }

                  const available = isAvailable(day, timeSlot);

                  return (
                    <td key={`${day}-${timeSlot}`} className={`border border-gray-300 p-2 ${!available ? 'bg-yellow-50' : 'bg-green-50'}`}>
                      <div className="text-xs space-y-1">
                        <div className="font-semibold">{mySlot.course_name || mySlot.course}</div>
                        <div className={`flex items-center gap-1 ${
                          available ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          <span>{available ? '✓' : '⚠️'}</span>
                          <span className="font-medium">
                            {available ? 'Available' : 'Marked Unavailable'}
                          </span>
                        </div>
                        <div className="text-gray-600">Room: {mySlot.room_id || mySlot.room}</div>
                        <div className="text-gray-600">Batch: {mySlot.batch_id}</div>
                        
                        {!available && (
                          <div className="mt-1 p-1 bg-orange-100 rounded">
                            <div className="text-orange-700 text-xs font-medium">
                              Admin will assign replacement
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-green-50 rounded">
        <h4 className="font-semibold text-green-800 mb-2">Faculty View:</h4>
        <ul className="text-sm space-y-1">
          <li>• Green background: You are available for this class</li>
          <li>• Yellow background: You marked unavailable - admin will find replacement</li>
          <li>• Update your availability using the form above to change your schedule</li>
        </ul>
      </div>
    </div>
  );
}