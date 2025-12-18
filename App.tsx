
import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import MeetingRoom from './components/MeetingRoom';
import { AppState, User, MeetingConfig } from './types';

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
    <div className="h-screen w-full bg-[#050505] text-white selection:bg-blue-500/30">
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
