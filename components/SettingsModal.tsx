import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Moon, Sun, Globe, Monitor, Check, User as UserIcon, 
  HelpCircle, Sparkles, Type, Layout, Image, Users, Search as SearchIcon,
  BellRing, Code, Map, Share2, Sidebar, Upload, Database, Download, FileJson
} from 'lucide-react';
import { User, Language } from '../types';
import { TranslationKey } from '../utils/translations';
import { dbExportJson, dbImportJson } from '../utils/mockDatabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (updates: Partial<User>) => void; // New prop
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

type Tab = 'my_account' | 'my_settings' | 'language' | 'data' | 'features';

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUser,
  onUpdateUser,
  theme,
  setTheme,
  lang,
  setLang,
  t 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('my_settings');
  const [editName, setEditName] = useState(currentUser.name);
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditName(currentUser.name);
  }, [currentUser]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleNameSave = () => {
      if (editName.trim() !== currentUser.name) {
          onUpdateUser({ name: editName });
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 2 * 1024 * 1024) {
              alert("Image is too large. Please select an image under 2MB.");
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                  onUpdateUser({ avatar: reader.result });
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleExportData = () => {
      const json = dbExportJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atelier-backup-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          const content = ev.target?.result as string;
          if (dbImportJson(content)) {
              alert("Data imported successfully. The page will reload.");
              window.location.reload();
          } else {
              alert("Failed to import data. Invalid JSON format.");
          }
      };
      reader.readAsText(file);
  };

  const featureList = useMemo(() => [
      {
          category: t('feat_cat_editor'),
          icon: <Type size={18} className="text-blue-500" />,
          items: [
              { title: t('feat_slash_title'), desc: t('feat_slash_desc') },
              { title: t('feat_fmt_title'), desc: t('feat_fmt_desc') },
              { title: t('feat_lists_title'), desc: t('feat_lists_desc') },
              { title: t('feat_code_title'), desc: t('feat_code_desc') },
              { title: t('feat_indent_title'), desc: t('feat_indent_desc') }
          ]
      },
      {
          category: t('feat_cat_ai'),
          icon: <Sparkles size={18} className="text-purple-500" />,
          items: [
              { title: t('feat_ask_title'), desc: t('feat_ask_desc') },
              { title: t('feat_remind_title'), desc: t('feat_remind_desc') },
              { title: t('feat_inbox_title'), desc: t('feat_inbox_desc') }
          ]
      },
      {
          category: t('feat_cat_media'),
          icon: <Image size={18} className="text-green-500" />,
          items: [
              { title: t('feat_img_title'), desc: t('feat_img_desc') },
              { title: t('feat_vid_title'), desc: t('feat_vid_desc') },
              { title: t('feat_map_title'), desc: t('feat_map_desc') }
          ]
      },
      {
          category: t('feat_cat_org'),
          icon: <Layout size={18} className="text-orange-500" />,
          items: [
              { title: t('feat_nest_title'), desc: t('feat_nest_desc') },
              { title: t('feat_ws_title'), desc: t('feat_ws_desc') },
              { title: t('feat_search_title'), desc: t('feat_search_desc') },
              { title: t('feat_fav_title'), desc: t('feat_fav_desc') }
          ]
      },
      {
          category: t('feat_cat_collab'),
          icon: <Users size={18} className="text-pink-500" />,
          items: [
              { title: t('feat_com_title'), desc: t('feat_com_desc') },
              { title: t('feat_role_title'), desc: t('feat_role_desc') },
              { title: t('feat_share_title'), desc: t('feat_share_desc') }
          ]
      }
  ], [t]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[150] flex items-center justify-center animate-in fade-in duration-200">
      <div 
        ref={modalRef}
        className="w-[900px] h-[700px] max-w-[95vw] max-h-[90vh] bg-alabaster-pure rounded-xl shadow-2xl border border-alabaster-vein flex overflow-hidden animate-modal-entry text-surgical-steel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className="w-[240px] bg-alabaster-haze border-r border-alabaster-vein p-3 flex flex-col gap-1 shrink-0">
          <div className="px-3 py-2 mb-2">
             <span className="text-xs font-semibold text-surgical-dim uppercase tracking-wider">{t('settings')}</span>
          </div>
          
          <button 
            onClick={() => setActiveTab('my_account')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${activeTab === 'my_account' ? 'bg-alabaster-vein font-medium' : 'hover:bg-alabaster-vein text-surgical-dim hover:text-surgical-steel'}`}
          >
            <div className="w-5 h-5 rounded bg-surgical-accent text-white flex items-center justify-center text-[10px]">
                {currentUser.initials}
            </div>
            My Account
          </button>

          <button 
            onClick={() => setActiveTab('my_settings')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${activeTab === 'my_settings' ? 'bg-alabaster-vein font-medium' : 'hover:bg-alabaster-vein text-surgical-dim hover:text-surgical-steel'}`}
          >
            <Monitor size={16} />
            Appearance
          </button>

          <button 
            onClick={() => setActiveTab('language')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${activeTab === 'language' ? 'bg-alabaster-vein font-medium' : 'hover:bg-alabaster-vein text-surgical-dim hover:text-surgical-steel'}`}
          >
            <Globe size={16} />
            {t('language')}
          </button>

          <button 
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${activeTab === 'data' ? 'bg-alabaster-vein font-medium' : 'hover:bg-alabaster-vein text-surgical-dim hover:text-surgical-steel'}`}
          >
            <Database size={16} />
            Data & Storage
          </button>

          <div className="h-[1px] bg-alabaster-vein my-2" />

          <button 
            onClick={() => setActiveTab('features')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${activeTab === 'features' ? 'bg-alabaster-vein font-medium' : 'hover:bg-alabaster-vein text-surgical-dim hover:text-surgical-steel'}`}
          >
            <HelpCircle size={16} />
            Features & Guide
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow flex flex-col bg-alabaster-pure relative min-w-0">
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-1 hover:bg-alabaster-vein rounded text-surgical-dim transition-colors z-10"
            >
                <X size={20} />
            </button>

            <div className="flex-grow p-10 overflow-y-auto custom-scrollbar">
                
                {activeTab === 'my_account' && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h2 className="text-xl font-bold pb-2 border-b border-alabaster-vein">My Account</h2>
                        
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 border border-alabaster-vein rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600 shadow-inner overflow-hidden relative group">
                                {currentUser.avatar && (currentUser.avatar.startsWith('http') || currentUser.avatar.startsWith('data:')) ? (
                                    <img src={currentUser.avatar} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                    <span>{currentUser.avatar || currentUser.initials}</span>
                                )}
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <Upload size={20} className="text-white" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="text-xs text-surgical-dim font-medium uppercase">Profile Photo</div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                                <button onClick={() => fileInputRef.current?.click()} className="text-sm text-surgical-accent hover:underline text-left">Upload photo</button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-surgical-dim uppercase">Display Name</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={editName} 
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full max-w-sm px-3 py-2 bg-alabaster-pure border border-alabaster-vein rounded-md text-sm outline-none focus:border-surgical-accent focus:ring-1 focus:ring-surgical-accent transition-all"
                                />
                                {editName !== currentUser.name && (
                                    <button 
                                        onClick={handleNameSave}
                                        className="bg-surgical-accent text-white px-3 py-2 rounded-md text-sm font-medium hover:brightness-105"
                                    >
                                        Update
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-surgical-dim uppercase">Email</label>
                            <input 
                                type="text" 
                                value={currentUser.email} 
                                disabled
                                className="w-full max-w-sm px-3 py-2 bg-alabaster-haze border border-alabaster-vein rounded-md text-sm text-surgical-dim cursor-not-allowed"
                            />
                            <p className="text-[10px] text-surgical-dim">Email cannot be changed.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'my_settings' && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h2 className="text-xl font-bold pb-2 border-b border-alabaster-vein">Appearance</h2>
                        {/* Theme options remain same */}
                        <div className="grid grid-cols-2 gap-4">
                                <div 
                                    className={`border rounded-lg p-4 cursor-pointer transition-all flex flex-col gap-3 ${theme === 'light' ? 'border-surgical-accent ring-1 ring-surgical-accent bg-blue-50/10' : 'border-alabaster-vein hover:bg-alabaster-haze'}`}
                                    onClick={() => setTheme('light')}
                                >
                                    <div className="flex items-center gap-2"><Sun size={16} /><span className="text-sm font-medium">Light</span></div>
                                    <p className="text-xs text-surgical-dim">Clean, paper-like aesthetic for focus.</p>
                                </div>
                                <div 
                                    className={`border rounded-lg p-4 cursor-pointer transition-all flex flex-col gap-3 ${theme === 'dark' ? 'border-surgical-accent ring-1 ring-surgical-accent bg-blue-50/10' : 'border-alabaster-vein hover:bg-alabaster-haze'}`}
                                    onClick={() => setTheme('dark')}
                                >
                                    <div className="flex items-center gap-2"><Moon size={16} /><span className="text-sm font-medium">Dark</span></div>
                                    <p className="text-xs text-surgical-dim">Easy on the eyes, sleek charcoal tones.</p>
                                </div>
                        </div>
                    </div>
                )}

                {activeTab === 'language' && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h2 className="text-xl font-bold pb-2 border-b border-alabaster-vein">{t('language')}</h2>
                        <select 
                            className="w-full max-w-sm px-3 py-2 bg-alabaster-pure border border-alabaster-vein rounded-md text-sm outline-none focus:border-surgical-accent transition-all"
                            value={lang}
                            onChange={(e) => setLang(e.target.value as Language)}
                        >
                            <option value="en">English</option>
                            <option value="ru">Русский</option>
                        </select>
                    </div>
                )}

                {activeTab === 'data' && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h2 className="text-xl font-bold pb-2 border-b border-alabaster-vein">Data & Storage</h2>
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                            <strong>Warning:</strong> This application runs entirely in your browser. Clearing your browser cache will delete all data. Use the Export function regularly to back up your workspaces.
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between p-4 border border-alabaster-vein rounded-lg bg-white">
                                <div className="flex flex-col">
                                    <span className="font-medium text-surgical-steel">Export Database</span>
                                    <span className="text-xs text-surgical-dim">Download all your workspaces and pages as a JSON file.</span>
                                </div>
                                <button 
                                    onClick={handleExportData}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-alabaster-vein rounded-md text-sm font-medium hover:bg-alabaster-haze transition-all shadow-sm"
                                >
                                    <Download size={16} /> Export JSON
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-alabaster-vein rounded-lg bg-white">
                                <div className="flex flex-col">
                                    <span className="font-medium text-surgical-steel">Import Database</span>
                                    <span className="text-xs text-surgical-dim">Restore data from a backup file. This will replace current data.</span>
                                </div>
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        ref={jsonInputRef}
                                        accept=".json"
                                        className="hidden"
                                        onChange={handleImportData}
                                    />
                                    <button 
                                        onClick={() => jsonInputRef.current?.click()}
                                        className="flex items-center gap-2 px-4 py-2 bg-surgical-accent text-white rounded-md text-sm font-medium hover:brightness-105 transition-all shadow-sm"
                                    >
                                        <FileJson size={16} /> Import JSON
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'features' && (
                    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-8">
                        <div>
                            <h2 className="text-xl font-bold pb-2 border-b border-alabaster-vein">Features & Capabilities</h2>
                            <p className="text-sm text-surgical-dim mt-2">Explore the tools available in your workspace.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-8">
                            {featureList.map((cat, idx) => (
                                <div key={idx} className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2 text-sm font-bold text-surgical-steel uppercase tracking-wider">
                                        {cat.icon}
                                        {cat.category}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {cat.items.map((item, i) => (
                                            <div key={i} className="p-3 bg-alabaster-haze/50 border border-alabaster-vein rounded-lg">
                                                <div className="font-semibold text-sm mb-1">{item.title}</div>
                                                <div className="text-xs text-surgical-dim leading-relaxed">{item.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};