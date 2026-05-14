import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  BookOpen, Landmark, Building2, Home, FileText, CheckCircle2,
  Clock, LogOut, UserCircle, Check, Eye, Lock, Unlock,
  Award, Users, Send, GraduationCap, RefreshCw, X, Printer, Camera, Upload
} from "lucide-react";
import { clearAuthUser, getAuthUser, saveAuthUser } from "../authSession";

const API_BASE_URL = (import.meta.env.VITE_CLEARANCE_API_BASE_URL || "http://127.0.0.1:5000").replace(/\/$/, "");

function StudentDashboard() {
  const [notification, setNotification] = useState(null);
  const [clearanceSteps, setClearanceSteps] = useState([]);
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState({ name: "", level: "", dept: "" });
  const [user, setUser] = useState(() => getAuthUser("student_user") || {});
  const [showCertModal, setShowCertModal] = useState(false);
  const [passportPhoto, setPassportPhoto] = useState(() => {
    const storedUser = getAuthUser("student_user");
    return storedUser?.id ? localStorage.getItem("passport_photo_" + storedUser.id) : null;
  });
  const photoInputRef = useRef(null);
  const navigate = useNavigate();

  const fetchStudentData = useCallback(async (studentId) => {
    const activeStudentId = studentId || getAuthUser("student_user")?.id;
    if (!activeStudentId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/student/status/${activeStudentId}?t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await response.json();
      const iconMap = {
        "Bursary": <Landmark className="w-5 h-5" />, "Hostel": <Home className="w-5 h-5" />,
        "Library": <BookOpen className="w-5 h-5" />, "Student Services": <Users className="w-5 h-5" />,
        "Honoris Certification": <Award className="w-5 h-5" />, "Department": <Building2 className="w-5 h-5" />,
        "Academic Division": <FileText className="w-5 h-5" />,
      };
      setClearanceSteps(data.map(step => ({ ...step, icon: iconMap[step.name] || <FileText className="w-5 h-5" /> })));
    } catch (error) { console.error("Error:", error); }
  }, []);

  useEffect(() => {
    const storedUser = getAuthUser("student_user");
    if (!storedUser?.id) {
      navigate("/login?role=student");
      return;
    }

    setUser(storedUser);
    if (storedUser.needsSetup) setShowSetup(true);
    fetchStudentData(storedUser.id);
  }, [navigate, fetchStudentData]);

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE_URL}/api/student/update-profile`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: user.id, ...setupData })
    });
    if (res.ok) {
      setShowSetup(false);
      const updatedUser = { ...user, name: setupData.name, level: setupData.level, dept: setupData.dept, needsSetup: false };
      setUser(updatedUser);
      saveAuthUser("student_user", updatedUser);
      showNotification("Profile updated!");
    }
  };

  const handleInitiateRequest = async (orderIndex, stepName) => {
    const response = await fetch(`${API_BASE_URL}/api/student/request-clearance`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: user.id, order_index: orderIndex })
    });
    if (response.ok) {
      showNotification(`Request sent to ${stepName}!`);
      fetchStudentData();
    }
  };

  const handlePrintCert = () => {
    window.print();
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showNotification("Please upload a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showNotification("Photo must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      setPassportPhoto(dataUrl);
      localStorage.setItem("passport_photo_" + user.id, dataUrl);
      showNotification("Passport photo uploaded!");
    };
    reader.readAsDataURL(file);
  };

  const approvedCount = clearanceSteps.filter((s) => s.status === "approved").length;
  const totalClearanceSteps = clearanceSteps.length || 7;
  const clearanceProgress = Math.round((approvedCount / totalClearanceSteps) * 100);
  const stats = { spent: approvedCount, total: totalClearanceSteps, percent: clearanceProgress };
  const isFullyCleared = clearanceSteps.length > 0 && clearanceSteps.every(s => s.status === "approved");

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-10 relative animate-in fade-in duration-500">
      {/* --- SETUP MODAL --- */}
      {showSetup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Profile Setup</h2>
            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <input required placeholder="Full Name" className="w-full p-4 bg-slate-50 border rounded-xl" onChange={e => setSetupData({ ...setupData, name: e.target.value })} />
              <input required placeholder="Level (e.g. 400)" className="w-full p-4 bg-slate-50 border rounded-xl" onChange={e => setSetupData({ ...setupData, level: e.target.value })} />
              <input required placeholder="Dept (e.g. Computer Science)" className="w-full p-4 bg-slate-50 border rounded-xl" onChange={e => setSetupData({ ...setupData, dept: e.target.value })} />
              <button type="submit" className="w-full bg-blue-900 text-white py-4 rounded-xl font-bold">Start Clearance</button>
            </form>
          </div>
        </div>
      )}

      {/* --- CERTIFICATE MODAL --- */}
      {showCertModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300 print:static print:bg-white print:p-0">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 print:rounded-none print:shadow-none print:max-h-none">
            {/* Modal Action Bar */}
            <div className="flex justify-between items-center p-4 border-b print:hidden">
              <h2 className="font-bold text-lg text-slate-900">Clearance Certificate</h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePrintCert}
                  className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-800 transition-colors"
                >
                  <Printer size={16} /> Print / Save PDF
                </button>
                <button
                  onClick={() => setShowCertModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Certificate Content */}
            <div className="p-8 md:p-12 font-serif border-[10px] border-double border-blue-900 m-4 relative print:border-blue-900 print:m-0">
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
                <Building2 size={450} />
              </div>

              <div className="text-center mb-8 border-b pb-6">
                <h1 className="text-4xl font-black text-blue-900 uppercase">Nile University</h1>
                <p className="font-bold text-slate-600 mt-1">Office of the Registrar</p>
                <h2 className="mt-4 text-2xl font-bold underline">FINAL GRADUATION CLEARANCE</h2>
                <p className="text-xs text-slate-400 mt-2">Issued: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>

              {/* Student Info + Passport Photo */}
              <div className="flex gap-6 mb-8 items-start">
                {/* Passport Photo on Certificate */}
                <div className="flex-shrink-0">
                  {passportPhoto ? (
                    <img
                      src={passportPhoto}
                      alt="Passport"
                      className="w-28 h-36 object-cover border-2 border-slate-300 rounded"
                      style={{ imageRendering: "auto" }}
                    />
                  ) : (
                    <div className="w-28 h-36 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-300 text-center p-2">
                      <Camera size={28} />
                      <span className="text-[9px] mt-1 font-sans">No photo uploaded</span>
                    </div>
                  )}
                </div>
                {/* Info Fields */}
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Full Name</p>
                    <p className="font-bold border-b pb-1">{user.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Matric No.</p>
                    <p className="font-bold border-b pb-1">{user.userId || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Department</p>
                    <p className="font-bold border-b pb-1">{user.dept || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Level</p>
                    <p className="font-bold border-b pb-1">{user.level ? `${user.level} Level` : "N/A"}</p>
                  </div>
                </div>
              </div>

              <table className="w-full border border-slate-300 mb-8 text-sm font-sans">
                <thead>
                  <tr className="bg-slate-100 text-xs font-bold">
                    <th className="border px-4 py-2 text-left">S/N</th>
                    <th className="border px-4 py-2 text-left">Office / Department</th>
                    <th className="border px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clearanceSteps.filter(s => s.status === "approved").map((step, i) => (
                    <tr key={step.id}>
                      <td className="border px-4 py-2">{i + 1}</td>
                      <td className="border px-4 py-2 font-bold uppercase">{step.name}</td>
                      <td className="border px-4 py-2 text-green-700 font-bold">
                        <span className="flex items-center gap-1"><CheckCircle2 size={14} /> CLEARED</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-end mt-10 pt-6 border-t">
                <div className="text-center">
                  <div className="border-t-2 border-slate-800 pt-2 w-48">
                    <p className="text-xs font-bold text-slate-500">Registrar's Signature</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t-2 border-slate-800 pt-2 w-48">
                    <p className="text-xs font-bold text-slate-500">Date</p>
                  </div>
                </div>
              </div>

              <p className="text-center text-[10px] text-slate-400 mt-6">
                Digitally verified by Nile University Registry — {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- NAVIGATION --- */}
      <nav className="bg-white border-b sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold">N</div>
          <h1 className="font-bold text-lg">Nile Clearance</h1>
        </div>
        <button onClick={() => { clearAuthUser("student_user"); navigate("/"); }} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"><LogOut className="w-4 h-4" /> Logout</button>
      </nav>

      {/* --- DASHBOARD CONTENT --- */}
      <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center hover:scale-[1.02] transition-transform duration-300">
            {/* Passport Photo Upload */}
            <div className="relative w-24 h-24 mx-auto mb-4">
              {passportPhoto ? (
                <img
                  src={passportPhoto}
                  alt="Passport"
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 shadow"
                />
              ) : (
                <div className="w-24 h-24 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center border-4 border-blue-100">
                  <UserCircle className="w-14 h-14" />
                </div>
              )}
              <button
                onClick={() => photoInputRef.current?.click()}
                title="Upload passport photo"
                className="absolute bottom-0 right-0 w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors border-2 border-white"
              >
                <Camera size={14} />
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
            <h2 className="font-bold text-xl text-slate-900">{user.name || "Student"}</h2>
            <p className="text-sm text-slate-500 font-medium">{user.userId}</p>
            {!passportPhoto && (
              <button
                onClick={() => photoInputRef.current?.click()}
                className="mt-3 text-xs text-blue-600 font-semibold flex items-center gap-1 mx-auto hover:text-blue-800 transition-colors"
              >
                <Upload size={12} /> Upload Passport Photo
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><GraduationCap size={20} /></div>
              <h3 className="font-bold">Graduation Journey</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-500">{stats.spent} of {stats.total} stages</span>
                <span className="text-amber-600">{stats.percent}% Complete</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${stats.percent}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-end mb-4">
              <div><h2 className="text-xl font-bold text-slate-900">Clearance Progress</h2></div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-blue-900">{clearanceProgress}%</span>
                <button onClick={() => fetchStudentData()} className="text-slate-400 hover:text-blue-700 transition-colors" title="Refresh Status">
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${clearanceProgress}%` }}></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y">
            {clearanceSteps.map((step) => {
              const isLocked = step.status === "locked";
              const isPending = step.status === "pending";
              const isUnlocked = step.status === "unlocked";
              const isRejected = step.status === "rejected";

              return (
                <div key={step.id} className={`p-4 flex items-center justify-between transition-colors ${isLocked ? "bg-slate-50/50" : "hover:bg-slate-50"}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isLocked ? "bg-slate-200 text-slate-400" : step.status === "approved" ? "bg-green-100 text-green-600 scale-110" : isUnlocked ? "bg-blue-600 text-white shadow-lg shadow-blue-200 animate-pulse" : "bg-blue-100 text-blue-600"}`}>
                      {isLocked ? <Lock size={16} /> : step.status === "unlocked" ? <Unlock size={16} /> : step.icon}
                    </div>
                    <div><h4 className={`font-semibold text-sm ${isLocked ? "text-slate-400" : "text-slate-900"}`}>{step.name}</h4></div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isUnlocked && (
                      <button onClick={() => handleInitiateRequest(step.order, step.name)} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 animate-pulse hover:animate-none hover:bg-blue-700 transition-colors"><Send size={12} /> Request Clearance</button>
                    )}
                    {isRejected && (
                      <div className="flex flex-col items-end gap-1">
                        <button onClick={() => handleInitiateRequest(step.order, step.name)} className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-700 transition-colors"><RefreshCw size={12} /> Retry Request</button>
                        {step.comment && <span className="text-[10px] text-red-600 font-bold max-w-[150px] text-right leading-tight">Reason: {step.comment}</span>}
                      </div>
                    )}
                    {isPending && (
                      <span className="text-xs text-amber-600 font-bold flex items-center gap-1"><Clock size={12} /> Pending Review</span>
                    )}
                    {!isRejected && (
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${isLocked ? "bg-slate-50 text-slate-300" : step.status === "approved" ? "bg-green-50 text-green-700 border-green-200" : isUnlocked ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                        {step.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-blue-900 rounded-2xl p-6 shadow-lg text-white flex justify-between items-center hover:shadow-xl transition-shadow">
            <div>
              <h3 className="font-bold text-lg">Final Graduation Certificate</h3>
              {!isFullyCleared && <p className="text-blue-300 text-sm mt-1">Complete all stages to unlock</p>}
            </div>
            <button
              onClick={() => isFullyCleared && setShowCertModal(true)}
              disabled={!isFullyCleared}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${isFullyCleared ? "bg-white text-blue-900 hover:scale-105 cursor-pointer" : "bg-blue-800 text-blue-400 opacity-50 cursor-not-allowed"}`}
            >
              <Eye size={18} /> View Certificate
            </button>
          </div>
        </section>
      </div>

      {notification && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full flex items-center gap-3 text-sm animate-in slide-in-from-bottom-4 shadow-xl z-50">
          <Check className="w-4 h-4 text-green-400" /> {notification}
        </div>
      )}
    </main>
  );
}

export default StudentDashboard;
