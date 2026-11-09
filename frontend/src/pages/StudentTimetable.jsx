import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function StudentTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/timetable')
      .then((res) => setTimetable(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Group by day
  const byDay = {};
  DAYS.forEach((d) => (byDay[d] = []));
  timetable.forEach((t) => {
    if (byDay[t.day]) byDay[t.day].push(t);
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">My Timetable</h2>
        <p className="text-gray-500">Weekly class schedule.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
          {DAYS.map((day) => (
            <div key={day} className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase">{day}</h3>
              <div className="space-y-2">
                {byDay[day].length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">No classes</p>
                ) : (
                  byDay[day].map((t) => (
                    <div key={t.id} className="p-2 bg-green-50 rounded border border-green-100 text-sm">
                      <div className="font-medium text-gray-800">{t.course_code || t.course_name || 'Class'}</div>
                      <div className="text-xs text-gray-500">{t.time}</div>
                      {t.room && <div className="text-xs text-gray-500">Room: {t.room}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
