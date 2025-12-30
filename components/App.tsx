import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MainContent } from './components/MainContent';
import { HomeView } from './components/HomeView';
import { InboxView } from './components/InboxView';
import { ShareModal } from './components/ShareModal';
import { SearchModal } from './components/SearchModal';
import { MembersModal } from './components/MembersModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthPage } from './components/AuthPage';
import { NotificationsModal } from './components/NotificationsModal';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { Page, Block, Workspace, AccessLevel, Member, User, Language, Invitation } from './types';
import { translations, TranslationKey } from './utils/translations';
import { Menu } from 'lucide-react'; // Import Menu icon
import { 
    dbLogin, 
    dbRegisterUser, 
    dbGetWorkspacesForUser, 
    dbCreateWorkspace, 
    dbUpdateWorkspace, 
    dbAddPage, 
    dbUpdatePage,
    dbCreateInvitation,
    dbGetPendingInvitations,
    dbAcceptInvitation,
    dbDeclineInvitation,
    dbRemoveMember,
    dbUpdateMemberRole,
    dbUpdateUser
} from './utils/mockDatabase';

const generateId = () => Math.random().toString(36).substr(2, 9);
const TRASH_RETENTION_DAYS = 3;

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // App UI State
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  // Sidebar State - Responsive default
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  const shareBtnRef = useRef<HTMLButtonElement>(null);

  // Data State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  
  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Language & Theme State
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Translation Helper
  const t = useCallback((key: TranslationKey): string => {
      return translations[lang][key] || key;
  }, [lang]);

  // Handle Window Resize for Sidebar
  useEffect(() => {
      const handleResize = () => {
          if (window.innerWidth > 768) {
              setIsSidebarOpen(true);
          } else {
              setIsSidebarOpen(false);
          }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initial Data (Default Template for NEW users)
  const createDefaultWorkspace = (owner: User): Workspace => ({
      id: generateId(),
      name: 'Atelier',
      icon: '✒️',
      tag: 'Personal',
      activePageId: 'HOME',
      members: [{
          id: owner.id,
          email: owner.email,
          name: owner.name,
          avatar: owner.avatar || owner.initials,
          role: AccessLevel.OWNER
      }],
      pages: [
        {
          id: 'welcome-hub',
          title: 'Studio Journal',
          icon: '📓',
          coverStyle: null,
          blocks: [
            { id: generateId(), type: 'h1', content: 'Welcome to your Atelier' },
            { id: generateId(), type: 'text', content: 'A space designed for focus and clarity. Unlike other tools, your content sits on a clean sheet of paper.' },
            { id: generateId(), type: 'quote', content: 'Simplicity is the ultimate sophistication.' },
            { id: generateId(), type: 'h2', content: 'Getting Started' },
            { id: generateId(), type: 'todo', content: 'Try typing / to see commands' },
            { id: generateId(), type: 'todo', content: 'Create a new page from the sidebar' },
          ],
          comments: [],
          updatedAt: Date.now(),
          favorite: true,
          fullWidth: false,
          smallText: false
        }
      ]
  });
  
  // Track sent reminders to prevent duplicates
  const [sentReminders, setSentReminders] = useState<Set<string>>(new Set());

  // Refs
  const workspacesRef = useRef(workspaces);
  const sentRemindersRef = useRef(sentReminders);
  const activeWsIdRef = useRef(activeWorkspaceId);

  useEffect(() => { workspacesRef.current = workspaces; }, [workspaces]);
  useEffect(() => { sentRemindersRef.current = sentReminders; }, [sentReminders]);
  useEffect(() => { activeWsIdRef.current = activeWorkspaceId; }, [activeWorkspaceId]);

  // --- Toast Helper ---
  const addToast = (message: string, type: ToastType = 'info') => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts(prev => [...prev, { id, message, type }]);
  };
  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- Auth & Init Logic ---

  const refreshUserData = (currentUser: User) => {
      const userWorkspaces = dbGetWorkspacesForUser(currentUser.id, currentUser.email);
      const userInvites = dbGetPendingInvitations(currentUser.email);
      setWorkspaces(userWorkspaces);
      setInvitations(userInvites);
      
      const currentExists = userWorkspaces.find(w => w.id === activeWorkspaceId);
      if (userWorkspaces.length > 0 && !currentExists) {
          setActiveWorkspaceId(userWorkspaces[0].id);
      } else if (userWorkspaces.length === 0) {
          setActiveWorkspaceId(''); 
      }
  };

  useEffect(() => {
      const storedUser = localStorage.getItem('surgical_active_user_email');
      const storedLang = localStorage.getItem('surgical_lang');
      const storedTheme = localStorage.getItem('surgical_theme');
      
      if (storedLang === 'ru' || storedLang === 'en') setLang(storedLang as Language);
      if (storedTheme === 'dark' || storedTheme === 'light') setTheme(storedTheme as 'light' | 'dark');

      if (storedUser) {
          const dbUser = dbLogin(storedUser);
          if (dbUser) {
              setUser(dbUser);
              refreshUserData(dbUser);
          } else {
              localStorage.removeItem('surgical_active_user_email');
          }
      }
      setIsAuthChecking(false);
  }, []);

  const handleSetLang = (newLang: Language) => {
      setLang(newLang);
      localStorage.setItem('surgical_lang', newLang);
  };

  const handleSetTheme = (newTheme: 'light' | 'dark') => {
      setTheme(newTheme);
      localStorage.setItem('surgical_theme', newTheme);
  };

  useEffect(() => {
      if (theme === 'dark') document.body.classList.add('dark-mode');
      else document.body.classList.remove('dark-mode');
  }, [theme]);

  const handleLogin = (newUser: User) => {
      let dbUser = dbLogin(newUser.email);
      if (!dbUser) {
          dbUser = dbRegisterUser(newUser);
          const defaultWs = createDefaultWorkspace(dbUser);
          dbCreateWorkspace(defaultWs);
      }
      localStorage.setItem('surgical_active_user_email', dbUser.email);
      setUser(dbUser);
      refreshUserData(dbUser);
      addToast(`Welcome back, ${dbUser.name}`, 'success');
  };

  const handleLogout = () => {
      localStorage.removeItem('surgical_active_user_email');
      setUser(null);
      setWorkspaces([]);
      setInvitations([]);
      addToast('Logged out successfully', 'info');
  };

  const handleUpdateUserProfile = (updates: Partial<User>) => {
      if(!user) return;
      const updatedUser = dbUpdateUser(user.id, updates);
      if(updatedUser) {
          setUser(updatedUser);
          refreshUserData(updatedUser); // To update avatars in sidebar immediately if names changed
          addToast("Profile updated", "success");
      }
  };

  // --- Effects ---

  // Auto-cleanup trash
  useEffect(() => {
    if (!user) return;
    const cleanupThreshold = Date.now() - (TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    setWorkspaces(prev => prev.map(w => ({
      ...w,
      pages: w.pages.filter(p => !p.deletedAt || p.deletedAt > cleanupThreshold)
    })));
  }, [user]);

  // Poll for Reminders, Invites & Workspace Status
  useEffect(() => {
      if (!user) return;

      const checkInterval = setInterval(() => {
          const now = Date.now();
          const thirtyMins = 30 * 60 * 1000;
          
          const freshWorkspaces = dbGetWorkspacesForUser(user.id, user.email);
          const freshInvites = dbGetPendingInvitations(user.email);
          
          const currentWsIds = workspacesRef.current.map(w => w.id).sort().join(',');
          const freshWsIds = freshWorkspaces.map(w => w.id).sort().join(',');
          
          if (currentWsIds !== freshWsIds) {
              setWorkspaces(freshWorkspaces);
              const stillMember = freshWorkspaces.find(w => w.id === activeWsIdRef.current);
              if (!stillMember && freshWorkspaces.length > 0) {
                  setActiveWorkspaceId(freshWorkspaces[0].id);
                  addToast("You were removed from the previous workspace.", "error");
              }
          }

          if (JSON.stringify(freshInvites) !== JSON.stringify(invitations)) {
              if (freshInvites.length > invitations.length) {
                  addToast("You have a new invitation!", "info");
              }
              setInvitations(freshInvites);
          }

          const currentWorkspaces = workspacesRef.current;
          const currentSent = sentRemindersRef.current;
          let newSentKeys: string[] = [];

          currentWorkspaces.forEach(ws => {
              ws.pages.forEach(p => {
                  if (p.deletedAt) return;
                  p.blocks.forEach(b => {
                      if (b.metadata?.reminder) {
                          const { timestamp, title } = b.metadata.reminder;
                          const key = `${p.id}-${b.id}-${timestamp}`;
                          if (currentSent.has(key)) return;
                          const diff = timestamp - now;
                          if (diff > 0 && diff <= thirtyMins) {
                              if (Notification.permission === 'granted') {
                                  new Notification(`Upcoming: ${title}`, {
                                      body: `Happening in ${Math.ceil(diff / 60000)} minutes`,
                                      icon: p.icon && p.icon.startsWith('http') ? p.icon : undefined,
                                      tag: key
                                  });
                              } else {
                                  addToast(`Upcoming: ${title}`, 'info');
                              }
                              newSentKeys.push(key);
                          }
                      }
                  });
              });
          });

          if (newSentKeys.length > 0) {
              setSentReminders(prev => {
                  const next = new Set(prev);
                  newSentKeys.forEach(k => next.add(k));
                  return next;
              });
          }

      }, 3000);

      return () => clearInterval(checkInterval);
  }, [user, invitations]);

  // --- Handlers ---

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
  const activePageId = activeWorkspace?.activePageId || 'HOME';
  const pages = activeWorkspace?.pages || [];
  const activePage = pages.find(p => p.id === activePageId && !p.deletedAt);
  
  // Determine current user's role
  const currentUserRole = activeWorkspace?.members.find(m => m.id === user?.id)?.role || AccessLevel.CAN_VIEW;

  const handleSwitchWorkspace = useCallback((id: string) => {
    setActiveWorkspaceId(id);
    setIsShareOpen(false);
    if (window.innerWidth <= 768) setIsSidebarOpen(false); // Close mobile sidebar on switch
  }, []);

  const handleCreateWorkspace = useCallback(() => {
    if (!user) return;
    const newWorkspace: Workspace = {
      id: generateId(),
      name: `Workspace ${workspaces.length + 1}`,
      icon: '🚀',
      tag: 'Personal',
      pages: [], 
      activePageId: 'HOME',
      members: [{
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar || user.initials,
          role: AccessLevel.OWNER
      }]
    };
    dbCreateWorkspace(newWorkspace);
    setWorkspaces(prev => [...prev, newWorkspace]);
    setActiveWorkspaceId(newWorkspace.id);
    addToast("Workspace created", "success");
  }, [workspaces.length, user]);

  const handleUpdateWorkspace = useCallback((id: string, updates: Partial<Workspace>) => {
    dbUpdateWorkspace(id, updates);
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const handleInviteMember = (email: string, role: AccessLevel) => {
      if (!user) return;
      const result = dbCreateInvitation(user, email, activeWorkspaceId, role);
      if (result && result.success) {
          addToast(`Invitation sent to ${email}`, 'success');
      } else {
          addToast(result?.message || "Failed to send invitation", 'error');
      }
  };

  const handleAcceptInvite = (inviteId: string) => {
      if (!user) return;
      const joinedWorkspaceId = dbAcceptInvitation(inviteId, user);
      if (joinedWorkspaceId) {
          const freshWorkspaces = dbGetWorkspacesForUser(user.id, user.email);
          setWorkspaces(freshWorkspaces);
          setActiveWorkspaceId(joinedWorkspaceId);
          setInvitations(prev => prev.filter(i => i.id !== inviteId));
          setIsNotificationsOpen(false);
          addToast("Invitation accepted!", "success");
      }
  };

  const handleDeclineInvite = (inviteId: string) => {
      dbDeclineInvitation(inviteId);
      if (user) {
          setInvitations(prev => prev.filter(i => i.id !== inviteId));
          addToast("Invitation declined", "info");
      }
  };

  const handleUpdateMemberRole = (memberId: string, newRole: AccessLevel) => {
      dbUpdateMemberRole(activeWorkspaceId, memberId, newRole);
      setWorkspaces(prev => prev.map(w => 
          w.id === activeWorkspaceId ? { ...w, members: w.members.map(m => m.id === memberId ? { ...m, role: newRole } : m) } : w
      ));
      addToast("Role updated", "success");
  };

  const handleRemoveMember = (memberId: string) => {
      dbRemoveMember(activeWorkspaceId, memberId);
      setWorkspaces(prev => prev.map(w => 
          w.id === activeWorkspaceId ? { ...w, members: w.members.filter(m => m.id !== memberId) } : w
      ));
      addToast("Member removed", "info");
  };

  const setActivePageIdForWorkspace = useCallback((pageId: string) => {
    dbUpdateWorkspace(activeWorkspaceId, { activePageId: pageId });
    setWorkspaces(prev => prev.map(w => w.id === activeWorkspaceId ? { ...w, activePageId: pageId } : w));
    if (window.innerWidth <= 768) setIsSidebarOpen(false); // Close mobile sidebar on nav
  }, [activeWorkspaceId]);

  const handleCreatePage = useCallback((parentId?: string) => {
    const newPage: Page = {
      id: generateId(),
      parentId: parentId,
      title: '',
      icon: null,
      coverStyle: null,
      blocks: [{ id: generateId(), type: 'text', content: '' }],
      comments: [],
      updatedAt: Date.now()
    };
    dbAddPage(activeWorkspaceId, newPage);
    setWorkspaces(prev => prev.map(w => {
      if (w.id === activeWorkspaceId) {
        return { ...w, pages: [...w.pages, newPage], activePageId: newPage.id };
      }
      return w;
    }));
    return newPage.id;
  }, [activeWorkspaceId]);

  const handleUpdatePage = useCallback((updatedPage: Page) => {
    dbUpdatePage(activeWorkspaceId, updatedPage);
    setWorkspaces(prev => prev.map(w => {
      if (w.id === activeWorkspaceId) {
        return { ...w, pages: w.pages.map(p => p.id === updatedPage.id ? updatedPage : p) };
      }
      return w;
    }));
  }, [activeWorkspaceId]);

  const handleToggleFavorite = useCallback((pageId?: string) => {
      const targetId = pageId || activePageId;
      if (targetId === 'HOME') return;
      const targetPage = pages.find(p => p.id === targetId);
      if(targetPage) {
          const updated = { ...targetPage, favorite: !targetPage.favorite };
          handleUpdatePage(updated);
      }
  }, [activeWorkspaceId, activePageId, pages, handleUpdatePage]);

  const handleDeletePage = useCallback((pageId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetPage = pages.find(p => p.id === pageId);
    if(targetPage) {
        const updated = { ...targetPage, deletedAt: Date.now() };
        dbUpdatePage(activeWorkspaceId, updated);
        setWorkspaces(prev => prev.map(w => {
            if (w.id === activeWorkspaceId) {
                let newActiveId = w.activePageId;
                if (w.activePageId === pageId) newActiveId = 'HOME';
                return { ...w, pages: w.pages.map(p => p.id === pageId ? updated : p), activePageId: newActiveId };
            }
            return w;
        }));
        addToast("Page moved to trash", "info");
    }
  }, [activeWorkspaceId, pages]);

  const handleRestorePage = useCallback((pageId: string) => {
    const targetPage = pages.find(p => p.id === pageId);
    if(targetPage) {
        const updated = { ...targetPage, deletedAt: undefined };
        dbUpdatePage(activeWorkspaceId, updated);
        setWorkspaces(prev => prev.map(w => {
            if (w.id === activeWorkspaceId) {
                return { ...w, pages: w.pages.map(p => p.id === pageId ? updated : p) };
            }
            return w;
        }));
        addToast("Page restored", "success");
    }
  }, [activeWorkspaceId, pages]);

  const handlePermanentDeletePage = useCallback((pageId: string) => {
      const ws = workspaces.find(w => w.id === activeWorkspaceId);
      if(ws) {
          const remainingPages = ws.pages.filter(p => p.id !== pageId);
          dbUpdateWorkspace(activeWorkspaceId, { pages: remainingPages });
          setWorkspaces(prev => prev.map(w => {
              if (w.id === activeWorkspaceId) {
                  return { ...w, pages: remainingPages };
              }
              return w;
          }));
          addToast("Page permanently deleted", "error");
      }
  }, [activeWorkspaceId, workspaces]);

  // Handle task check from Dashboard - UPDATED to use blockId
  const handleTaskToggle = (pageId: string, blockId: string) => {
      const page = pages.find(p => p.id === pageId);
      if (page) {
          // Find the exact block by ID
          const blockIndex = page.blocks.findIndex(b => b.id === blockId);
          if (blockIndex !== -1) {
              const newBlocks = [...page.blocks];
              newBlocks[blockIndex] = { ...newBlocks[blockIndex], checked: !newBlocks[blockIndex].checked };
              const updatedPage = { ...page, blocks: newBlocks, updatedAt: Date.now() };
              handleUpdatePage(updatedPage);
              addToast("Task updated!", "success");
          }
      }
  };

  if (isAuthChecking) return <div className="flex w-full h-screen bg-alabaster-haze items-center justify-center text-surgical-dim">Loading...</div>;
  if (!user) return <AuthPage onLogin={handleLogin} />;

  return (
    <div className="flex w-full h-screen bg-alabaster-haze text-surgical-steel font-sans overflow-hidden transition-colors duration-300">
      
      {/* Sidebar - Collapsible on Mobile */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentUser={user}
        onLogout={handleLogout}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onSwitchWorkspace={handleSwitchWorkspace}
        onCreateWorkspace={handleCreateWorkspace}
        onUpdateWorkspace={handleUpdateWorkspace}
        activePageId={activePageId}
        onNavigate={setActivePageIdForWorkspace}
        onCreatePage={handleCreatePage}
        onDeletePage={handleDeletePage}
        onRestorePage={handleRestorePage}
        onPermanentDeletePage={handlePermanentDeletePage}
        onSearch={() => setIsSearchOpen(true)}
        onOpenMembersModal={() => setIsMembersModalOpen(true)}
        lang={lang}
        setLang={handleSetLang}
        t={t}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        notificationCount={invitations.length}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-grow flex flex-col relative h-full p-0 sm:p-2 sm:pl-0 min-w-0 transition-all duration-300">
         
         {/* Hamburger Menu for Mobile */}
         {!isSidebarOpen && (
             <button 
                onClick={() => setIsSidebarOpen(true)}
                className="absolute top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-sm border border-alabaster-vein text-surgical-dim hover:text-surgical-steel sm:hidden"
             >
                 <Menu size={20} />
             </button>
         )}

         {/* Wrapper for the "Sheet" effect */}
         <div className="flex-grow flex flex-col bg-white sm:rounded-xl shadow-sheet overflow-hidden border border-alabaster-vein relative h-full">
            
            <Header 
                onShareClick={() => setIsShareOpen(!isShareOpen)} 
                shareBtnRef={shareBtnRef}
                isShareOpen={isShareOpen}
                showComments={showComments}
                onToggleComments={() => setShowComments(!showComments)}
                title={activePage ? activePage.title : "Home"}
                isHome={activePageId === 'HOME'}
                isInbox={activePageId === 'INBOX'}
                isFavorite={activePage?.favorite}
                onToggleFavorite={() => handleToggleFavorite(activePageId)}
                t={t}
                activePage={activePage}
                onUpdatePage={handleUpdatePage}
                allPages={pages}
                onNavigate={setActivePageIdForWorkspace}
                role={currentUserRole}
            />
            
            {activePageId === 'HOME' ? (
                <HomeView 
                    pages={pages.filter(p => !p.deletedAt)} 
                    onNavigate={setActivePageIdForWorkspace} 
                    onToggleTask={handleTaskToggle}
                    t={t} 
                />
            ) : activePageId === 'INBOX' ? (
                <InboxView pages={pages.filter(p => !p.deletedAt)} onNavigate={setActivePageIdForWorkspace} t={t} />
            ) : activePage ? (
                <MainContent 
                    key={activePage.id} 
                    page={activePage}
                    currentUser={user}
                    onUpdatePage={handleUpdatePage}
                    showComments={showComments}
                    setShowComments={setShowComments}
                    t={t}
                    role={currentUserRole}
                    onCreateSubPage={handleCreatePage}
                    onNavigate={setActivePageIdForWorkspace}
                />
            ) : (
                <HomeView 
                    pages={pages.filter(p => !p.deletedAt)} 
                    onNavigate={setActivePageIdForWorkspace} 
                    onToggleTask={handleTaskToggle}
                    t={t} 
                />
            )}
        </div>

        <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} triggerRef={shareBtnRef} t={t} />
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} pages={pages.filter(p => !p.deletedAt)} onNavigate={setActivePageIdForWorkspace} t={t} />
        <SettingsModal 
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            currentUser={user}
            onUpdateUser={handleUpdateUserProfile}
            theme={theme}
            setTheme={handleSetTheme}
            lang={lang}
            setLang={handleSetLang}
            t={t}
        />
        <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} invitations={invitations} onAccept={handleAcceptInvite} onDecline={handleDeclineInvite} />
        {activeWorkspace && (
             <MembersModal isOpen={isMembersModalOpen} onClose={() => setIsMembersModalOpen(false)} workspace={activeWorkspace} onInvite={handleInviteMember} onUpdateRole={handleUpdateMemberRole} onRemoveMember={handleRemoveMember} t={t} />
        )}
      </main>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default App;