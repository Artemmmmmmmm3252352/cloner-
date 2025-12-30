import React, { useState, useRef, useEffect } from 'react';
import { Globe, Link as LinkIcon, ChevronDown, Copy } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, triggerRef }) => {
  const [activeTab, setActiveTab] = useState<'share' | 'publish'>('share');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current && 
        !modalRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div 
      ref={modalRef}
      className="absolute top-[50px] right-[20px] w-[480px] bg-white rounded-xl shadow-monolith border border-black/5 z-[100] overflow-hidden animate-modal-entry origin-top-right"
    >
      {/* Tabs */}
      <div className="flex px-4 pt-3 border-b border-alabaster-vein">
        <div 
          className={`px-3 py-2 text-sm font-medium cursor-pointer relative ${activeTab === 'share' ? 'text-surgical-steel' : 'text-surgical-dim'}`}
          onClick={() => setActiveTab('share')}
        >
          Share
          {activeTab === 'share' && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-surgical-steel" />}
        </div>
        <div 
          className={`px-3 py-2 text-sm font-medium cursor-pointer relative ${activeTab === 'publish' ? 'text-surgical-steel' : 'text-surgical-dim'}`}
          onClick={() => setActiveTab('publish')}
        >
          Publish
          {activeTab === 'publish' && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-surgical-steel" />}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Invite Input */}
        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            placeholder="Email or group, separated by commas"
            className="flex-grow px-3 py-2 rounded-md border border-alabaster-vein font-sans text-sm bg-alabaster-haze outline-none transition-all focus:border-surgical-accent focus:bg-white focus:ring-2 focus:ring-surgical-accent/10 placeholder-surgical-dim/70"
          />
          <button className="bg-surgical-accent text-white border-none px-4 rounded-md font-medium text-sm hover:brightness-105 transition-all">
            Invite
          </button>
        </div>

        {/* User List */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#4A67AD] text-white rounded-full flex items-center justify-center text-xs font-semibold">
              A
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-surgical-steel">
                Artemis Prime <span className="text-surgical-dim font-normal">(You)</span>
              </span>
              <span className="text-xs text-surgical-dim font-mono">prime@monolith.studio</span>
            </div>
          </div>
          <div className="text-[13px] text-surgical-dim cursor-pointer flex items-center gap-1 hover:bg-alabaster-haze px-2 py-1 rounded">
            Full access
            <ChevronDown size={12} />
          </div>
        </div>

        {/* General Access */}
        <div className="mt-6">
          <div className="text-xs text-surgical-dim font-medium mb-2">General access</div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-alabaster-vein rounded-md flex items-center justify-center text-surgical-dim">
                <Globe size={16} />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-sm text-surgical-steel">Only people invited</span>
              </div>
            </div>
            <div className="text-[13px] text-surgical-dim cursor-pointer flex items-center gap-1 hover:bg-alabaster-haze px-2 py-1 rounded">
              <ChevronDown size={12} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-alabaster-haze border-t border-alabaster-vein flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs text-surgical-dim cursor-pointer hover:text-surgical-steel transition-colors">
          <div className="w-[14px] h-[14px] border border-current rounded-full flex items-center justify-center">?</div>
          Learn about sharing
        </div>
        <button className="bg-white border border-alabaster-vein px-3 py-1.5 rounded-md text-[13px] flex items-center gap-1.5 text-surgical-steel hover:bg-alabaster-haze transition-colors shadow-sm">
          <LinkIcon size={14} />
          Copy link
        </button>
      </div>
    </div>
  );
};