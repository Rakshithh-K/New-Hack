import React, { useState, useEffect } from "react";
import axios from "axios";

export default function AdminTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Auto-refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [timetableRes, facultyRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE}/timetable/latest`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_BASE}/faculty`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setTimetable(timetableRes.data.data || []);
      setFaculty(facultyRes.data || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };

  const getFacultyName = (facultyId) => {
    const f = faculty.find(f => f._id === facultyId);
    return f?.user_id?.name || "Unknown";
  };

  const isAvailable = (facultyId, day, timeSlot) => {
    const f = faculty.find(f => f._id === facultyId);
    const dayMap = {"Mon": "Monday", "Tue": "Tuesday", "Wed": "Wednesday", "Thu": "Thursday", "Fri": "Friday"};
    
    return f?.availability?.[dayMap[day]]?.[timeSlot] !== false;
  };

  const getAvailableFaculty = (courseCode, day, timeSlot) => {
    const dayMap = {"Mon": "Monday", "Tue": "Tuesday", "Wed": "Wednesday", "Thu": "Thursday", "Fri": "Friday"};
    return faculty.filter(f => 
      f.expertise?.includes(courseCode) && 
      f.availability?.[dayMap[day]]?.[timeSlot] !== false
    );
  };

  const replaceFaculty = async (slotIndex, newFacultyId) => {
    if (!newFacultyId) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const updatedTimetable = [...timetable];
      
      // Handle new slot creation
      if (slotIndex >= timetable.length) {
        console.log('Creating new slot');
        setTimetable(updatedTimetable);
        setMessage('New class slot created!');
        return;
      }
      
      updatedTimetable[slotIndex].faculty_id = newFacultyId;
      
      console.log('Updating timetable:', { slotIndex, newFacultyId, updatedSlot: updatedTimetable[slotIndex] });
      
      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE}/timetable/update`,
        { data: updatedTimetable },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Update response:', response.data);
      
      // Force immediate update
      setTimetable(updatedTimetable);
      
      // Fetch fresh data to confirm changes
      setTimeout(() => fetchData(), 500);
      
      setMessage(`Faculty replaced successfully! ${getFacultyName(newFacultyId)} assigned.`);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error('Replace faculty error:', err);
      setMessage(`Failed to replace faculty: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const timeSlots = ["09:00-10:00", "10:00-11:00", "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00"];

  return (
    <div className="p-6 bg-white rounded shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-blue-700">
          Admin Timetable - All Faculty
        </h2>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => {
              console.log('Current timetable:', timetable);
              console.log('Current faculty:', faculty);
              setMessage('Check console for debug info');
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Debug
          </button>
        </div>
      </div>
      
      {/* Debug info */}
      <div className="mb-4 p-2 bg-gray-100 rounded text-xs space-y-1">
        <p>Timetable entries: {timetable.length} | Faculty: {faculty.length}</p>
        <p>Sample slot: {JSON.stringify(timetable[0])}</p>
        <p>Sample faculty: {JSON.stringify(faculty[0])}</p>
        <p>Faculty with availability: {faculty.filter(f => f.availability && Object.keys(f.availability).length > 0).length}</p>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('success') 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

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
                  const slot = timetable.find(t => 
                    t.day === day && t.time_slot === timeSlot
                  );
                  
                  if (!slot) {
                    return (
                      <td 
                        key={`${day}-${timeSlot}`} 
                        className="border border-gray-300 p-4 min-w-[200px] h-32 text-center text-gray-400 cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          setSelectedSlot({ day, timeSlot, slot: null, isNew: true });
                          setShowModal(true);
                        }}
                      >
                        <div className="flex items-center justify-center h-full text-lg font-medium">
                          Free - Click to Assign
                        </div>
                      </td>
                    );
                  }

                  const facultyName = getFacultyName(slot.faculty_id);
                  const available = isAvailable(slot.faculty_id, day, timeSlot);
                  const availableFaculty = getAvailableFaculty(slot.course_code, day, timeSlot);
                  const slotIndex = timetable.indexOf(slot);

                  return (
                    <td 
                      key={`${day}-${timeSlot}`} 
                      className={`border border-gray-300 p-4 min-w-[200px] h-32 cursor-pointer hover:bg-blue-50 ${!available ? 'bg-red-50' : ''}`}
                      onClick={() => {
                        setSelectedSlot({ day, timeSlot, slot, slotIndex, isNew: false });
                        setShowModal(true);
                      }}
                    >
                      <div className="text-sm space-y-2">
                        <div className="font-bold text-blue-800 text-base">{slot.course_name || slot.course}</div>
                        <div className={`flex items-center gap-2 text-sm ${
                          available ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <span className="text-lg">{available ? '✓' : '✗'}</span>
                          <span className="font-semibold">{facultyName}</span>
                        </div>
                        <div className="text-gray-600 text-sm">📍 Room: {slot.room_id || slot.room}</div>
                        <div className="text-gray-600 text-sm">👥 Batch: {slot.batch_id}</div>
                        
                        {!available && (
                          <div className="mt-2 p-2 bg-red-100 rounded">
                            <div className="text-red-700 font-bold mb-1 text-xs">⚠️ NEEDS REPLACEMENT</div>
                          </div>
                        )}
                        
                        <div className="text-xs text-blue-600 mt-2">
                          Click to modify
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded">
        <h4 className="font-semibold text-blue-800 mb-2">Admin View Features:</h4>
        <ul className="text-sm space-y-1">
          <li>• Click any slot to assign/change faculty</li>
          <li>• Red background: Faculty unavailable - needs replacement</li>
          <li>• Auto-refreshes every 10 seconds to show latest availability</li>
          <li>• Modal popup for easy faculty selection</li>
        </ul>
      </div>

      {/* Faculty Assignment Modal */}
      {showModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
            <h3 className="text-lg font-semibold mb-4">
              {selectedSlot.isNew ? 'Assign Faculty to Slot' : 'Modify Class Slot'}
            </h3>
            
            <div className="mb-4 p-3 bg-gray-100 rounded">
              <p><strong>Time:</strong> {selectedSlot.day} {selectedSlot.timeSlot}</p>
              {!selectedSlot.isNew && (
                <>
                  <p><strong>Course:</strong> {selectedSlot.slot?.course_name}</p>
                  <p><strong>Current Faculty:</strong> {getFacultyName(selectedSlot.slot?.faculty_id)}</p>
                </>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Faculty:</label>
              <select
                className="w-full border rounded p-2"
                onChange={(e) => {
                  if (e.target.value) {
                    if (selectedSlot.isNew) {
                      const newSlot = {
                        day: selectedSlot.day,
                        time_slot: selectedSlot.timeSlot,
                        faculty_id: e.target.value,
                        course_name: 'New Class',
                        course_code: 'NEW',
                        room_id: 'TBD',
                        batch_id: 'TBD'
                      };
                      const updatedTimetable = [...timetable, newSlot];
                      setTimetable(updatedTimetable);
                      replaceFaculty(updatedTimetable.length - 1, e.target.value);
                    } else {
                      replaceFaculty(selectedSlot.slotIndex, e.target.value);
                    }
                    setShowModal(false);
                    setSelectedSlot(null);
                  }
                }}
                defaultValue=""
              >
                <option value="">Choose faculty...</option>
                {faculty.filter(f => f.user_id?.name).map(f => {
                  const available = isAvailable(f._id, selectedSlot.day, selectedSlot.timeSlot);
                  const hasExpertise = !selectedSlot.isNew && f.expertise?.includes(selectedSlot.slot?.course_code);
                  return (
                    <option key={f._id} value={f._id}>
                      {available ? '✅' : '❌'} {f.user_id?.name}
                      {hasExpertise ? ' (Expert)' : ''}
                      {!available ? ' (Unavailable)' : ''}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-gray-600 mt-1">
                ✅ Available | ❌ Unavailable | (Expert) = Has course expertise
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedSlot(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}