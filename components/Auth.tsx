
import React, { useState, useEffect } from 'react';
import { Mail, Shield, Globe, Cpu, ArrowRight, Fingerprint } from 'lucide-react';
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
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        onLogin({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        onLogin({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [onLogin]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Check your email for the magic link!' });
    }
    setIsLoading(false);
  };

  const handleSSOLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) setMessage({ type: 'error', text: error.message });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050505] overflow-hidden">
      <div className="hidden md:flex flex-1 relative items-center justify-center bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse"></div>
        </div>
        
        <div className="z-10 max-w-lg p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
              <Cpu className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tighter">{BRAND_NAME}</h1>
          </div>
          <h2 className="text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            The Future of <span className="text-blue-500">Universal</span> Communication.
          </h2>
          <p className="text-gray-400 text-xl leading-relaxed">
            Breaking language barriers in real-time with Eburon Live. 
            Experience conversation without limits with the Eburon ecosystem.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-zinc-950 relative">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Sign in to {BRAND_NAME}</h2>
            <p className="text-zinc-400">Join the next generation of meetings.</p>
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 ml-1">Email Address</label>
              <input 
                type="email" 
                required
                placeholder="name@eburon.ai"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Continue with Email <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-950 px-3 text-zinc-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={handleSSOLogin}
              className="flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 py-3 rounded-xl transition-all font-medium active:scale-[0.98]"
            >
              <Fingerprint className="w-5 h-5 text-blue-400" />
              Eburon Single Sign-On
            </button>
          </div>

          <p className="text-center text-sm text-zinc-500 pt-4">
            By continuing, you agree to Eburon's <a href="https://eburon.ai/terms" className="text-blue-500 hover:underline">Terms of Service</a> and <a href="https://eburon.ai/privacy" className="text-blue-500 hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
