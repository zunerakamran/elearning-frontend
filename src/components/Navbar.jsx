import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            to={user ? (user.role === 'instructor' ? '/instructor/dashboard' : '/dashboard') : '/'}
            className="text-xl font-bold text-blue-600"
          >
            📚 ELearn
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/courses"
              className="text-gray-600 hover:text-blue-600 text-sm font-medium transition"
            >
              Browse Courses
            </Link>

            {user ? (
              <>
                {user.role === 'instructor' ? (
                  <>
                    <Link
                      to="/instructor/dashboard"
                      className="text-gray-600 hover:text-blue-600 text-sm font-medium transition"
                    >
                      My Dashboard
                    </Link>
                    <Link
                      to="/courses/create"
                      className="text-gray-600 hover:text-blue-600 text-sm font-medium transition"
                    >
                      Create Course
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/dashboard"
                    className="text-gray-600 hover:text-blue-600 text-sm font-medium transition"
                  >
                    My Learning
                  </Link>
                )}

                {/* User menu */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full text-sm font-medium transition"
                  >
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    {user.name.split(' ')[0]}
                    <span className="text-gray-400">▾</span>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-blue-600 text-sm font-medium"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-blue-700 transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded text-gray-600 hover:bg-gray-100"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t py-3 space-y-1">
            <Link
              to="/courses"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
            >
              Browse Courses
            </Link>

            {user ? (
              <>
                {user.role === 'instructor' ? (
                  <>
                    <Link
                      to="/instructor/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                    >
                      My Dashboard
                    </Link>
                    <Link
                      to="/courses/create"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                    >
                      Create Course
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                  >
                    My Learning
                  </Link>
                )}
                <div className="px-4 py-2 border-t mt-2">
                  <p className="text-xs text-gray-400 mb-2">{user.name} · {user.role}</p>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Log out
                  </button>
                </div>
              </>
            ) : (
              <div className="px-4 py-2 flex gap-3">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-gray-700 hover:text-blue-600"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}