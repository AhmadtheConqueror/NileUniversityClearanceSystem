import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Printer, ArrowLeft, CheckCircle2, Building2 } from "lucide-react";

function ClearanceForm() {
  const location = useLocation();
  const navigate = useNavigate();

  const clearanceData =
    location.state?.clearanceData ||
    JSON.parse(localStorage.getItem("clearanceData")) || {
      name: "N/A",
      userId: "N/A",
      level: "N/A",
      dept: "N/A",
      approvals: []
    };

  const approvedSteps = clearanceData.approvals.filter(
    (s) => s.status === "approved"
  );

  const handlePrint = () => window.print();

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-10 font-serif">
      {/* ACTION BAR */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-900 font-sans"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <button
          onClick={handlePrint}
          className="bg-blue-900 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2"
        >
          <Printer size={18} /> Print Certificate
        </button>
      </div>

      {/* CERTIFICATE */}
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-16 border-[12px] border-double border-blue-900 relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
          <Building2 size={500} />
        </div>

        <div className="text-center mb-10 border-b pb-6">
          <h1 className="text-4xl font-black text-blue-900 uppercase">Nile University</h1>
          <p className="font-bold">Office of the Registrar</p>
          <h2 className="mt-4 text-2xl font-bold underline">
            FINAL GRADUATION CLEARANCE
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <p className="text-xs font-bold text-slate-400">FULL NAME</p>
            <p className="font-bold border-b">{clearanceData.name}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">MATRIC NO</p>
            <p className="font-bold border-b">{clearanceData.userId}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">DEPARTMENT</p>
            <p className="font-bold border-b">{clearanceData.dept}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">LEVEL</p>
            <p className="font-bold border-b">{clearanceData.level} Level</p>
          </div>
        </div>

        <table className="w-full border border-slate-300 mb-10">
          <thead>
            <tr className="bg-slate-100 text-xs font-bold">
              <th className="border px-4 py-2">S/N</th>
              <th className="border px-4 py-2">OFFICE</th>
              <th className="border px-4 py-2">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {approvedSteps.map((step, i) => (
              <tr key={step.id}>
                <td className="border px-4 py-2">{i + 1}</td>
                <td className="border px-4 py-2 font-bold uppercase">{step.name}</td>
                <td className="border px-4 py-2 text-green-700 font-bold flex gap-2 items-center">
                  <CheckCircle2 size={16} /> CLEARED
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-center text-[10px] text-slate-500">
          Digitally verified by Nile University Registry
        </p>
      </div>
    </main>
  );
}

export default ClearanceForm;
