import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, FileText, CornerDownLeft, Hash, List, Type } from 'lucide-react';
import { Page } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: Page[];
  onNavigate: (pageId: string) => void;
}

interface SearchResult {
  pageId: string;
  pageTitle: string;
  pageIcon: string | null;
  matchType: 'title' | 'content';
  snippet?: string; // Content snippet if match is in body
  blockType?: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, pages, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search Logic
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    pages.forEach(page => {
      // 1. Check Title
      if ((page.title || "Untitled").toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          pageId: page.id,
          pageTitle: page.title || "Untitled",
          pageIcon: page.icon,
          matchType: 'title'
        });
      }

      // 2. Check Blocks (Content)
      // We only want one snippet per page to avoid clutter, or maybe allow multiple? 
      // Let's stick to the first relevant match per page to keep it clean, unless title didn't match.
      const alreadyMatched = searchResults.some(r => r.pageId === page.id && r.matchType === 'title');
      
      if (!alreadyMatched) {
        for (const block of page.blocks) {
          if (block.content && block.content.toLowerCase().includes(lowerQuery)) {
            searchResults.push({
              pageId: page.id,
              pageTitle: page.title || "Untitled",
              pageIcon: page.icon,
              matchType: 'content',
              snippet: block.content,
              blockType: block.type
            });
            break; // Stop after finding one content match per page
          }
        }
      }
    });

    return searchResults;
  }, [query, pages]);

  // Navigation Keys (Arrow Up/Down, Enter)
  useEffect(() => {
    const handleNav = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + Math.max(1, results.length)) % Math.max(1, results.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results.length > 0) {
          onNavigate(results[selectedIndex].pageId);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleNav);
    return () => window.removeEventListener('keydown', handleNav);
  }, [isOpen, results, selectedIndex, onNavigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div 
        className="w-[600px] max-w-[90vw] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-white/40 animate-modal-entry"
        onClick={e => e.stopPropagation()}
      >
        {/* Input Header */}
        <div className="flex items-center px-4 py-4 border-b border-alabaster-vein bg-white sticky top-0">
          <Search className="text-surgical-dim mr-3" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, text, or blocks..."
            className="flex-grow text-lg text-surgical-steel placeholder:text-surgical-dim/60 outline-none bg-transparent"
            value={query}
            onChange={e => {
                setQuery(e.target.value);
                setSelectedIndex(0);
            }}
          />
          <div className="text-[10px] bg-alabaster-haze border border-alabaster-vein px-1.5 py-0.5 rounded text-surgical-dim">ESC</div>
        </div>

        {/* Results List */}
        <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-2 bg-alabaster-haze/30 min-h-[100px]">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-surgical-dim opacity-60">
                {query ? (
                    <>
                        <p className="text-sm font-medium">No results found</p>
                    </>
                ) : (
                    <>
                         <p className="text-sm">Type to search...</p>
                    </>
                )}
            </div>
          ) : (
            results.map((result, idx) => (
              <div
                key={`${result.pageId}-${idx}`}
                className={`
                    group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors
                    ${idx === selectedIndex ? 'bg-surgical-accent/5' : 'hover:bg-alabaster-vein'}
                `}
                onClick={() => {
                    onNavigate(result.pageId);
                    onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                {/* Icon Column */}
                <div className="w-8 h-8 flex items-center justify-center shrink-0 text-xl bg-white border border-alabaster-vein rounded shadow-sm">
                   {result.pageIcon ? (
                        result.pageIcon.startsWith('http') ? <img src={result.pageIcon} className="w-full h-full object-cover rounded" /> : result.pageIcon
                   ) : (
                       <FileText size={16} className="text-surgical-dim" />
                   )}
                </div>

                {/* Content Column */}
                <div className="flex flex-col flex-grow overflow-hidden">
                    <div className="flex items-center gap-2">
                         <span className="text-sm font-medium text-surgical-steel truncate">
                            {result.pageTitle}
                         </span>
                         {result.matchType === 'content' && (
                             <span className="text-[10px] px-1.5 py-0.5 bg-alabaster-vein rounded text-surgical-dim uppercase tracking-wide">
                                Match
                             </span>
                         )}
                    </div>
                    
                    {/* Snippet display if content match */}
                    {result.matchType === 'content' && result.snippet && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-surgical-dim truncate">
                            {result.blockType === 'h1' || result.blockType === 'h2' || result.blockType === 'h3' ? <Hash size={10} /> : 
                             result.blockType === 'bullet' || result.blockType === 'number' ? <List size={10} /> :
                             <Type size={10} />}
                            <span className="truncate opacity-80">
                                {result.snippet}
                            </span>
                        </div>
                    )}
                </div>

                {/* Action Column */}
                {idx === selectedIndex && (
                    <CornerDownLeft size={14} className="text-surgical-dim mr-2 animate-in fade-in zoom-in duration-200" />
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-2 border-t border-alabaster-vein bg-alabaster-haze flex justify-between items-center text-[11px] text-surgical-dim">
            <span>
                {results.length} result{results.length !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-3">
                <span className="flex items-center gap-1"><span className="bg-white border border-alabaster-vein px-1 rounded">↑</span><span className="bg-white border border-alabaster-vein px-1 rounded">↓</span> Navigate</span>
                <span className="flex items-center gap-1"><span className="bg-white border border-alabaster-vein px-1 rounded">↵</span> Open</span>
            </div>
        </div>
      </div>
    </div>
  );
};