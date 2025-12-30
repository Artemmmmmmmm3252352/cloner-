import React, { useState } from 'react';
import { User, Lock, Mail, ArrowRight, Loader2, Sparkles, PenTool } from 'lucide-react';
import { User as UserType } from '../types';
import { dbLogin } from '../utils/mockDatabase';

interface AuthPageProps {
  onLogin: (user: UserType) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) return;

    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
        // Try to find existing user first to persist ID
        const existingUser = dbLogin(email);
        
        let userToLogin: UserType;

        if (existingUser) {
            userToLogin = existingUser;
            // Update name if provided during "signup" even if email exists
            if (!isLogin && name) {
                userToLogin = { ...existingUser, name: name, initials: name[0].toUpperCase() };
            }
        } else {
            // New User
            userToLogin = {
                id: 'u-' + Math.random().toString(36).substr(2, 9),
                email: email,
                name: isLogin ? (email.split('@')[0]) : name,
                initials: (isLogin ? email[0] : name[0]).toUpperCase(),
                avatar: '' 
            };
        }
        
        localStorage.setItem('surgical_user', JSON.stringify(userToLogin));
        onLogin(userToLogin);
        setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex font-sans text-surgical-steel bg-alabaster-haze">
      
      {/* Left Panel - Visual/Brand */}
      <div className="hidden lg:flex w-1/2 bg-[#292524] text-[#e7e5e4] flex-col justify-between p-12 relative overflow-hidden">
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
         
         <div className="relative z-10">
             <div className="w-10 h-10 bg-[#e7e5e4] rounded-full flex items-center justify-center text-[#292524] mb-6">
                 <PenTool size={20} />
             </div>
             <h1 className="text-4xl font-serif font-medium mb-4">The Atelier</h1>
             <p className="text-lg opacity-80 max-w-md font-serif italic">"Design is the silent ambassador of your brand."</p>
         </div>

         <div className="relative z-10 opacity-60 text-sm">
             <p>© 2024 Atelier Workspace. Crafted for clarity.</p>
         </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white shadow-2xl shadow-stone-200/50">
        <div className="w-full max-w-[400px] flex flex-col gap-8 animate-modal-entry">
            
            <div className="text-center lg:text-left">
                <h2 className="text-2xl font-bold text-surgical-steel mb-2">{isLogin ? 'Welcome back' : 'Create an account'}</h2>
                <p className="text-surgical-dim text-sm">Enter your details to access your workspace.</p>
            </div>

            {/* Toggle Switch */}
            <div className="bg-alabaster-haze p-1 rounded-lg flex self-center lg:self-start w-full lg:w-auto">
                <button 
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 lg:flex-none lg:w-32 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-white text-surgical-steel shadow-sm' : 'text-surgical-dim hover:text-surgical-steel'}`}
                >
                    Log In
                </button>
                <button 
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 lg:flex-none lg:w-32 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-white text-surgical-steel shadow-sm' : 'text-surgical-dim hover:text-surgical-steel'}`}
                >
                    Sign Up
                </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {!isLogin && (
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-surgical-dim uppercase tracking-wider">Full Name</label>
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surgical-dim" />
                            <input 
                                type="text" 
                                className="w-full bg-white border border-alabaster-vein rounded-lg py-3 pl-10 pr-3 text-sm outline-none focus:border-surgical-steel focus:ring-1 focus:ring-surgical-steel transition-all"
                                placeholder="Artemis Prime"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-surgical-dim uppercase tracking-wider">Email</label>
                    <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surgical-dim" />
                        <input 
                            type="email" 
                            className="w-full bg-white border border-alabaster-vein rounded-lg py-3 pl-10 pr-3 text-sm outline-none focus:border-surgical-steel focus:ring-1 focus:ring-surgical-steel transition-all"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-surgical-dim uppercase tracking-wider">Password</label>
                    <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surgical-dim" />
                        <input 
                            type="password" 
                            className="w-full bg-white border border-alabaster-vein rounded-lg py-3 pl-10 pr-3 text-sm outline-none focus:border-surgical-steel focus:ring-1 focus:ring-surgical-steel transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="mt-2 w-full bg-surgical-steel text-white py-3 rounded-lg text-sm font-medium hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group shadow-lg shadow-stone-200"
                >
                    {isLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <>
                            {isLogin ? 'Enter Workspace' : 'Start Creating'}
                            <ArrowRight size={16} className="opacity-70 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>
            
            <div className="text-center text-xs text-surgical-dim">
                By continuing, you agree to our <span className="underline cursor-pointer">Terms</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
            </div>
        </div>
      </div>

    </div>
  );
};