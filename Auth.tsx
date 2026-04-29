import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserRole, User } from '../types';
import { Icons } from '../constants';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';

interface AuthProps {
  onLogin: (user: User) => void;
}

const HEALTH_TIPS = [
  'Stay hydrated: Drink at least 8 glasses of water a day.',
  'Consistency is key: Take your meds at the same time daily.',
  'Move your body: A 30-minute walk can boost your mood.',
  'Sleep well: Aim for 7-9 hours of quality rest.',
  'Mindfulness matters: Take 5 minutes to breathe deeply today.',
];

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>(UserRole.PATIENT);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setTipIndex((prev) => (prev + 1) % HEALTH_TIPS.length),
      5000
    );
    return () => clearInterval(interval);
  }, []);

  // ── Google Sign-In ──────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDoc = await getDoc(userDocRef);

      let finalRole = role;
      let finalName = fbUser.displayName || 'User';

      if (userDoc.exists()) {
        const data = userDoc.data();
        finalRole = data.role as UserRole;
        finalName = data.name;
      } else {
        await setDoc(userDocRef, {
          username: fbUser.email?.split('@')[0] || fbUser.uid.substring(0, 8),
          name: finalName,
          role: finalRole,
          createdAt: new Date().toISOString(),
        });
      }

      onLogin({
        id: fbUser.uid,
        username: fbUser.email || fbUser.uid,
        name: finalName,
        role: finalRole,
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('Google Auth error:', err);
      setError(e.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Email Auth ──────────────────────────────────────────────────────────────
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password || (!isLogin && !name)) {
      setError('Please fill in all fields');
      return;
    }
    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    // Pseudo-email so Firebase Auth is happy with username-style logins
    const email = `${username.toLowerCase().trim()}@meditrack.internal`;

    try {
      if (isLogin) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const userDocRef = doc(db, 'users', cred.user.uid);
        const userDoc = await getDoc(userDocRef);

        onLogin({
          id: cred.user.uid,
          username,
          name: userDoc.exists() ? (userDoc.data().name as string) : cred.user.displayName || username,
          role: userDoc.exists() ? (userDoc.data().role as UserRole) : role,
        });
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });

        const profile = { username, name, role, createdAt: new Date().toISOString() };
        try {
          await setDoc(doc(db, 'users', cred.user.uid), profile);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${cred.user.uid}`);
        }

        onLogin({ id: cred.user.uid, username, name, role });
      }
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      console.error('Auth error:', err);

      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setError('Invalid username or password');
      } else if (e.code === 'auth/email-already-in-use') {
        setError('Username already taken. Please choose another.');
      } else if (e.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters');
      } else if (e.code === 'auth/operation-not-allowed') {
        setError('Email login is not enabled. Please use Google Sign-In or enable Email/Password in Firebase.');
      } else {
        // Try to parse Firestore error JSON
        try {
          const parsed = JSON.parse(e.message || '{}') as { error?: string };
          setError(parsed.error ? `Database Error: ${parsed.error}` : (e.message || 'Authentication failed'));
        } catch {
          setError(e.message || 'Authentication failed');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white relative overflow-hidden">
      {/* ── Left Panel ──────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 overflow-hidden items-center justify-center p-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,#020617_100%)]" />

        {/* Bento grid background images */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-4 p-8 opacity-30">
          {[
            'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800',
          ].map((src, i) => (
            <motion.img
              key={src}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.4, scale: 1 }}
              transition={{ duration: 1.5, delay: i * 0.2 }}
              src={src}
              className="w-full h-full object-cover rounded-[2rem]"
              referrerPolicy="no-referrer"
              alt=""
            />
          ))}
        </div>

        {/* Content overlay */}
        <div className="relative z-10 w-full max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-4 mb-12">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-blue-500/40">
                M
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight">MediTrack</h1>
            </div>

            <h2 className="text-6xl font-black text-white mb-8 leading-[1.1]">
              Empowering Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Wellness Journey.
              </span>
            </h2>

            <p className="text-slate-400 text-xl mb-12 leading-relaxed max-w-md">
              The smart way to manage your health. Reminders, insights, and care, all in one place.
            </p>

            {/* Rotating health tip */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] mb-12">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                  Health Tip of the Day
                </span>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={tipIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-white font-medium text-lg"
                >
                  {HEALTH_TIPS[tipIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Trust stats */}
            <div className="flex gap-12">
              <div>
                <div className="text-white text-2xl font-black">99.9%</div>
                <div className="text-slate-500 text-xs uppercase font-bold tracking-wider">Reliability</div>
              </div>
              <div>
                <div className="text-white text-2xl font-black">24/7</div>
                <div className="text-slate-500 text-xs uppercase font-bold tracking-wider">AI Support</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Right Panel: Auth Form ───────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl -ml-48 -mb-48" />

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-white rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] overflow-hidden border border-slate-100">
            {/* Mobile header */}
            <div className="lg:hidden bg-slate-950 p-10 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-4">
                M
              </div>
              <h1 className="text-2xl font-black text-white">MediTrack</h1>
            </div>

            <div className="p-10 lg:p-14">
              <div className="mb-10 text-center lg:text-left">
                <h3 className="text-3xl font-black text-slate-900">
                  {isLogin ? 'Welcome Back' : 'Get Started'}
                </h3>
                <p className="text-slate-500 mt-2 font-medium">
                  {isLogin ? 'Sign in to manage your health' : 'Create your account in seconds'}
                </p>
              </div>

              {/* Role toggle */}
              <div className="mb-10">
                <div className="flex p-1.5 bg-slate-100 rounded-3xl">
                  {([UserRole.PATIENT, UserRole.CARETAKER] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.25rem] transition-all font-black text-xs uppercase tracking-widest ${
                        role === r
                          ? r === UserRole.PATIENT
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {r === UserRole.PATIENT ? <Icons.User /> : <Icons.Bell />}
                      {r === UserRole.PATIENT ? 'Patient' : 'Caretaker'}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAuth} className="space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isLogin ? 'login' : 'register'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    {/* Full Name – register only */}
                    {!isLogin && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                          Full Name
                        </label>
                        <div className="relative group">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                            <Icons.User />
                          </div>
                          <input
                            required
                            type="text"
                            placeholder="John Doe"
                            className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] pl-14 pr-6 py-4 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Username */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                        Username
                      </label>
                      <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                          <Icons.Pill />
                        </div>
                        <input
                          required
                          type="text"
                          placeholder="yourname123"
                          className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] pl-14 pr-6 py-4 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                        Password
                      </label>
                      <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                          <Icons.Settings />
                        </div>
                        <input
                          required
                          type="password"
                          placeholder="••••••••"
                          className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] pl-14 pr-6 py-4 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 bg-rose-50 text-rose-600 text-xs font-bold rounded-2xl text-center border border-rose-100"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Primary submit */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className={`w-full text-white font-black py-5 rounded-[1.5rem] shadow-2xl transition-all mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${
                    role === UserRole.PATIENT
                      ? 'bg-blue-600 shadow-blue-200 hover:bg-blue-700'
                      : 'bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700'
                  }`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : isLogin ? (
                    'Sign In Now'
                  ) : (
                    'Create Account'
                  )}
                </motion.button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Google Sign-In */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white border-2 border-slate-100 text-slate-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-70"
                >
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    className="w-5 h-5"
                    alt="Google"
                  />
                  Sign in with Google
                </motion.button>

                {/* Switch mode */}
                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                    className="text-slate-400 text-[10px] font-black hover:text-blue-600 transition-colors uppercase tracking-[0.2em]"
                  >
                    {isLogin
                      ? 'New to MediTrack? Join the community'
                      : 'Already a member? Sign in'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex justify-center gap-8 mt-12 opacity-40">
            {['Secure', 'Private', 'Verified'].map((label) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
