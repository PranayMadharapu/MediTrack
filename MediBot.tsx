import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../constants';
import { getGeminiAdvisor } from '../services/geminiService';

interface MediBotProps {
  userName: string;
}

interface Message {
  role: 'user' | 'bot';
  text: string;
}

const MediBot: React.FC<MediBotProps> = ({ userName }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: `Hello ${userName.split(' ')[0]}! I am MediBot. How can I help you with your health or medicines today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await getGeminiAdvisor(userMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: response || "I'm sorry, I couldn't process that. Please try again.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'Error connecting to AI. Please check your internet connection.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-160px)] flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
          <Icons.Bot />
        </div>
        <div>
          <h2 className="font-black text-slate-800 tracking-tight">MediBot AI</h2>
          <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Active
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar bg-slate-50/30"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-[1.5rem] px-5 py-4 text-sm font-medium leading-relaxed shadow-sm ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-100'
                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 rounded-[1.5rem] px-5 py-4 text-slate-400 text-sm font-bold italic flex items-center gap-3 shadow-sm rounded-tl-none">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                <div
                  className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <div
                  className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
              </div>
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-5 md:p-6 bg-white border-t border-slate-100">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Ask about side effects, dosage, or health tips..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed active:scale-90"
            aria-label="Send"
          >
            <Icons.Send />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-4 font-bold uppercase tracking-widest italic opacity-70">
          Not a substitute for professional medical advice.
        </p>
      </div>
    </div>
  );
};

export default MediBot;
