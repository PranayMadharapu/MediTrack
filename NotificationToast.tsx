import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Medicine } from '../types';
import { Icons } from '../constants';

interface NotificationToastProps {
  medicine: Medicine;
  onClose: () => void;
  onTaken: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ medicine, onClose, onTaken }) => {
  // Attention beep on mount
  useEffect(() => {
    try {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch {
      // Blocked by browser autoplay policy – silently ignore
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.25)] border border-blue-100 p-8 overflow-hidden relative"
      >
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 -z-10" />

        <div className="flex flex-col items-center text-center">
          {/* Bell icon */}
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-2xl shadow-blue-500/30 relative">
            <Icons.Bell className="w-9 h-9" />
            <div className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500" />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full mb-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
              Scheduled Dose Time
            </span>
          </div>

          <h4 className="text-2xl font-black text-slate-800 mb-1">Medication Reminder</h4>
          <p className="text-slate-500 text-sm font-medium mb-6">
            Voice instructions are playing now...
          </p>

          {/* Medicine info card */}
          <div className="w-full bg-slate-50 rounded-[2rem] p-6 mb-8 border border-slate-100">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Icons.Pill className="text-blue-600 w-5 h-5" />
              <h3 className="text-xl font-black text-slate-900">{medicine.name}</h3>
            </div>
            <div className="text-slate-500 font-bold px-4 py-1 bg-white inline-block rounded-full border border-slate-100 shadow-sm text-sm">
              {medicine.dosage}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 w-full">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { onTaken(medicine.id); onClose(); }}
              className="w-full bg-blue-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 hover:bg-blue-700 transition-colors"
            >
              <Icons.Check className="w-5 h-5" />
              I Have Taken It
            </motion.button>
            <button
              onClick={onClose}
              className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase tracking-[0.2em] text-[10px]"
            >
              Remind Me Later
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
            <Icons.Calendar className="w-3 h-3" />
            Still haven&apos;t taken? Repeats in 5 mins
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotificationToast;
