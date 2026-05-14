import { useNavigate } from "react-router-dom";
import { GraduationCap, Briefcase, ArrowRight, LogOut } from "lucide-react";

function LandingPage() {
    const navigate = useNavigate();

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans p-6">
            <div className="text-center mb-12 animate-in slide-in-from-top-10 duration-700">
                <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
                    Nile University
                </h1>
                <p className="text-xl text-slate-600">
                    Online Clearance System
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
                {/* Student Option */}
                <div
                    onClick={() => navigate("/login?role=student")}
                    className="group relative bg-white border border-slate-200 p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:border-blue-200 transition-all cursor-pointer overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <GraduationCap className="w-32 h-32 text-blue-900" />
                    </div>
                    <div className="relative z-10">
                        <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <GraduationCap className="w-6 h-6 text-blue-600 group-hover:text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-blue-900 transition-colors">
                            Student Clearance
                        </h2>
                        <p className="text-slate-500 mb-6">
                            Finalize your graduation process, clear departments, and get your certificate.
                        </p>
                        <span className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
                            Continue as Student <ArrowRight className="w-4 h-4 ml-2" />
                        </span>
                    </div>
                </div>

                {/* Staff Option */}
                <div
                    onClick={() => navigate("/login?role=staff-clearance")}
                    className="group relative bg-white border border-slate-200 p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:border-purple-200 transition-all cursor-pointer overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <LogOut className="w-32 h-32 text-purple-900" />
                    </div>
                    <div className="relative z-10">
                        <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <LogOut className="w-6 h-6 text-purple-600 group-hover:text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-purple-900 transition-colors">
                            Exiting Staff
                        </h2>
                        <p className="text-slate-500 mb-6">
                            Complete your exit process, return assets, and schedule your exit interview.
                        </p>
                        <span className="flex items-center text-purple-600 font-semibold group-hover:translate-x-2 transition-transform">
                            Clearance Login <ArrowRight className="w-4 h-4 ml-2" />
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center animate-in fade-in delay-200">
                <p className="text-slate-500 mb-4">Are you an active staff member or approver?</p>
                <button
                    onClick={() => navigate("/login?role=staff")}
                    className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-900 font-semibold py-3 px-8 rounded-xl transition-colors shadow-sm flex items-center gap-2 mx-auto"
                >
                    <Briefcase className="w-5 h-5" /> Access Staff Portal
                </button>
            </div>
        </main>
    );
}

export default LandingPage;
