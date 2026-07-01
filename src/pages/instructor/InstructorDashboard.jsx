import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function InstructorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/my-courses')
      .then((res) => setCourses(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Instructor Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">{user?.name} · {user?.email}</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/courses/create"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            >
              + New Course
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
            >
              Log out
            </button>
          </div>
        </div>

        {/* My Courses */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">My Courses</h2>

          {loading ? (
            <p className="text-gray-400">Loading your courses...</p>
          ) : courses.length === 0 ? (
            <div>
              <p className="text-gray-500 mb-3">You haven't created any courses yet.</p>
              <Link
                to="/courses/create"
                className="text-blue-600 hover:underline text-sm"
              >
                Create your first course →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{course.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        course.published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {course.published ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-xs uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                        {course.level}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {course.enrollments_count} student{course.enrollments_count !== 1 ? 's' : ''} enrolled
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Link
                      to={`/courses/${course.id}/students`}
                      className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200 text-sm"
                    >
                      View Students
                    </Link>
                    <Link
                      to={`/courses/${course.id}`}
                      className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 text-sm"
                    >
                      View Course
                    </Link>
                    <Link
                      to={`/courses/${course.id}/edit`}
                      className="bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded hover:bg-yellow-100 text-sm"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}