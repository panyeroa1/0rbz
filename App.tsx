
import React, { useState } from 'react';
import Auth from './components/Auth.tsx';
import Dashboard from './components/Dashboard.tsx';
import MeetingRoom from './components/MeetingRoom.tsx';
import { AppState, User, MeetingConfig } from './types.ts';

const App: React.FC = () => {
  const [view, setView] = useState<AppState>('auth');
  const [user, setUser] = useState<User | null>(null);
  const [meetingConfig, setMeetingConfig] = useState<MeetingConfig | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setView('dashboard');
  };

  const handleJoinMeeting = (config: MeetingConfig) => {
    setMeetingConfig(config);
    setView('meeting');
  };

  const handleLeaveMeeting = () => {
    setView('dashboard');
    setMeetingConfig(null);
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full bg-[#050505] text-white selection:bg-blue-500/30 overflow-hidden relative">
      {view === 'auth' && <Auth onLogin={handleLogin} />}
      {view === 'dashboard' && user && (
        <Dashboard 
          user={user} 
          onJoinMeeting={handleJoinMeeting} 
          onLogout={() => { setUser(null); setView('auth'); }}
        />
      )}
      {view === 'meeting' && meetingConfig && user && (
        <MeetingRoom 
          user={user}
          config={meetingConfig}
          onLeave={handleLeaveMeeting}
        />
      )}
    </div>
  );
};

export default App;
