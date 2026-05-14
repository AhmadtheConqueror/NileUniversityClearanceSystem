import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    CheckCircle,
    Clock,
    LogOut,
    Calendar,
    Loader2,
    UserCircle,
    Briefcase,
    FileText,
    Lock,
    Unlock,
    Send,
    RefreshCw,
    Check
} from "lucide-react";
import { clearAuthUser, getAuthUser, saveAuthUser } from "../authSession";

const API_BASE_URL = (import.meta.env.VITE_CLEARANCE_API_BASE_URL || "http://127.0.0.1:5000").replace(/\/$/, "");

function StaffClearanceDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => getAuthUser("exit_staff_user") || {});
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);

    // Profile Setup State
    const [showSetup, setShowSetup] = useState(false);
    const [setupData, setSetupData] = useState({ name: "" });

    // Interview Scheduling State
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleDate, setScheduleDate] = useState("");
    const [scheduleTime, setScheduleTime] = useState("");
    const [scheduling, setScheduling] = useState(false);
    const [activeRequest, setActiveRequest] = useState(null);

    useEffect(() => {
        const storedUser = getAuthUser("exit_staff_user");
        if (!storedUser?.id) {
            navigate("/login?role=staff-clearance");
            return;
        }
        setUser(storedUser);

        if (storedUser.needsSetup) {
            setShowSetup(true);
        }

        fetchStatus(storedUser.id);
    }, [navigate]);

    const fetchStatus = async (userId) => {
        try {
            // Add timestamp to prevent caching
            const response = await fetch(`${API_BASE_URL}/api/student/status/${userId}?t=${Date.now()}`, {
                cache: "no-store",
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            }
        } catch (error) {
            console.error("Failed to fetch status", error);
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 3000);
    };

    const handleRefresh = () => {
        setLoading(true);
        fetchStatus(user.id);
    };

    const handleLogout = () => {
        clearAuthUser("exit_staff_user");
        navigate("/");
    };

    // --- ACTIONS ---

    const handleSetupSubmit = async (e) => {
        e.preventDefault();
        if (!setupData.name) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/student/update-profile`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: user.id, name: setupData.name })
            });

            if (res.ok) {
                setShowSetup(false);
                const updatedUser = { ...user, name: setupData.name, needsSetup: false };
                setUser(updatedUser);
                saveAuthUser("exit_staff_user", updatedUser);
                showNotification("Profile updated successfully!");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to update profile.");
        }
    };

    const handleInitiateRequest = async (orderIndex, stepName) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/student/request-clearance`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: user.id, order_index: orderIndex })
            });

            if (response.ok) {
                showNotification(`Request sent to ${stepName}!`);
                fetchStatus(user.id);
            }
        } catch (error) {
            console.error(error);
            alert("Connection error.");
        }
    };

    const handleScheduleClick = (req) => {
        setActiveRequest(req);
        setShowScheduleModal(true);
    };

    const confirmSchedule = async () => {
        if (!scheduleDate || !scheduleTime) return;
        setScheduling(true);

        try {
            const dateTime = `${scheduleDate}T${scheduleTime}:00`;
            const response = await fetch(`${API_BASE_URL}/api/student/schedule-appointment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    student_id: user.id,
                    order_index: activeRequest.order,
                    date: dateTime
                })
            });

            if (response.ok) {
                setShowScheduleModal(false);
                showNotification(`Interview scheduled successfully!`);
                fetchStatus(user.id);
                setScheduleDate("");
                setScheduleTime("");
            } else {
                alert("Failed to schedule. Please try again.");
            }
        } catch (e) {
            console.error(e);
            alert("Connection error.");
        } finally {
            setScheduling(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
            </div>
        );
    }

    const approvedCount = requests.filter(r => r.status === 'approved').length;
    const progressPercent = Math.round((approvedCount / (requests.length || 12)) * 100);

    return (
        <div className="min-h-screen bg-slate-50 pb-12 font-sans text-slate-800 animate-in fade-in duration-500">

            {/* --- SETUP MODAL --- */}
            {showSetup && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white p-8 rounded-3xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome!</h2>
                        <p className="text-slate-500 mb-6">Please enter your full name to continue your clearance.</p>
                        <form onSubmit={handleSetupSubmit} className="space-y-4">
                            <input
                                required
                                placeholder="Full Name"
                                className="w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-100 outline-none"
                                onChange={e => setSetupData({ ...setupData, name: e.target.value })}
                            />
                            <button type="submit" className="w-full bg-purple-900 text-white py-4 rounded-xl font-bold hover:bg-purple-800 transition-colors">Start Clearance</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                            <Briefcase className="w-6 h-6 text-purple-700" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Staff Clearance</h1>
                            <p className="text-sm text-slate-500">Nile University</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Sign Out</span>
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 grid gap-6">

                {/* Profile & Progress Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                            <UserCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{user.name || "Staff Member"}</h2>
                            <p className="text-slate-500 font-medium">{user.userId}</p>
                        </div>
                    </div>

                    <div className="w-full md:w-1/2 space-y-2">
                        <div className="flex justify-between items-center text-sm font-bold">
                            <span>Clearance Progress</span>
                            <div className="flex items-center gap-3">
                                <span className="text-purple-700">{progressPercent}%</span>
                                <button onClick={handleRefresh} className="text-slate-400 hover:text-blue-600 transition-colors" title="Refresh Status">
                                    <RefreshCw size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div className="h-full bg-purple-600 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-purple-900 text-white p-6 rounded-2xl shadow-lg mb-4">
                        <h2 className="text-2xl font-bold mb-2">Clearance Stages</h2>
                        <p className="text-purple-200">
                            Complete the following 12 stages in order to finalize your exit clearance.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y">
                        {requests.map((req) => {
                            const isLocked = req.status === "locked";
                            const isPending = req.status === "pending";
                            const isUnlocked = req.status === "unlocked";
                            const isRejected = req.status === "rejected";
                            const isApproved = req.status === "approved";
                            const isInterview = req.name.includes("Interview");

                            return (
                                <div
                                    key={req.id}
                                    className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${isLocked ? "bg-slate-50/50" : "hover:bg-slate-50"}`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${isLocked ? "bg-slate-200 text-slate-400" :
                                            isApproved ? "bg-green-100 text-green-600 scale-110" :
                                                isUnlocked ? "bg-purple-600 text-white shadow-lg shadow-purple-200 animate-pulse" :
                                                    "bg-purple-100 text-purple-600"
                                            }`}>
                                            {isLocked ? <Lock size={14} /> : isUnlocked ? <Unlock size={14} /> : isApproved ? <Check size={16} /> : <FileText size={16} />}
                                        </div>
                                        <div>
                                            <h3 className={`font-semibold text-base ${isLocked ? "text-slate-400" : "text-slate-900"}`}>{req.name}</h3>
                                            {req.comment && isRejected && <p className="text-sm text-red-600 font-medium mt-1">Reason: {req.comment}</p>}
                                            {req.comment && !isRejected && <p className="text-sm text-slate-500 mt-1">{req.comment}</p>}

                                            {/* Display Scheduled Date if available */}
                                            {isInterview && isPending && (
                                                <p className="text-xs text-purple-600 font-bold mt-1 flex items-center gap-1">
                                                    <Calendar size={12} /> Interview Requested (Check status updates)
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pl-12 md:pl-0">
                                        {/* ACTION BUTTONS */}

                                        {/* 1. INTERVIEW SCHEDULE ACTION */}
                                        {isInterview && (isUnlocked || isPending) && (
                                            <button
                                                onClick={() => handleScheduleClick(req)}
                                                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-purple-700 transition-colors shadow-sm"
                                            >
                                                <Calendar size={14} />
                                                {isPending ? 'Reschedule Interview' : 'Schedule Interview'}
                                            </button>
                                        )}

                                        {/* 2. STANDARD REQUEST ACTION */}
                                        {!isInterview && isUnlocked && (
                                            <button
                                                onClick={() => handleInitiateRequest(req.order, req.name)}
                                                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 animate-pulse hover:animate-none hover:bg-purple-700 transition-colors shadow-sm"
                                            >
                                                <Send size={14} /> Request Clearance
                                            </button>
                                        )}

                                        {/* 3. RETRY ACTION */}
                                        {isRejected && (
                                            <button
                                                onClick={() => handleInitiateRequest(req.order, req.name)}
                                                className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-700 transition-colors shadow-sm"
                                            >
                                                <RefreshCw size={14} /> Retry Request
                                            </button>
                                        )}

                                        {/* STATUS BADGES */}
                                        {isPending && !isInterview && (
                                            <span className="text-sm text-amber-600 font-bold flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                                                <Clock size={14} /> Pending Review
                                            </span>
                                        )}

                                        {isApproved && (
                                            <span className="text-sm text-green-700 font-bold flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                                                <CheckCircle size={14} /> Approved
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* Schedule Modal */}
            {showScheduleModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Schedule Interview</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            Please select a date and time for your {activeRequest?.name}.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                                <input
                                    type="time"
                                    value={scheduleTime}
                                    onChange={(e) => setScheduleTime(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setShowScheduleModal(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSchedule}
                                disabled={scheduling || !scheduleDate || !scheduleTime}
                                className="px-4 py-2 bg-purple-900 text-white rounded-lg font-medium hover:bg-purple-800 disabled:opacity-50 flex items-center gap-2"
                            >
                                {scheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Schedule"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            {notification && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full flex items-center gap-3 text-sm animate-in slide-in-from-bottom-4 shadow-xl z-50">
                    <Check className="w-4 h-4 text-green-400" /> {notification}
                </div>
            )}

        </div>
    );
}

export default StaffClearanceDashboard;
