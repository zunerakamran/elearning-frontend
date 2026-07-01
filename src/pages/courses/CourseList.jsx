import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/courses')
      .then((res) => setCourses(res.data))
      .catch(() => setError('Failed to load courses.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading courses...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">All Courses</h1>
          {user?.role === 'instructor' && (
            <Link
              to="/courses/create"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + Create Course
            </Link>
          )}
        </div>

        {courses.length === 0 ? (
          <p className="text-gray-500">No courses available yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
              >
                <span className="text-xs uppercase font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {course.level}
                </span>
                <h2 className="text-xl font-semibold mt-3 mb-2">{course.title}</h2>
                <p className="text-gray-500 text-sm line-clamp-2">{course.description}</p>
                <p className="text-sm text-gray-400 mt-4">By {course.instructor?.name}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}