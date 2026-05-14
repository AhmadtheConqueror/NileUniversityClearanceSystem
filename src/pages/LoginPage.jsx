import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Lock,
  ArrowRight,
  GraduationCap,
  Building2,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { saveAuthUser } from "../authSession";

const API_BASE_URL = (import.meta.env.VITE_CLEARANCE_API_BASE_URL || "http://127.0.0.1:5000").replace(/\/$/, "");

function LoginPage() {
  const navigate = useNavigate();

  // FIX: Read role from URL params
  const [params] = useState(new URLSearchParams(window.location.search));
  const initialRole = params.get("role");

  // If role is staff-clearance, we treat it as 'staff' for auth but 'staff-clearance' for UI context
  // FIX: Treat 'staff' as a specific flow too, to hide the switcher
  const isClearanceFlow = initialRole === "staff-clearance" || initialRole === "student" || initialRole === "staff";
  const defaultRole = initialRole === "staff-clearance" ? "staff" : (initialRole || "student");

  const [role, setRole] = useState(defaultRole);
  const [formData, setFormData] = useState({ userId: "", password: "", schoolEmail: "", otp: "" });
  const [authStage, setAuthStage] = useState("credentials");
  const [challengeToken, setChallengeToken] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [developmentOtp, setDevelopmentOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setStatusMessage("");
  };

  const completeLogin = (data) => {
    if (data.role === "student") {
      saveAuthUser("student_user", data);
      navigate("/student/dashboard");
      return;
    }

    if (initialRole === "staff-clearance") {
      saveAuthUser("exit_staff_user", data);
      navigate("/staff/clearance");
      return;
    }

    saveAuthUser("staff_user", data);
    navigate("/staff/dashboard");
  };

  const submitCredentials = async () => {
    if (!formData.userId || !formData.password) {
      setError("Please enter your credentials to continue.");
      return;
    }

    if (authStage === "email" && !formData.schoolEmail) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: formData.userId,
          password: formData.password,
          schoolEmail: formData.schoolEmail,
          role: role,
          loginContext: initialRole || role,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        completeLogin(data);
        return;
      }

      if (response.ok && ["email_required", "school_email_required"].includes(data.status)) {
        setAuthStage("email");
        setStatusMessage(data.message || "Please enter your email address.");
        return;
      }

      if (response.ok && data.status === "otp_required") {
        setAuthStage("otp");
        setChallengeToken(data.challengeToken);
        setDevelopmentOtp(data.developmentOtp || "");
        setStatusMessage(data.message || "Enter the verification code sent to your email.");
        return;
      }

      setError(data.message || "Invalid credentials. Please try again.");
    } catch {
      setError("Unable to connect to the server. Please ensure Flask is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitOtp = async () => {
    if (!formData.otp || formData.otp.replace(/\D/g, "").length !== 6) {
      setError("Please enter the six-digit verification code.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/login/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          challengeToken,
          otp: formData.otp,
          loginContext: initialRole || role,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        completeLogin(data);
        return;
      }

      setError(data.message || "Unable to verify the code.");
    } catch {
      setError("Unable to connect to the server. Please ensure Flask is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setStatusMessage("");

    if (authStage === "otp") {
      await submitOtp();
      return;
    }

    await submitCredentials();
  };

  return (
    <main className="min-h-screen flex bg-slate-50 font-sans animate-in fade-in duration-700">
      {/* LEFT SIDE: Visuals */}
      <div className="hidden lg:flex w-1/2 bg-blue-900 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
          </svg>
        </div>
        <div className="relative z-10 text-center px-10 text-white animate-in slide-in-from-left-10 duration-700 delay-100">
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl mb-6 inline-block">
            <div className="text-4xl font-bold italic">Nile University</div>
          </div>
          <h2 className="text-3xl font-bold mb-4">Clearance System</h2>
          <p className="text-blue-200 text-lg max-w-md mx-auto">Access your personalized portal.</p>
        </div>
      </div>

      {/* RIGHT SIDE: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-in slide-in-from-right-8 duration-500">
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold text-blue-900">Sign In</h1>
            <p className="text-slate-500">Please select your role to continue.</p>
          </div>

          {/* Role Switcher - Only show if not in a specific clearance flow */}
          {!isClearanceFlow && (
            <div className="bg-slate-100 p-1 rounded-xl flex shadow-inner">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${role === "student" ? "bg-white text-blue-900 shadow-sm scale-[1.02]" : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <GraduationCap className="w-4 h-4" /> Student
              </button>
              <button
                type="button"
                onClick={() => setRole("staff")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${role === "staff" ? "bg-white text-blue-900 shadow-sm scale-[1.02]" : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <Building2 className="w-4 h-4" /> Staff
              </button>
            </div>
          )}

          {/* Header Update for specific flow */}
          {initialRole === "staff-clearance" && (
            <div className="bg-purple-100 text-purple-800 p-3 rounded-lg text-center font-semibold mb-4 border border-purple-200">
              Exiting Staff Login
            </div>
          )}
          {initialRole === "staff" && (
            <div className="bg-blue-100 text-blue-800 p-3 rounded-lg text-center font-semibold mb-4 border border-blue-200">
              Staff Portal Login
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
              <span>{error}</span>
            </div>
          )}
          {statusMessage && !error && (
            <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <ShieldCheck className="w-4 h-4" />
              <span>{statusMessage}</span>
            </div>
          )}
          {developmentOtp && authStage === "otp" && !error && (
            <div className="bg-amber-50 text-amber-800 text-sm p-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Development OTP: <strong className="tracking-[0.25em]">{developmentOtp}</strong></span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {authStage !== "otp" && (
              <>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 block ml-1">
                {role === "student" ? "Matric Number" : "Staff ID"}
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  placeholder={role === "student" ? "20221912" : "STF/001"}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 block ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="********"
                  className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
              </>
            )}

            {authStage === "email" && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 block ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="email"
                    name="schoolEmail"
                    value={formData.schoolEmail}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {authStage === "otp" && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 block ml-1">Verification Code</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder="000000"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all tracking-[0.25em]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {authStage === "otp" ? "Verify Code" : authStage === "email" ? "Send Code" : "Login"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {authStage !== "credentials" && (
              <button
                type="button"
                onClick={() => {
                  setAuthStage("credentials");
                  setChallengeToken("");
                  setDevelopmentOtp("");
                  setStatusMessage("");
                  setError("");
                  setFormData({ ...formData, otp: "" });
                }}
                className="w-full text-sm font-semibold text-slate-500 hover:text-blue-800 transition-colors"
              >
                Back to credentials
              </button>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
