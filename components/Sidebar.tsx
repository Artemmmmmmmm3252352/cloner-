import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Home, 
  Inbox, 
  PlusCircle, 
  ChevronDown,
  ChevronRight,
  FileText,
  Trash2,
  Check,
  Plus,
  Edit2,
  Smile,
  UserPlus,
  RefreshCw,
  X,
  Activity,
  LogOut,
  Settings,
  Bell,
  PanelLeftClose,
  Layout
} from 'lucide-react';
import { Page, Workspace, User, Language } from '../types';
import { testAIConnection } from '../utils/aiHelper';
import { TranslationKey } from '../utils/translations';

const WORKSPACE_EMOJIS = ['🚀', '💼', '🎓', '🏠', '🎨', '💻', '📝', '🔬', '🌟', '⚡'];
const WORKSPACE_TAGS = ['Personal', 'Work', 'School', 'Project', 'Side Hustle'];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLogout: () => void;
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  onSwitchWorkspace: (id: string) => void;
  onCreateWorkspace: () => void;
  onUpdateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  activePageId: string;
  onNavigate: (id: string) => void;
  onCreatePage: (parentId?: string) => void;
  onDeletePage: (id: string, e?: React.MouseEvent) => void;
  onRestorePage: (id: string) => void;
  onPermanentDeletePage: (id: string) => void;
  onSearch: () => void;
  onOpenMembersModal?: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  onOpenSettings: () => void;
  notificationCount: number;
  onOpenNotifications: () => void;
}

const SidebarItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  isActive?: boolean;
  hasChevron?: boolean;
  onClick?: () => void;
  badge?: number;
}> = ({ icon, label, isActive, hasChevron, onClick, badge }) => (
  <div 
    onClick={onClick}
    className={`
      group flex items-center px-3 py-1.5 mx-2 rounded-lg cursor-pointer
      text-[14px] text-surgical-dim transition-all duration-200 ease-in-out
      hover:bg-white/60 hover:text-surgical-steel
      ${isActive ? 'bg-white text-surgical-steel font-medium shadow-sm ring-1 ring-black/5' : ''}
    `}
  >
    <span className={`mr-2.5 w-[18px] h-[18px] flex items-center justify-center shrink-0 ${isActive ? 'text-surgical-steel' : 'text-surgical-dim group-hover:text-surgical-steel'}`}>
      {icon}
    </span>
    <span className="flex-grow truncate">{label || "Untitled"}</span>
    {badge !== undefined && badge > 0 && (
        <span className="bg-surgical-steel text-white text-[9px] font-bold px-1.5 h-4 flex items-center justify-center rounded-full ml-2">
            {badge}
        </span>
    )}
    {hasChevron && <ChevronDown size={14} className="text-surgical-dim opacity-0 group-hover:opacity-100" />}
  </div>
);

// --- Recursive Page Tree Item ---

const PageTreeItem: React.FC<{
    page: Page;
    level: number;
    activePageId: string;
    expandedIds: Set<string>;
    onToggleExpand: (id: string, e: React.MouseEvent) => void;
    onNavigate: (id: string) => void;
    onDeletePage: (id: string, e: React.MouseEvent) => void;
    onCreatePage: (parentId?: string) => void;
    allPages: Page[]; // Needed to check for children
    t: (key: TranslationKey) => string;
}> = ({ page, level, activePageId, expandedIds, onToggleExpand, onNavigate, onDeletePage, onCreatePage, allPages, t }) => {
    // Check if this page has children (that are not deleted)
    const children = allPages.filter(p => p.parentId === page.id && !p.deletedAt);
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(page.id);
    const isActive = activePageId === page.id;

    return (
        <>
            <div 
                className={`
                    group flex items-center py-1.5 pr-2 rounded-lg cursor-pointer
                    text-[14px] transition-all duration-100 ease-in-out
                    mx-2 relative
                    ${isActive ? 'bg-white text-surgical-steel font-medium shadow-sm ring-1 ring-black/5' : 'text-surgical-dim hover:bg-white/60 hover:text-surgical-steel'}
                `}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => onNavigate(page.id)}
            >
                {/* Expander Arrow */}
                <div 
                    className="w-[18px] h-[18px] flex items-center justify-center rounded hover:bg-black/5 mr-1 text-surgical-dim shrink-0 transition-colors z-10"
                    onClick={(e) => {
                         e.stopPropagation();
                         onToggleExpand(page.id, e);
                    }}
                >
                    {hasChildren ? (
                        isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                    ) : (
                        <div className="w-[4px] h-[4px] rounded-full bg-surgical-dim opacity-0 group-hover:opacity-30" />
                    )}
                </div>

                {/* Icon & Title */}
                <span className="mr-2 text-surgical-dim shrink-0 flex items-center justify-center h-[18px] w-[18px] opacity-80">
                   {page.icon ? <span className="text-sm">{page.icon}</span> : <FileText size={14} />}
                </span>
                <span className="truncate flex-grow">{page.title || t('untitled')}</span>

                {/* Actions (Add Child, Delete) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 bg-white/90 ring-1 ring-black/5 pl-1 rounded shadow-sm backdrop-blur-sm">
                     <div 
                        role="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeletePage(page.id, e);
                        }}
                        className="p-1 hover:bg-red-50 rounded text-surgical-dim hover:text-red-600 transition-all"
                        title="Move to Trash"
                    >
                        <Trash2 size={12} />
                    </div>
                    <div 
                        role="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCreatePage(page.id);
                            if (!isExpanded) onToggleExpand(page.id, e); // Auto expand when adding child
                        }}
                        className="p-1 hover:bg-stone-100 rounded text-surgical-dim hover:text-surgical-steel transition-all"
                        title="Add sub-page"
                    >
                        <Plus size={12} />
                    </div>
                </div>
            </div>
            
            {/* Recursive Children */}
            {isExpanded && hasChildren && (
                <div className="flex flex-col relative">
                    {children.map(child => (
                        <PageTreeItem 
                            key={child.id}
                            page={child}
                            level={level + 1}
                            activePageId={activePageId}
                            expandedIds={expandedIds}
                            onToggleExpand={onToggleExpand}
                            onNavigate={onNavigate}
                            onDeletePage={onDeletePage}
                            onCreatePage={onCreatePage}
                            allPages={allPages}
                            t={t}
                        />
                    ))}
                </div>
            )}
            
            {/* Empty state */}
            {isExpanded && !hasChildren && (
                <div 
                    className="text-[12px] text-surgical-dim opacity-40 py-1 select-none italic"
                    style={{ paddingLeft: `${(level + 1) * 12 + 28}px` }}
                >
                    Empty
                </div>
            )}
        </>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  workspaces,
  activeWorkspace,
  onSwitchWorkspace,
  onCreateWorkspace,
  onUpdateWorkspace,
  activePageId,
  onNavigate,
  onCreatePage,
  onDeletePage,
  onRestorePage,
  onPermanentDeletePage,
  onSearch,
  onOpenMembersModal,
  lang,
  setLang,
  t,
  onOpenSettings,
  notificationCount,
  onOpenNotifications
}) => {
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  
  // Tree Expansion State
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Edit State
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // Trash position calculation
  const [trashPos, setTrashPos] = useState({ top: 0, left: 0 });

  const switcherRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const trashButtonRef = useRef<HTMLDivElement>(null);

  // Derive active and trash pages
  const allPages = activeWorkspace ? activeWorkspace.pages : [];
  const activePages = allPages.filter(p => !p.deletedAt);
  const trashPages = allPages.filter(p => p.deletedAt);
  
  // Root pages (No parent)
  const rootPages = activePages.filter(p => !p.parentId);
  
  // Favorites
  const favoritePages = activePages.filter(p => p.favorite);

  const handleToggleExpand = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setExpandedIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        // Switcher logic
        if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
            setIsSwitcherOpen(false);
            setEditingWorkspaceId(null);
        }
        // Trash logic
        if (
            trashRef.current && 
            !trashRef.current.contains(event.target as Node) &&
            trashButtonRef.current &&
            !trashButtonRef.current.contains(event.target as Node)
        ) {
            setIsTrashOpen(false);
        }
    };
    
    if (isSwitcherOpen || isTrashOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSwitcherOpen, isTrashOpen]);

  // Update trash popup position when opened
  useEffect(() => {
    if (isTrashOpen && trashButtonRef.current) {
        const rect = trashButtonRef.current.getBoundingClientRect();
        setTrashPos({
            top: rect.top - 310, // approximate height + gap
            left: rect.left + 30
        });
    }
  }, [isTrashOpen]);

  const startEditing = (e: React.MouseEvent, ws: Workspace) => {
    e.stopPropagation();
    setEditingWorkspaceId(ws.id);
    setEditName(ws.name);
    setEditTag(ws.tag || 'Personal');
    setEditIcon(ws.icon || 'A');
    setShowEmojiPicker(false);
  };

  const saveEditing = () => {
    if (editingWorkspaceId) {
        onUpdateWorkspace(editingWorkspaceId, {
            name: editName.trim() || t('untitled'),
            tag: editTag,
            icon: editIcon
        });
    }
    setEditingWorkspaceId(null);
  };

  if (!activeWorkspace) return <aside className="w-[260px] bg-alabaster-haze h-full flex items-center justify-center text-surgical-dim">Loading...</aside>;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 sm:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        w-[260px] bg-alabaster-haze h-full flex flex-col py-4 select-none relative z-40 shrink-0 border-r border-alabaster-vein sm:border-r-0
        fixed sm:relative
        transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
      `}>
      
      {/* Workspace Switcher */}
      <div className="relative mb-4 px-4" ref={switcherRef}>
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
          >
            <div className="w-8 h-8 bg-white border border-alabaster-vein rounded-lg shadow-sm flex items-center justify-center text-sm font-semibold transition-transform group-hover:scale-105">
                {activeWorkspace.icon}
            </div>
            <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-surgical-steel truncate tracking-tight">{activeWorkspace.name}</span>
                <span className="text-[10px] text-surgical-dim uppercase tracking-wide opacity-70">Workspace</span>
            </div>
            <div className="ml-auto w-6 flex items-center justify-center">
                <ChevronDown size={14} className="text-surgical-dim group-hover:text-surgical-steel transition-colors" />
            </div>
          </div>

          {/* Switcher Dropdown */}
          {isSwitcherOpen && (
              <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-xl shadow-menu border border-black/5 z-50 overflow-hidden animate-modal-entry origin-top p-1">
                  
                  {/* Current User */}
                  <div className="p-2 mb-1 bg-stone-50 rounded-lg flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-surgical-steel text-white flex items-center justify-center text-xs font-bold">
                          {currentUser?.initials}
                      </div>
                      <div className="flex flex-col overflow-hidden flex-1">
                          <span className="text-xs font-semibold text-surgical-steel truncate">{currentUser?.name}</span>
                          <span className="text-[10px] text-surgical-dim truncate">{currentUser?.email}</span>
                      </div>
                      <button onClick={onLogout} className="p-1.5 hover:bg-stone-200 rounded text-surgical-dim" title="Log out"><LogOut size={12}/></button>
                  </div>

                  <div className="text-[10px] font-bold text-surgical-dim px-2 py-1 uppercase tracking-wide opacity-50">
                      Workspaces
                  </div>
                  <div className="max-h-[180px] overflow-y-auto custom-scrollbar">
                      {workspaces.map(ws => (
                          <div 
                            key={ws.id}
                            className={`
                                group px-2 py-1.5 cursor-pointer rounded-md transition-colors mb-0.5
                                ${editingWorkspaceId === ws.id ? 'bg-stone-50' : 'hover:bg-stone-50'}
                            `}
                            onClick={() => {
                                if (editingWorkspaceId === ws.id) return;
                                onSwitchWorkspace(ws.id);
                                setIsSwitcherOpen(false);
                            }}
                          >
                               {editingWorkspaceId === ws.id ? (
                                   // Edit Mode
                                   <div className="flex flex-col gap-2 p-1" onClick={(e) => e.stopPropagation()}>
                                       <div className="flex items-center gap-2">
                                            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-8 h-8 bg-white border border-surgical-steel rounded flex items-center justify-center text-sm shadow-sm">{editIcon}</button>
                                            <input autoFocus className="flex-grow text-xs bg-white border border-surgical-steel rounded px-2 py-1 outline-none min-w-0" value={editName} onChange={(e) => setEditName(e.target.value)} />
                                       </div>
                                       <div className="flex justify-end gap-2 mt-1"><button onClick={saveEditing} className="text-[10px] bg-surgical-steel text-white px-2 py-1 rounded">Save</button></div>
                                   </div>
                               ) : (
                                   // View Mode
                                   <div className="flex items-center gap-2">
                                       <div className="w-6 h-6 bg-white border border-alabaster-vein rounded flex items-center justify-center text-xs shrink-0">{ws.icon}</div>
                                       <span className="text-sm text-surgical-steel truncate flex-grow">{ws.name}</span>
                                       {ws.id === activeWorkspace.id && <Check size={12} className="text-surgical-steel" />}
                                       
                                       {/* Edit Button - Only show for owner? Assuming owner for now or general edit */}
                                       <button 
                                            onClick={(e) => startEditing(e, ws)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-stone-200 rounded text-surgical-dim transition-opacity"
                                            title="Rename Workspace"
                                       >
                                           <Edit2 size={12} />
                                       </button>
                                   </div>
                               )}
                          </div>
                      ))}
                  </div>
                  <div className="h-[1px] bg-alabaster-vein my-1" />
                  <div onClick={() => { onCreateWorkspace(); setIsSwitcherOpen(false); }} className="flex items-center px-2 py-1.5 hover:bg-stone-50 cursor-pointer text-surgical-dim rounded-md gap-2">
                      <Plus size={14} /> <span className="text-xs font-medium">{t('create_workspace')}</span>
                  </div>
              </div>
          )}
      </div>

      {/* Main Navigation */}
      <div className="flex flex-col gap-0.5 mb-6">
        <SidebarItem icon={<Search size={18} />} label={t('search')} onClick={onSearch} />
        <SidebarItem 
          icon={<Home size={18} />} 
          label={t('home')} 
          isActive={activePageId === 'HOME'}
          onClick={() => onNavigate('HOME')}
        />
        <SidebarItem 
            icon={<Inbox size={18} />} 
            label={t('inbox')} 
            isActive={activePageId === 'INBOX'}
            badge={notificationCount}
            onClick={() => onNavigate('INBOX')}
        />
        <SidebarItem icon={<Settings size={18} />} label={t('settings')} onClick={onOpenSettings} />
      </div>

      {/* Pages Container */}
      <div className="flex flex-col gap-0.5 overflow-y-auto custom-scrollbar flex-grow px-0">
        
        {/* Favorites */}
        {favoritePages.length > 0 && (
            <div className="mb-4">
                <div className="px-5 py-1 text-[10px] font-bold text-surgical-dim uppercase tracking-wider opacity-60">
                    {t('favorites')}
                </div>
                {favoritePages.map(page => (
                    <SidebarItem 
                        key={page.id}
                        icon={page.icon ? <span className="text-sm">{page.icon}</span> : <FileText size={16} />} 
                        label={page.title || t('untitled')} 
                        isActive={page.id === activePageId}
                        onClick={() => onNavigate(page.id)}
                    />
                ))}
            </div>
        )}

        {/* Private / Pages Tree */}
        <div className="flex items-center justify-between px-5 py-1 group mb-1">
            <span className="text-[10px] font-bold text-surgical-dim uppercase tracking-wider opacity-60">{t('private')}</span>
            <Plus 
                size={14} 
                className="cursor-pointer text-surgical-dim hover:text-surgical-steel opacity-0 group-hover:opacity-100 transition-opacity" 
                onClick={() => onCreatePage()}
            />
        </div>
        
        {rootPages.map(page => (
            <PageTreeItem 
                key={page.id}
                page={page}
                level={0}
                activePageId={activePageId}
                expandedIds={expandedIds}
                onToggleExpand={handleToggleExpand}
                onNavigate={onNavigate}
                onDeletePage={onDeletePage}
                onCreatePage={onCreatePage}
                allPages={activePages}
                t={t}
            />
        ))}

        <button 
            onClick={() => onCreatePage()}
            className="flex items-center gap-2 px-5 py-2 mt-2 text-xs text-surgical-dim hover:text-surgical-steel transition-colors group opacity-60 hover:opacity-100"
        >
            <Plus size={14} /> {t('new_page')}
        </button>
      </div>

      {/* Footer / Utilities */}
      <div className="mt-auto px-2 pt-2 border-t border-alabaster-vein mx-4 mb-2 flex flex-col gap-1">
         
         <div ref={trashButtonRef}>
             <SidebarItem 
                icon={<Trash2 size={16} />} 
                label={t('trash')} 
                onClick={() => setIsTrashOpen(!isTrashOpen)}
                isActive={isTrashOpen}
             />
         </div>
         
         {/* Trash Popover - Fixed Position to avoid clipping */}
         {isTrashOpen && (
             <div 
                ref={trashRef}
                className="fixed bg-white rounded-xl shadow-menu border border-black/5 z-[150] overflow-hidden animate-modal-entry flex flex-col w-[280px] max-h-[300px]"
                style={{ top: Math.max(20, trashPos.top), left: trashPos.left }}
             >
                <div className="px-3 py-2 bg-stone-50 border-b border-alabaster-vein text-xs font-semibold text-surgical-dim flex justify-between items-center">
                    <span>{t('trash')}</span>
                    {trashPages.length > 0 && <span className="text-[9px] italic">{t('trash_clears')}</span>}
                </div>
                <div className="overflow-y-auto custom-scrollbar p-1 flex-grow bg-white">
                    {trashPages.length === 0 ? (
                        <div className="p-4 text-center text-xs text-surgical-dim italic">
                            {t('trash_empty')}
                        </div>
                    ) : (
                        trashPages.map(page => (
                            <div key={page.id} className="flex items-center justify-between px-3 py-2 hover:bg-stone-50 rounded-lg group">
                                <div className="flex items-center gap-2 overflow-hidden">
                                     <span className="text-sm">{page.icon || <FileText size={12}/>}</span>
                                     <span className="text-xs text-surgical-steel truncate">{page.title || t('untitled')}</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onRestorePage(page.id)} className="p-1 hover:bg-stone-200 rounded text-surgical-steel"><RefreshCw size={12} /></button>
                                    <button onClick={() => onPermanentDeletePage(page.id)} className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-surgical-dim"><X size={12} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
             </div>
         )}
         
         <SidebarItem icon={<UserPlus size={16} />} label={t('invite_members')} onClick={onOpenMembersModal} />
      </div>
    </aside>
    </>
  );
};