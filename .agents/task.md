# Admin Panel Tasks

## Backend
- [x] Migration: add status + instructor_status to users
- [x] Migration: add admin fields to courses
- [x] Migration: create categories table
- [x] Model: Category
- [x] Model: User (update fillable)
- [x] Model: Course (update fillable + category relation)
- [x] Middleware: AdminOnly
- [x] Register AdminOnly in bootstrap/app.php
- [x] AdminController (all methods)
- [x] Routes: api.php admin group
- [x] Modify InstructorOnly (allow admin)
- [x] Modify CourseController (status=pending on create)

## Frontend
- [x] AdminLayout.jsx (sidebar layout)
- [x] AdminDashboard.jsx
- [x] AdminUsers.jsx
- [x] AdminInstructors.jsx
- [x] AdminCourses.jsx
- [x] AdminCategories.jsx
- [x] App.jsx (admin routes)
- [x] Navbar.jsx (admin link)
- [x] Login.jsx (admin redirect)
