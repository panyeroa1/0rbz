
import React, { useState, useEffect } from 'react';
import { Mail, Shield, Globe, Cpu, ArrowRight, Fingerprint, Orbit, Ghost, UserCircle } from 'lucide-react';
import { BRAND_NAME } from '../constants';
import { supabase } from '../services/supabase';

interface AuthProps {
  onLogin: (user: { id: string; email: string; name: string }) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        onLogin({
          id: session.user.id,
          email: session.user.email || 'anonymous@orbit.ai',
          name: session.user.user_metadata?.full_name || (session.user.is_anonymous ? `Voyager ${session.user.id.slice(0, 4)}` : session.user.email?.split('@')[0]) || 'Explorer'
        });
      }
    });
  }, [onLogin]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) setMessage({ type: 'error', text: error.message });
    else setMessage({ type: 'success', text: 'Check your email for the magic link!' });
    setIsLoading(false);
  };

  const handleSSOLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) setMessage({ type: 'error', text: error.message });
  };

  const handleGuestLogin = async () => {
    setIsLoading(true); setMessage(null);
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else if (data.user) {
      onLogin({
        id: data.user.id,
        email: 'anonymous@orbit.ai',
        name: `Guest Voyager ${data.user.id.slice(0, 4)}`
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-0 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-2xl overflow-hidden">
        
        {/* Visual Side */}
        <div className="p-12 bg-gradient-to-br from-blue-900/40 via-transparent to-purple-900/40 border-r border-white/5 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-[0_0_20px_#3b82f666]">
              <Orbit className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">{BRAND_NAME}</h1>
          </div>
          <h2 className="text-5xl font-black leading-tight mb-6">Connect Beyond <span className="text-blue-500">Dimensions.</span></h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Orbit uses native-audio LLMs to translate emotions, not just words. Experience the 10x better way to communicate.
          </p>
        </div>

        {/* Form Side */}
        <div className="p-12 flex flex-col justify-center bg-zinc-950/40">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-2xl font-bold mb-2">Initialize Orbit</h2>
            <p className="text-zinc-500">Secure entry to the universal network.</p>
          </div>

          {message && <div className={`p-4 rounded-xl text-sm font-medium mb-6 ${message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>{message.text}</div>}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <input 
              type="email" required placeholder="your@email.com"
              className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <button disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-3">
              {isLoading ? 'Processing...' : <>Connect <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <div className="relative my-8">
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
             <span className="relative flex justify-center text-[10px] font-black uppercase text-zinc-600 bg-transparent px-4">Satellite Gateway</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={handleSSOLogin} className="bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all">
              <Fingerprint className="w-5 h-5 text-blue-400" />
              <span className="text-xs uppercase tracking-wider">SSO</span>
            </button>
            <button onClick={handleGuestLogin} disabled={isLoading} className="bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all">
              <Ghost className="w-5 h-5 text-purple-400" />
              <span className="text-xs uppercase tracking-wider">Guest</span>
            </button>
          </div>
          
          <p className="mt-8 text-center text-xs text-zinc-600 font-medium">
            By connecting, you agree to the Orbit Universal Terms.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
