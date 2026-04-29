import React from 'react';
import { UserRole, User } from './types';
import { Icons } from './constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Icons.Calendar /> },
    { id: 'medicines', label: 'Schedule Meds', icon: <Icons.Pill /> },
    { id: 'assistant', label: 'MediBot AI', icon: <Icons.Bot /> },
    { id: 'reports', label: 'Health Reports', icon: <Icons.Chart /> },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 hidden md:flex flex-col z-40">
        <div className="p-6 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-100">
              M
            </div>
            <span className="text-xl font-black text-slate-800 tracking-tight">MediTrack</span>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Voice reminder badge */}
          <div className="mt-10 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                Voice Reminders
              </p>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              English voice notes play every 5 mins until tablets are taken.
            </p>
          </div>

          {/* User info + logout */}
          <div className="mt-auto pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Logged in as
            </p>
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4">
              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Icons.User className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 font-medium capitalize">
                  {user.role.toLowerCase()}
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100"
            >
              <Icons.LogOut />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
              activeTab === item.id ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            {item.icon}
            {item.label.split(' ')[0]}
          </button>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
