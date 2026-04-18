/**
 * SYNC-OS SYLLABUS ANALYZER: Visualizes academic progress and course coverage.
 * Tracks completion status and integrates with the OS study-mode layout.
 */
import React, { useEffect } from 'react';
import { CheckCircle2, Circle, Clock, TrendingUp, BookOpen } from 'lucide-react';

export const SyllabusTracker: React.FC = () => {
  const subjects = [
    { name: 'Mathematics', progress: 75, status: 'On Track', topics: ['Calculus', 'Linear Algebra', 'Probability'] },
    { name: 'Physics', progress: 40, status: 'Needs Focus', topics: ['Mechanics', 'Thermodynamics', 'Optics'] },
    { name: 'Computer Science', progress: 90, status: 'Ahead', topics: ['Data Structures', 'Algorithms', 'Web Dev'] },
    { name: 'English Literature', progress: 60, status: 'On Track', topics: ['Shakespeare', 'Modern Poetry', 'Prose'] },
  ];

  useEffect(() => {
    const handleRequestContext = () => {
      const content = subjects.map(s => `${s.name}: ${s.progress}% (${s.status}). Topics: ${s.topics.join(', ')}`).join('\n');
      window.dispatchEvent(new CustomEvent('syncos-context-response', {
        detail: { name: 'Syllabus Tracker', content }
      }));
    };

    window.addEventListener('syncos-request-context', handleRequestContext);
    return () => window.removeEventListener('syncos-request-context', handleRequestContext);
  }, []);

  return (
    <div className="p-6 bg-gray-50 h-full overflow-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Study Progress</h1>
          <p className="text-gray-500">Track your learning journey</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white p-3 rounded-xl shadow-sm border flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><TrendingUp size={20} /></div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Overall</p>
              <p className="text-lg font-bold">66%</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg text-green-600"><Clock size={20} /></div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Study Time</p>
              <p className="text-lg font-bold">12h 45m</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjects.map((sub) => (
          <div key={sub.name} className="bg-white p-5 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg"><BookOpen size={20} className="text-gray-600" /></div>
                <h3 className="font-bold text-gray-800">{sub.name}</h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                sub.status === 'Ahead' ? 'bg-green-100 text-green-700' :
                sub.status === 'Needs Focus' ? 'bg-orange-100 text-orange-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {sub.status}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Progress</span>
                <span className="font-bold">{sub.progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                  style={{ width: `${sub.progress}%` }} 
                />
              </div>
            </div>

            <div className="space-y-2">
              {sub.topics.map((topic, i) => (
                <div key={topic} className="flex items-center gap-2 text-sm text-gray-600">
                  {i === 0 ? <CheckCircle2 size={14} className="text-green-500" /> : <Circle size={14} className="text-gray-300" />}
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
