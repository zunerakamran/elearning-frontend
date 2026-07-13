import { Routes, Route, Navigate } from 'react-router-dom';
import EditProfile from './pages/EditProfile';
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
import CourseLessons from './pages/instructor/CourseLessons';
import AssignmentForm from './pages/assignments/AssignmentForm';
import AssignmentDetail from './pages/assignments/AssignmentDetail';
import CourseReport from './pages/instructor/CourseReport';
import MyCertificates from './pages/student/MyCertificates';
import CertificateView from './pages/student/CertificateView';
import CourseCertificates from './pages/instructor/CourseCertificates';
import CourseReviews from './pages/instructor/CourseReviews';
import ChatPage from './pages/chat/ChatPage';
import OTPVerification from './pages/OTPVerification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

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
        <Route path="/verify-otp" element={<OTPVerification />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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
        <Route path="/courses/:id/lessons" element={<ProtectedRoute role="instructor"><CourseLessons /></ProtectedRoute>} />
        <Route path="/courses/:id/students" element={<ProtectedRoute role="instructor"><CourseStudents /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/courses" />} />
        <Route
          path="/courses/:courseId/assignments/create"
          element={
            <ProtectedRoute role="instructor">
              <AssignmentForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/assignments/:assignmentId"
          element={
            <ProtectedRoute>
              <AssignmentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:id/report"
          element={
            <ProtectedRoute role="instructor">
              <CourseReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-certificates"
          element={<ProtectedRoute><MyCertificates /></ProtectedRoute>}
        />
        <Route
          path="/my-certificates/:id"
          element={<ProtectedRoute><CertificateView /></ProtectedRoute>}
        />
        <Route
          path="/courses/:id/certificates"
          element={<ProtectedRoute role="instructor"><CourseCertificates /></ProtectedRoute>}
        />
        <Route
          path="/courses/:id/reviews"
          element={<ProtectedRoute role="instructor"><CourseReviews /></ProtectedRoute>}
        />
        <Route
          path="/profile/edit"
          element={<ProtectedRoute><EditProfile /></ProtectedRoute>}
        />
        <Route
          path="/chat"
          element={<ProtectedRoute><ChatPage /></ProtectedRoute>}
        />
      </Routes>
    </div>
  );
}

export default App;