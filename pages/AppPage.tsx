import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ChatWithArtifacts from '../components/ChatWithArtifacts';
import ChatSidebar from '../components/ChatSidebar';
import { useAuth } from '../contexts/AuthContext';
import { StyleLibraryItem, Slide } from '../types';
import { getUserChats } from '../services/firestoreService';

interface AppPageProps {
  styleLibrary: StyleLibraryItem[];
  onSlidesGenerated: (slides: Slide[]) => void;
}

export const AppPage: React.FC<AppPageProps> = ({ styleLibrary, onSlidesGenerated }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [recentChats, setRecentChats] = useState<Array<{ id: string; title: string; timestamp: number }>>([]);

  // Get initial prompt from navigation state (if navigated from landing page)
  const initialPrompt = location.state?.initialPrompt;

  // Load recent chats
  useEffect(() => {
    const loadRecentChats = async () => {
      if (user) {
        try {
          const chats = await getUserChats(user.uid);
          setRecentChats(chats.map(chat => ({
            id: chat.id,
            title: chat.title,
            timestamp: chat.createdAt
          })));
        } catch (error) {
          console.error('Error loading recent chats:', error);
        }
      }
    };

    loadRecentChats();
  }, [user]);

  const handleNewChat = () => {
    // Refresh the page to start a new chat
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-brand-text-primary font-sans overflow-hidden relative">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/4 w-[600px] h-[600px] bg-brand-primary-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
        <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 left-1/2 w-[400px] h-[400px] bg-purple-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Chat Sidebar */}
      <ChatSidebar
        user={user}
        onNewChat={handleNewChat}
        recentChats={recentChats}
        onSelectChat={(chatId) => {
          console.log('Loading chat:', chatId);
          // TODO: Implement chat loading
        }}
      />

      <main className="flex-grow flex flex-row overflow-hidden w-full">
        <ChatWithArtifacts
          user={user}
          styleLibrary={styleLibrary}
          onSignOut={() => {
            console.log('Sign out requested from artifacts panel');
          }}
          onOpenInEditor={(artifactSlides) => {
            console.log('Opening in classic editor with', artifactSlides.length, 'slides');
            onSlidesGenerated(artifactSlides);
          }}
          initialPrompt={initialPrompt}
        />
      </main>
    </div>
  );
};

export default AppPage;
