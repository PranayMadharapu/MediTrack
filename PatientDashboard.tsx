import React, { useMemo } from 'react';
import { Medicine, IntakeLog } from '../types';
import { Icons } from '../constants';

interface PatientDashboardProps {
  medicines: Medicine[];
  logs: IntakeLog[];
  onMarkStatus: (medicineId: string, status: 'taken' | 'missed') => void;
  onDeleteMedicine: (id: string) => void;
  userName: string;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({
  medicines,
  logs,
  onMarkStatus,
  onDeleteMedicine,
  userName,
}) => {
  const sortedMeds = useMemo(
    () => [...medicines].sort((a, b) => a.time.localeCompare(b.time)),
    [medicines]
  );
  const today = new Date().toISOString().split('T')[0];

  const getStatusForToday = (medId: string) =>
    logs.find((l) => l.medicineId === medId && l.timestamp.startsWith(today))?.status;

  const nextDoseInfo = useMemo(() => {
    const now = new Date();
    const currentHHmm =
      now.getHours().toString().padStart(2, '0') +
      ':' +
      now.getMinutes().toString().padStart(2, '0');

    const next = sortedMeds.find((m) => {
      const status = getStatusForToday(m.id);
      return m.time > currentHHmm && !status;
    });

    if (!next) return null;

    const [h, m] = next.time.split(':').map(Number);
    const target = new Date();
    target.setHours(h, m, 0);
    const diffMins = Math.round((target.getTime() - now.getTime()) / 60000);
    return { medicine: next, minutes: diffMins };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedMeds, logs]);

  const firstName = userName.split(' ')[0];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hello, {firstName}</h1>
          <p className="text-slate-500 mt-1 font-medium flex items-center gap-2 flex-wrap">
            You have {medicines.length} medicines scheduled today.
            <span className="bg-emerald-100 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
              Voice Notes Enabled
            </span>
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-slate-800">
            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
          </p>
          <p className="text-xs font-medium text-slate-400">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </p>
        </div>
      </header>

      {/* Hero banner */}
      <div
        className={`rounded-[2.5rem] p-8 text-white flex items-center justify-between shadow-2xl transition-all duration-500 relative overflow-hidden ${
          nextDoseInfo ? 'bg-blue-600 shadow-blue-200' : 'bg-slate-800 shadow-slate-200'
        }`}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10">
          {nextDoseInfo ? (
            <>
              <h2 className="text-2xl font-black mb-1">
                Next Dose in {nextDoseInfo.minutes} mins
              </h2>
              <p className="opacity-90 font-medium">
                {nextDoseInfo.medicine.name} • {nextDoseInfo.medicine.dosage}
              </p>
              <div className="mt-4 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/20 w-fit px-3 py-1 rounded-full">
                  <Icons.Bell /> Reminder set
                </div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-emerald-500/30 w-fit px-3 py-1 rounded-full border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  Voice Reminders Active
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-black mb-1">All clear for now!</h2>
              <p className="opacity-90 font-medium">No upcoming doses scheduled for today.</p>
            </>
          )}
        </div>
        <div className="relative z-10 bg-white/10 p-5 rounded-3xl backdrop-blur-md hidden sm:block">
          {nextDoseInfo ? <Icons.Bell /> : <Icons.Check />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Schedule list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Icons.Calendar />
            </div>
            Today's Schedule
          </h3>

          <div className="space-y-4 relative">
            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-100 -z-10" />

            {sortedMeds.length === 0 ? (
              <div className="bg-white p-12 rounded-[2rem] border-2 border-dashed border-slate-100 text-center">
                <Icons.Pill className="mx-auto mb-3 text-slate-300 w-8 h-8" />
                <p className="text-slate-400 font-bold">No medicines scheduled yet.</p>
              </div>
            ) : (
              sortedMeds.map((med) => {
                const status = getStatusForToday(med.id);
                return (
                  <div key={med.id} className="flex gap-4 group">
                    {/* Timeline dot */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center z-10 shadow-sm transition-all duration-500 border-4 border-slate-50 shrink-0 ${
                        status === 'taken'
                          ? 'bg-emerald-500 text-white'
                          : status === 'missed'
                          ? 'bg-rose-500 text-white'
                          : 'bg-white text-slate-400 border-white'
                      }`}
                    >
                      {status === 'taken' ? (
                        <Icons.Check />
                      ) : status === 'missed' ? (
                        <Icons.X />
                      ) : (
                        <span className="font-black text-sm">{med.time.split(':')[0]}</span>
                      )}
                    </div>

                    {/* Card */}
                    <div
                      className={`flex-1 bg-white border-2 rounded-[1.5rem] p-5 transition-all duration-300 ${
                        status === 'taken'
                          ? 'border-emerald-100 opacity-60 grayscale-[0.5]'
                          : status === 'missed'
                          ? 'border-rose-100'
                          : 'border-slate-50 shadow-sm hover:shadow-xl hover:border-blue-100'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                              className={`text-xs font-black uppercase tracking-widest ${
                                status === 'taken' ? 'text-emerald-500' : 'text-blue-600'
                              }`}
                            >
                              {med.time}
                            </span>
                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                            <span className="text-xs font-bold text-slate-400">{med.dosage}</span>
                          </div>
                          <h4
                            className={`text-lg font-black ${
                              status === 'taken' ? 'text-slate-400 line-through' : 'text-slate-800'
                            }`}
                          >
                            {med.name}
                          </h4>
                          {med.instructions && (
                            <p className="text-sm text-slate-500 font-medium mt-1">
                              {med.instructions}
                            </p>
                          )}
                        </div>

                        {!status && (
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => onMarkStatus(med.id, 'taken')}
                              className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-90"
                              title="Mark as Taken"
                            >
                              <Icons.Check />
                            </button>
                            <button
                              onClick={() => onMarkStatus(med.id, 'missed')}
                              className="bg-rose-50 text-rose-600 p-2.5 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90"
                              title="Mark as Missed"
                            >
                              <Icons.X />
                            </button>
                            <button
                              onClick={() => onDeleteMedicine(med.id)}
                              className="bg-slate-50 text-slate-500 p-2.5 rounded-xl hover:bg-slate-200 transition-all shadow-sm active:scale-90"
                              title="Remove Medicine"
                            >
                              <Icons.Trash />
                            </button>
                          </div>
                        )}
                      </div>

                      {!status && (
                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <Icons.Bell className="w-3 h-3" /> 5-Min Voice Cycle Enabled
                          </div>
                          <span className="text-[9px] font-black text-blue-500 uppercase">
                            Compulsory Reminder
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar widget */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-800 mb-6 flex items-center justify-between">
              Daily Progress
              <span className="text-blue-600 text-sm font-bold">Active</span>
            </h3>
            <div className="flex items-end justify-between h-32 gap-2">
              {[65, 80, 40, 90, 100, 75, 95].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-slate-50 rounded-lg overflow-hidden flex flex-col justify-end h-full">
                    <div
                      className={`w-full transition-all duration-1000 rounded-t-lg ${
                        val > 80
                          ? 'bg-emerald-400'
                          : val > 50
                          ? 'bg-blue-400'
                          : 'bg-rose-400'
                      }`}
                      style={{ height: `${val}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-300">
                    {'MTWTFSS'[i]}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
              Consistency Tracker
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
