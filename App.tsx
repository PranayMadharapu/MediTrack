import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { UserRole, Medicine, IntakeLog, User } from './types';
import { Icons } from './constants';
import Sidebar from './components/Sidebar';
import PatientDashboard from './components/PatientDashboard';
import HealthReports from './components/HealthReports';
import MediBot from './components/MediBot';
import MedicineModal from './components/MedicineModal';
import NotificationToast from './components/NotificationToast';
import Auth from './components/Auth';
import { generateVoiceReminder } from './services/geminiService';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';

// ─── Audio helpers ────────────────────────────────────────────────────────────
function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let ch = 0; ch < numChannels; ch++) {
    const channelData = buffer.getChannelData(ch);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + ch] / 32768.0;
    }
  }
  return buffer;
}

// ─── Loading screen ───────────────────────────────────────────────────────────
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-2xl shadow-blue-200 animate-pulse">
        M
      </div>
      <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
        Loading MediTrack…
      </p>
    </div>
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [logs, setLogs] = useState<IntakeLog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [activeNotification, setActiveNotification] = useState<Medicine | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const isGeneratingVoiceRef = useRef(false);

  // ── Audio init ──────────────────────────────────────────────────────────────
  const initAudio = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx({ sampleRate: 24000 });
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      setIsAudioEnabled(true);
    } catch (e) {
      console.error('Audio init failed', e);
    }
  }, []);

  // Resume suspended audio context on any click
  useEffect(() => {
    const handler = () => {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume().then(() => setIsAudioEnabled(true));
      }
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  // Request notification permission once user is set
  useEffect(() => {
    if (user && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [user]);

  // ── Firebase Auth listener ──────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const sessionUser = sessionStorage.getItem('active_med_user');
        if (sessionUser) {
          const parsed = JSON.parse(sessionUser) as User;
          if (parsed.id === fbUser.uid) {
            setUser(parsed);
            setLoading(false);
            return;
          }
        }

        // Fetch profile from Firestore
        getDoc(doc(db, 'users', fbUser.uid))
          .then((snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              const newUser: User = {
                id: fbUser.uid,
                username: data.username as string,
                name: data.name as string,
                role: data.role as UserRole,
              };
              setUser(newUser);
              sessionStorage.setItem('active_med_user', JSON.stringify(newUser));
            }
          })
          .catch((err) => console.error('Error fetching user doc:', err))
          .finally(() => setLoading(false));
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // ── Firestore real-time sync ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setMedicines([]);
      setLogs([]);
      return;
    }

    const medsPath = `users/${user.id}/medicines`;
    const unsubMeds = onSnapshot(
      query(collection(db, medsPath), orderBy('time', 'asc')),
      (snapshot) =>
        setMedicines(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Medicine))),
      (err) => handleFirestoreError(err, OperationType.LIST, medsPath),
    );

    const logsPath = `users/${user.id}/logs`;
    const unsubLogs = onSnapshot(
      query(collection(db, logsPath), orderBy('timestamp', 'desc')),
      (snapshot) =>
        setLogs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as IntakeLog))),
      (err) => handleFirestoreError(err, OperationType.LIST, logsPath),
    );

    return () => {
      unsubMeds();
      unsubLogs();
    };
  }, [user]);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem('active_med_user');
      setUser(null);
      setIsAudioEnabled(false);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // ── Voice reminder ──────────────────────────────────────────────────────────
  const playVoiceReminder = async (medicine: Medicine, isFollowUp: boolean) => {
    if (isGeneratingVoiceRef.current) return;
    initAudio();

    try {
      isGeneratingVoiceRef.current = true;
      const greeting = isFollowUp
        ? `Attention ${user?.name}. This is a repeat reminder for your safety.`
        : `Hello ${user?.name}. It is now the scheduled time for your medication.`;

      const prompt = `${greeting} Please take ${medicine.dosage} of ${medicine.name}. ${
        medicine.instructions ? `Special instructions: ${medicine.instructions}.` : ''
      } I will repeat this reminder every 5 minutes until you confirm it is taken. Stay healthy!`;

      const base64Audio = await generateVoiceReminder(prompt);

      // If base64 audio returned (e.g. from a TTS service), play it
      if (base64Audio && audioContextRef.current) {
        const audioBytes = decodeBase64(base64Audio);
        const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start();
      }
      // Otherwise Web Speech API already played it inside generateVoiceReminder
    } catch (err) {
      console.error('Voice reminder failed:', err);
    } finally {
      isGeneratingVoiceRef.current = false;
    }
  };

  // ── Mark medicine status ────────────────────────────────────────────────────
  const handleMarkStatus = useCallback(
    async (medicineId: string, status: 'taken' | 'missed' | 'delayed') => {
      if (!user) return;
      const logsPath = `users/${user.id}/logs`;
      try {
        await addDoc(collection(db, logsPath), {
          medicineId,
          timestamp: new Date().toISOString(),
          status,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, logsPath);
      }
    },
    [user],
  );

  // ── Reminder interval ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || user.role !== UserRole.PATIENT) return;

    const checkReminders = () => {
      const now = new Date();
      const nowTs = now.getTime();
      const todayStr = now.toISOString().split('T')[0];

      medicines.forEach((med) => {
        const [medH, medM] = med.time.split(':').map(Number);
        const medTime = new Date();
        medTime.setHours(medH, medM, 0, 0);

        if (nowTs >= medTime.getTime()) {
          const alreadyLogged = logs.find(
            (l) => l.medicineId === med.id && l.timestamp.startsWith(todayStr),
          );
          if (!alreadyLogged) {
            const key = `remind_track_${user.id}_${med.id}_${todayStr}`;
            const lastStr = localStorage.getItem(key);
            const lastTime = lastStr ? parseInt(lastStr, 10) : 0;
            const fiveMin = 5 * 60 * 1000;

            if (lastTime === 0 || nowTs - lastTime >= fiveMin) {
              const isFollowUp = lastTime !== 0;
              setActiveNotification(med);
              localStorage.setItem(key, nowTs.toString());
              playVoiceReminder(med, isFollowUp);

              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`MediTrack Reminder: ${med.name}`, {
                  body: `Time for your ${med.dosage} dose.`,
                  icon: '/favicon.svg',
                });
              }
            }
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicines, logs, user]);

  // ── Save medicine ───────────────────────────────────────────────────────────
  const handleSaveMedicine = async (medicine: Medicine) => {
    if (!user) return;
    const medsPath = `users/${user.id}/medicines`;
    try {
      if (editingMedicine) {
        const { id, ...medData } = medicine;
        await updateDoc(doc(db, medsPath, id), {
          ...medData,
          updatedAt: serverTimestamp(),
        });
      } else {
        const { id: _id, ...medData } = medicine;
        await addDoc(collection(db, medsPath), {
          ...medData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setEditingMedicine(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, medsPath);
    }
  };

  // ── Delete medicine ─────────────────────────────────────────────────────────
  const handleDeleteMedicine = async (id: string) => {
    if (!user) return;
    const path = `users/${user.id}/medicines/${id}`;
    try {
      await deleteDoc(doc(db, path));
      setEditingMedicine(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // ── Guards ──────────────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;

  if (!user) {
    return (
      <Auth
        onLogin={(u) => {
          setUser(u);
          sessionStorage.setItem('active_med_user', JSON.stringify(u));
          initAudio();
        }}
      />
    );
  }

  // ── Tab content ─────────────────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <PatientDashboard
            medicines={medicines}
            logs={logs}
            onMarkStatus={handleMarkStatus}
            onDeleteMedicine={handleDeleteMedicine}
            userName={user.name}
          />
        );

      case 'medicines':
        return (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Prescription Schedule</h2>
                <p className="text-slate-500 text-sm">Manage medication timings here</p>
              </div>
              <button
                onClick={() => { setEditingMedicine(null); setIsModalOpen(true); initAudio(); }}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
              >
                <Icons.Plus /> Add Medicine
              </button>
            </div>

            {medicines.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                <Icons.Pill className="mx-auto mb-4 text-slate-300 w-10 h-10" />
                <p className="text-slate-400 font-bold mb-2">No medicines added yet</p>
                <p className="text-slate-400 text-sm">Click &ldquo;Add Medicine&rdquo; to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {medicines.map((med) => (
                  <div
                    key={med.id}
                    className="p-6 border border-slate-100 rounded-3xl bg-slate-50 flex flex-col justify-between hover:border-blue-200 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
                        <Icons.Pill />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingMedicine(med); setIsModalOpen(true); }}
                          className="text-slate-300 hover:text-blue-600 transition-colors p-1"
                          title="Edit"
                        >
                          <Icons.Settings />
                        </button>
                        <button
                          onClick={() => handleDeleteMedicine(med.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                          title="Remove"
                        >
                          <Icons.Trash />
                        </button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-lg">{med.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-blue-600 font-black text-sm">{med.time}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="text-slate-500 text-xs font-bold">{med.dosage}</span>
                      </div>
                      <p className="text-[10px] text-blue-500 font-black mt-3 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        Voice Active
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'assistant':
        return <MediBot userName={user.name} />;

      case 'reports':
        return <HealthReports medicines={medicines} logs={logs} userName={user.name} />;

      default:
        return (
          <PatientDashboard
            medicines={medicines}
            logs={logs}
            onMarkStatus={handleMarkStatus}
            onDeleteMedicine={handleDeleteMedicine}
            userName={user.name}
          />
        );
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      {/* Enable voice alert button (shown if audio blocked) */}
      {!isAudioEnabled && user.role === UserRole.PATIENT && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 md:bottom-4 left-4 z-50"
        >
          <button
            onClick={initAudio}
            className="bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200 flex items-center gap-2 shadow-sm animate-bounce"
          >
            <Icons.Bell className="w-3 h-3" />
            Enable Voice Alerts
          </button>
        </motion.div>
      )}

      {/* Main content */}
      <main className="flex-1 p-4 md:ml-64 lg:p-10 pt-6 md:pt-10 pb-24 md:pb-10">
        <div className="max-w-6xl mx-auto">{renderContent()}</div>
      </main>

      {/* Notification toast */}
      <AnimatePresence>
        {activeNotification && (
          <NotificationToast
            medicine={activeNotification}
            onClose={() => setActiveNotification(null)}
            onTaken={(id) => handleMarkStatus(id, 'taken')}
          />
        )}
      </AnimatePresence>

      {/* Medicine modal */}
      <MedicineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMedicine}
        onDelete={handleDeleteMedicine}
        initialData={editingMedicine}
      />
    </div>
  );
};

export default App;
