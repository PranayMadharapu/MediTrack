import React, { useState, useEffect } from 'react';
import { Medicine, IntakeLog } from '../types';
import { Icons } from '../constants';
import { getAdherenceReport } from '../services/geminiService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface HealthReportsProps {
  medicines: Medicine[];
  logs: IntakeLog[];
  userName: string;
}

const HealthReports: React.FC<HealthReportsProps> = ({ medicines, logs, userName }) => {
  const [aiAnalysis, setAiAnalysis] = useState<{
    summary: string;
    score: number;
    alerts: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const report = await getAdherenceReport(logs, medicines);
        setAiAnalysis(report);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [logs, medicines]);

  const data = medicines.map((med) => {
    const medLogs = logs.filter((l) => l.medicineId === med.id);
    const takenCount = medLogs.filter((l) => l.status === 'taken').length;
    const missedCount = medLogs.filter((l) => l.status === 'missed').length;
    const total = takenCount + missedCount || 1;
    return {
      name: med.name,
      adherence: Math.round((takenCount / total) * 100),
      missed: missedCount,
    };
  });

  const score = aiAnalysis?.score || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Health Compliance</h1>
        <p className="text-slate-500 font-medium">
          Monitoring data for:{' '}
          <span className="text-blue-600 font-bold">{userName}</span>
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Score ring */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center text-center">
          <div className="relative w-52 h-52 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 208 208">
              <circle cx="104" cy="104" r="94" stroke="#f8fafc" strokeWidth="16" fill="transparent" />
              <circle
                cx="104"
                cy="104"
                r="94"
                stroke={score > 80 ? '#10b981' : '#3b82f6'}
                strokeWidth="16"
                fill="transparent"
                strokeDasharray={590}
                strokeDashoffset={590 - (590 * score) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-slate-900">
                {loading ? '--' : `${score}%`}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                Consistency
              </span>
            </div>
          </div>
          <p className="mt-8 text-slate-500 font-bold text-sm uppercase tracking-widest">
            Last 30 Days Record
          </p>
        </div>

        {/* AI Insights */}
        <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 group-hover:rotate-12 transition-transform duration-700">
            <Icons.Bot />
          </div>
          <h3 className="text-xl font-black mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Icons.Bot />
            </div>
            Smart Insights
          </h3>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-slate-800 rounded-full w-3/4" />
              <div className="h-4 bg-slate-800 rounded-full w-full" />
              <div className="h-4 bg-slate-800 rounded-full w-5/6" />
              <div className="h-4 bg-slate-800 rounded-full w-2/3" />
            </div>
          ) : (
            <div className="space-y-8 relative z-10">
              <p className="text-slate-300 leading-relaxed font-medium italic text-lg">
                &ldquo;{aiAnalysis?.summary || 'Analyzing historical patterns...'}&rdquo;
              </p>
              <div className="space-y-4">
                <p className="text-xs font-black text-blue-400 uppercase tracking-widest">
                  Priority Alerts
                </p>
                <ul className="space-y-3">
                  {(aiAnalysis?.alerts || []).map((alert, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-bold text-slate-100">
                      <span className="mt-1.5 w-2 h-2 bg-rose-500 rounded-full shrink-0 shadow-lg shadow-rose-900" />
                      {alert}
                    </li>
                  ))}
                  {!aiAnalysis?.alerts?.length && (
                    <li className="text-slate-500 text-sm font-bold italic">
                      No critical alerts detected.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-800 mb-10 flex items-center gap-3">
            <Icons.Chart />
            Adherence Breakdown
          </h3>
          {data.length === 0 ? (
            <div className="h-80 flex items-center justify-center">
              <p className="text-slate-400 font-bold">No medicines to display yet.</p>
            </div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                    dy={15}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                      borderRadius: '20px',
                      border: 'none',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      padding: '15px',
                    }}
                    itemStyle={{ fontWeight: 900, color: '#1e293b' }}
                  />
                  <Bar dataKey="adherence" radius={[12, 12, 0, 0]} barSize={45}>
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.adherence > 80 ? '#10b981' : '#3b82f6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthReports;
