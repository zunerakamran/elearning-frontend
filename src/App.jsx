import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CourseList from './pages/courses/CourseList';
import CourseDetail from './pages/courses/CourseDetail';
import CourseForm from './pages/courses/CourseForm';
import ModuleForm from './pages/modules/ModuleForm';
import LessonForm from './pages/lessons/LessonForm';
import LessonViewer from './pages/lessons/LessonViewer';
import QuizForm from './pages/quizzes/QuizForm';
import QuizViewer from './pages/quizzes/QuizViewer';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import CourseStudents from './pages/instructor/CourseStudents';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/courses" />;
  return children;
}

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/courses" element={<CourseList />} />
        <Route path="/courses/create" element={<ProtectedRoute role="instructor"><CourseForm /></ProtectedRoute>} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/courses/:id/edit" element={<ProtectedRoute role="instructor"><CourseForm /></ProtectedRoute>} />
        <Route path="/courses/:courseId/modules/create" element={<ProtectedRoute role="instructor"><ModuleForm /></ProtectedRoute>} />
        <Route path="/courses/:courseId/modules/:moduleId/lessons/create" element={<ProtectedRoute role="instructor"><LessonForm /></ProtectedRoute>} />
        <Route path="/modules/:moduleId/lessons/:lessonId" element={<LessonViewer />} />
        <Route path="/courses/:courseId/lessons/:lessonId/quiz/create" element={<ProtectedRoute role="instructor"><QuizForm /></ProtectedRoute>} />
        <Route path="/lessons/:lessonId/quiz" element={<ProtectedRoute><QuizViewer /></ProtectedRoute>} />
        <Route path="/instructor/dashboard" element={<ProtectedRoute role="instructor"><InstructorDashboard /></ProtectedRoute>} />
        <Route path="/courses/:id/students" element={<ProtectedRoute role="instructor"><CourseStudents /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/courses" />} />
      </Routes>
    </div>
  );
}

export default App;