import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MoreHorizontal, Star, Clock, MessageSquare, Type, Maximize2, Download, Lock } from 'lucide-react';
import { TranslationKey } from '../utils/translations';
import { Page, AccessLevel } from '../types';

interface HeaderProps {
  onShareClick: () => void;
  shareBtnRef: React.RefObject<HTMLButtonElement>;
  isShareOpen: boolean;
  showComments: boolean;
  onToggleComments: () => void;
  title: string;
  isHome: boolean;
  isInbox?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  t: (key: TranslationKey) => string;
  activePage?: Page;
  onUpdatePage?: (updatedPage: Page) => void;
  allPages?: Page[];
  onNavigate?: (pageId: string) => void;
  role?: AccessLevel; // New role prop
}

export const Header: React.FC<HeaderProps> = ({ 
  onShareClick, 
  shareBtnRef, 
  isShareOpen,
  showComments,
  onToggleComments,
  title,
  isHome,
  isInbox,
  isFavorite,
  onToggleFavorite,
  t,
  activePage,
  onUpdatePage,
  allPages = [],
  onNavigate,
  role
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const canEdit = role ? [AccessLevel.OWNER, AccessLevel.FULL_ACCESS, AccessLevel.CAN_EDIT].includes(role) : true;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Compute Breadcrumb Path
  const breadcrumbPath = useMemo(() => {
      if (isHome) return [{ id: 'HOME', title: t('home'), icon: '🏠' }];
      if (isInbox) return [{ id: 'INBOX', title: t('inbox'), icon: '📥' }];
      if (!activePage) return [];

      const path: Page[] = [activePage];
      let current = activePage;
      
      // Safety break
      let depth = 0;
      while (current.parentId && depth < 20) {
          const parent = allPages.find(p => p.id === current.parentId && !p.deletedAt);
          if (parent) {
              path.unshift(parent);
              current = parent;
          } else {
              break;
          }
          depth++;
      }
      return path;
  }, [activePage, allPages, isHome, isInbox, t]);

  const toggleSmallText = () => {
      if (activePage && onUpdatePage && canEdit) {
          onUpdatePage({ ...activePage, smallText: !activePage.smallText });
      }
  };

  const toggleFullWidth = () => {
      if (activePage && onUpdatePage && canEdit) {
          onUpdatePage({ ...activePage, fullWidth: !activePage.fullWidth });
      }
  };

  const handleExport = () => {
      if (!activePage) return;
      // ... export logic (same as before) ...
      // Assuming re-implementation for brevity if XML replaces full content
      let markdown = `# ${activePage.title || t('untitled')}\n\n`;
      activePage.blocks.forEach(block => {
          const indent = "  ".repeat(block.indent || 0);
          markdown += `${indent}${block.content}\n`; 
      });
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activePage.title || 'Export'}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsMenuOpen(false);
  };

  return (
    <header className="h-[45px] flex items-center justify-between px-4 text-sm w-full z-10 shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-surgical-steel truncate max-w-[60%]">
        {!isHome && !isInbox && breadcrumbPath.length === 0 && (
            <div className="flex items-center gap-1 text-surgical-dim hover:bg-alabaster-vein px-1 py-0.5 rounded cursor-pointer transition-colors">
                <span className="truncate">{t('private')}</span>
            </div>
        )}
        
        {breadcrumbPath.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
                {idx > 0 && <span className="text-gray-300 mx-0.5">/</span>}
                <div 
                    className={`flex items-center gap-1 cursor-pointer hover:bg-alabaster-vein px-1 py-0.5 rounded transition-colors truncate ${idx === breadcrumbPath.length - 1 ? 'font-medium text-surgical-steel' : 'text-surgical-dim hover:text-surgical-steel'}`}
                    onClick={() => onNavigate && onNavigate(crumb.id)}
                >
                    {(crumb as any).icon && <span className="text-xs">{(crumb as any).icon}</span>}
                    <span className="truncate max-w-[150px]">{crumb.title || t('untitled')}</span>
                </div>
            </React.Fragment>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {!canEdit && !isHome && !isInbox && (
            <div className="flex items-center gap-1 text-xs text-surgical-dim bg-alabaster-vein px-2 py-1 rounded">
                <Lock size={12} />
                <span>Read only</span>
            </div>
        )}
        
        {!isHome && !isInbox && canEdit && <span className="text-surgical-dim text-xs hidden sm:block">{t('edited_now')}</span>}
        
        <button 
          ref={shareBtnRef}
          onClick={onShareClick}
          className={`
            bg-transparent border-none px-2 py-1 rounded text-sm font-medium cursor-pointer transition-all
            ${isShareOpen ? 'bg-alabaster-vein text-surgical-steel' : 'text-surgical-steel hover:bg-alabaster-vein'}
          `}
        >
          {t('share')}
        </button>
        <button 
          onClick={onToggleComments}
          className={`
            p-1 rounded transition-colors
            ${showComments ? 'text-surgical-accent bg-alabaster-vein' : 'text-surgical-steel hover:bg-alabaster-vein'}
          `}
          title={showComments ? t('hide_comments') : t('view_comments')}
        >
          <MessageSquare size={16} />
        </button>
        
        {/* Favorite Button */}
        {!isHome && !isInbox && (
            <button 
              onClick={onToggleFavorite}
              className={`p-1 rounded transition-colors hover:bg-alabaster-vein ${isFavorite ? 'text-yellow-400' : 'text-surgical-steel'}`}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
            </button>
        )}
        
        <div className="relative">
            <button 
                ref={menuBtnRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`text-surgical-steel hover:bg-alabaster-vein p-1 rounded transition-colors ${isMenuOpen ? 'bg-alabaster-vein' : ''}`}
            >
              <MoreHorizontal size={16} />
            </button>

            {isMenuOpen && activePage && (
                <div 
                    ref={menuRef}
                    className="absolute right-0 top-full mt-2 w-[240px] bg-white rounded-xl shadow-menu border border-black/5 z-50 py-1 animate-modal-entry origin-top-right overflow-hidden"
                >
                    <div className="px-3 py-2 text-xs text-surgical-dim uppercase font-semibold">{t('style')}</div>
                    
                    <div 
                        className={`flex items-center justify-between px-3 py-2 transition-colors ${canEdit ? 'hover:bg-alabaster-vein cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                        onClick={toggleSmallText}
                    >
                        <div className="flex items-center gap-2 text-sm text-surgical-steel">
                            <Type size={16} />
                            {t('small_text')}
                        </div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${activePage.smallText ? 'bg-surgical-accent' : 'bg-gray-300'}`}>
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${activePage.smallText ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    <div 
                        className={`flex items-center justify-between px-3 py-2 transition-colors ${canEdit ? 'hover:bg-alabaster-vein cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                        onClick={toggleFullWidth}
                    >
                        <div className="flex items-center gap-2 text-sm text-surgical-steel">
                            <Maximize2 size={16} />
                            {t('full_width')}
                        </div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${activePage.fullWidth ? 'bg-surgical-accent' : 'bg-gray-300'}`}>
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${activePage.fullWidth ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    <div className="h-[1px] bg-alabaster-vein my-1" />
                    <div className="px-3 py-2 text-xs text-surgical-dim uppercase font-semibold">{t('customize_page')}</div>

                    <div 
                        className="flex items-center gap-2 px-3 py-2 hover:bg-alabaster-vein cursor-pointer transition-colors text-sm text-surgical-steel"
                        onClick={handleExport}
                    >
                        <Download size={16} />
                        <div className="flex flex-col">
                            <span>{t('export_markdown')}</span>
                            <span className="text-[10px] text-surgical-dim">{t('export_desc')}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};