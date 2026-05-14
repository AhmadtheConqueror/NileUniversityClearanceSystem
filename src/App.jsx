import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import StudentDashboard from "./pages/StudentDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import StaffClearanceDashboard from "./pages/StaffClearanceDashboard";
import ClearanceForm from "./pages/ClearanceForm";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/student/dashboard" element={<StudentDashboard />} />
      <Route path="/staff/dashboard" element={<StaffDashboard />} />
      <Route path="/staff/clearance" element={<StaffClearanceDashboard />} />
      <Route path="/clearance-form" element={<ClearanceForm />} />
    </Routes>
  );
}

export default App;
