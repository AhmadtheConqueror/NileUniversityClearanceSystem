import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, LogOut, CheckCircle2, XCircle, UserCheck, Clock, Building2, AlertTriangle, Info, Eye, FileText, RefreshCw, X } from "lucide-react";
import { clearAuthUser, getAuthUser } from "../authSession";

const API_BASE_URL = (import.meta.env.VITE_CLEARANCE_API_BASE_URL || "http://127.0.0.1:5000").replace(/\/$/, "");

function StaffDashboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [requests, setRequests] = useState([]);

  // Modals
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  // New Clearance Pass Modal
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [selectedStudentPass, setSelectedStudentPass] = useState(null);

  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedNoteData, setSelectedNoteData] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchRequests = useCallback(async (department) => {
    const activeDepartment = department || getAuthUser("staff_user")?.department;
    if (!activeDepartment) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/staff/requests?department=${encodeURIComponent(activeDepartment)}&t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await response.json();
      setRequests(data);
    } catch (error) { console.error("Error:", error); }
  }, []);

  useEffect(() => {
    const storedUser = getAuthUser("staff_user");
    if (!storedUser?.id) {
      navigate("/login?role=staff");
      return;
    }

    fetchRequests(storedUser.department);
  }, [navigate, fetchRequests]);

  const fetchStudentPass = async (studentId, studentName, matric) => {
    try {
      // Identify the student ID from the request object. 
      // The API returns 'id' as the REQUEST ID, but we need the STUDENT USER ID to fetch status.
      // Wait, the API I wrote earlier (get_staff_requests) returns "matric" which is the user_id string (NU/...).
      // But /api/student/status/<int:student_id> expects the database PRIMARY KEY id.
      // Let's modify the frontend to use a robust way or fix the backend.
      // Actually, let's look at `get_staff_requests` in app.py. It returns `id` (request id).
      // We need the student's DB ID to call `get_status`.
      // I'll assume for now I can't easily get the int ID without changing backend, 
      // OR I can try to fetch by matric if I update backend? 
      // NO, wait. `req.student_id` is available in `ClearanceRequest` in backend.
      // Let's check `app.py` again.
      // `get_staff_requests` returns `id` (request id), `name`, `matric`, `office`, etc.
      // It DOES NOT return student_db_id. This is a blocker.

      // QUICK FIX: I will use the `matric` to identify them visually, 
      // BUT to get their status I need their ID.
      // Let's see if I can simply pass the `matric` (user_id) to `get_status`?
      // No, `get_status` takes `<int:student_id>`.

      // WORKAROUND: I will add `student_db_id` to the `/api/staff/requests` response in `app.py` first!
      // Better yet, I'll do that in a separate tool call to ensure it works.
      // For now, I will write the Frontend assuming `req.student_db_id` exists.

      const response = await fetch(`${API_BASE_URL}/api/student/status/${studentId}?t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await response.json();
      setSelectedStudentPass({ name: studentName, matric: matric, steps: data });
      setIsPassModalOpen(true);
    } catch (error) { console.error("Error fetching pass:", error); }
  };

  const confirmApprove = async () => {
    const response = await fetch(`${API_BASE_URL}/api/staff/approve`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedRequestId }),
    });
    if (response.ok) { setIsApproveModalOpen(false); fetchRequests(); }
  };

  const submitRejection = async () => {
    const response = await fetch(`${API_BASE_URL}/api/staff/reject`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedRequestId, comment: rejectionReason }),
    });
    if (response.ok) { setIsRejectModalOpen(false); fetchRequests(); }
  };

  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.matric.toLowerCase().includes(searchTerm.toLowerCase());
    return filter === "all" ? matchesSearch : matchesSearch && r.status === filter;
  });

  return (
    <main className="min-h-screen bg-slate-50 font-sans p-4 md:p-6 animate-in fade-in duration-500">
      <header className="bg-white border rounded-xl p-4 flex justify-between items-center mb-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <Building2 className="text-blue-700" size={24} />
          <h1 className="font-bold text-xl">Staff Portal</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchRequests()} className="text-slate-500 flex items-center gap-2 font-bold hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors" title="Refresh requests"><RefreshCw size={18} /> Refresh</button>
          <button onClick={() => { clearAuthUser("staff_user"); navigate("/"); }} className="text-red-600 flex items-center gap-2 font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"><LogOut size={18} /> Logout</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Pending" count={requests.filter(r => r.status === 'pending').length} color="amber" icon={<Clock />} />
        <StatCard label="Cleared" count={requests.filter(r => r.status === 'approved').length} color="green" icon={<UserCheck />} />
        <StatCard label="Rejected" count={requests.filter(r => r.status === 'rejected').length} color="red" icon={<XCircle />} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex flex-col md:row justify-between gap-4 bg-slate-50/50">
          <div className="flex gap-2">
            {["pending", "approved", "rejected", "all"].map(t => (
              <button key={t} onClick={() => setFilter(t)} className={`px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition-all active:scale-95 ${filter === t ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-white text-slate-600 hover:bg-slate-100"}`}>{t}</button>
            ))}
          </div>
          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
            <input type="text" placeholder="Search students..." onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all" />
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr><th className="px-6 py-4">Student</th><th className="px-6 py-4">Office</th><th className="px-6 py-4">Submitted</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y">
            {filteredRequests.map(req => (
              <tr key={req.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col cursor-pointer" onClick={() => fetchStudentPass(req.student_db_id, req.name, req.matric)}>
                    <span className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-2">
                      {req.name} <Eye size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">{req.matric}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-blue-700 uppercase text-xs">{req.office}</td>
                <td className="px-6 py-4 text-xs text-slate-400">{req.date}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${req.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>{req.status}</span>
                  {req.comment && <button onClick={() => { setSelectedNoteData({ name: req.name, note: req.comment }); setIsNoteModalOpen(true); }} className="block mt-1 text-[10px] text-blue-600 underline hover:text-blue-800">View Reason</button>}
                </td>
                <td className="px-6 py-4 text-right">
                  {req.status === "pending" && (
                    <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setSelectedRequestId(req.id); setIsApproveModalOpen(true); }} className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors" title="Approve"><CheckCircle2 size={18} /></button>
                      <button onClick={() => { setSelectedRequestId(req.id); setIsRejectModalOpen(true); }} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Reject"><XCircle size={18} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODALS */}
      {isApproveModalOpen && (
        <Modal title="Confirm Approval" icon={<CheckCircle2 />} color="green" onClose={() => setIsApproveModalOpen(false)}>
          <p className="text-sm mb-6">Approve this student? This will unlock the next step in their journey.</p>
          <div className="flex justify-end gap-3"><button onClick={() => setIsApproveModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-slate-600">Cancel</button><button onClick={confirmApprove} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 shadow-md hover:shadow-lg transition-all">Approve</button></div>
        </Modal>
      )}

      {isRejectModalOpen && (
        <Modal title="Reject Request" icon={<AlertTriangle />} color="red" onClose={() => setIsRejectModalOpen(false)}>
          <textarea onChange={(e) => setRejectionReason(e.target.value)} placeholder="Reason for rejection..." className="w-full h-32 p-3 border rounded-xl mb-4 focus:ring-2 focus:ring-red-100 outline-none" />
          <div className="flex justify-end gap-3"><button onClick={() => setIsRejectModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-slate-600">Cancel</button><button onClick={submitRejection} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 shadow-md hover:shadow-lg transition-all">Reject</button></div>
        </Modal>
      )}

      {isNoteModalOpen && selectedNoteData && (
        <Modal title={`Reason: ${selectedNoteData.name}`} icon={<Info />} color="blue" onClose={() => setIsNoteModalOpen(false)}>
          <div className="bg-slate-50 p-4 rounded-xl border text-sm text-slate-700">{selectedNoteData.note}</div>
          <button onClick={() => setIsNoteModalOpen(false)} className="w-full mt-6 bg-slate-800 text-white py-2 rounded-xl font-bold hover:bg-slate-900 transition-colors">Close</button>
        </Modal>
      )}

      {/* CLEARANCE PASS MODAL */}
      {isPassModalOpen && selectedStudentPass && (
        <Modal title="Student Clearance Pass" icon={<FileText />} color="blue" onClose={() => setIsPassModalOpen(false)}>
          <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h3 className="font-bold text-lg text-blue-900">{selectedStudentPass.name}</h3>
            <p className="text-sm text-blue-600 font-mono tracking-wide">{selectedStudentPass.matric}</p>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {selectedStudentPass.steps.map((step, idx) => (
              <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${step.status === 'approved' ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.status === 'approved' ? 'bg-green-200 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                    {idx + 1}
                  </div>
                  <span className={`text-sm font-medium ${step.status === 'approved' ? 'text-green-900' : 'text-slate-500'}`}>{step.name}</span>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${step.status === 'approved' ? 'bg-green-200 text-green-800' : 'bg-slate-200 text-slate-500'}`}>{step.status}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setIsPassModalOpen(false)} className="w-full mt-6 border border-slate-200 text-slate-600 py-2 rounded-xl font-bold hover:bg-slate-50 transition-colors">Close Pass</button>
        </Modal>
      )}
    </main>
  );
}

// Reusable Components
function StatCard({ icon, color, label, count }) {
  const colors = { amber: "bg-amber-100 text-amber-600", green: "bg-green-100 text-green-600", red: "bg-red-100 text-red-600" };
  return (<div className="bg-white p-5 rounded-xl border flex items-center gap-4 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
    <div className={`p-3 rounded-full ${colors[color]}`}>{icon}</div>
    <div><p className="text-slate-400 text-xs font-bold uppercase">{label}</p><h3 className="text-2xl font-black">{count}</h3></div>
  </div>);
}

function Modal({ title, icon, color, onClose, children }) {
  const colors = { green: "bg-green-50 text-green-600", red: "bg-red-50 text-red-600", blue: "bg-blue-50 text-blue-600" };
  return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-black/5">
      <div className={`p-4 border-b flex items-center justify-between gap-3 font-bold ${colors[color]}`}>
        <div className="flex items-center gap-3">{icon} {title}</div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/70 transition-colors" title="Close">
          <X size={16} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>);
}

export default StaffDashboard;
