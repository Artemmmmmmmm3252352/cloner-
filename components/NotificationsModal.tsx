import React from 'react';
import { X, Bell, Check, Ban } from 'lucide-react';
import { Invitation } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitations: Invitation[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ 
  isOpen, 
  onClose, 
  invitations, 
  onAccept, 
  onDecline 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[150] flex items-start justify-center pt-[15vh] animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-[450px] max-w-[90vw] bg-white rounded-xl shadow-2xl border border-white/40 flex flex-col overflow-hidden animate-modal-entry"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-alabaster-vein flex justify-between items-center bg-alabaster-haze/30">
          <div className="flex items-center gap-2 font-semibold text-surgical-steel text-sm">
            <Bell size={16} />
            Notifications
          </div>
          <button onClick={onClose} className="text-surgical-dim hover:text-surgical-steel p-1 rounded hover:bg-alabaster-vein transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
          {invitations.length === 0 ? (
            <div className="py-8 text-center text-surgical-dim opacity-60 text-sm">
              No new notifications
            </div>
          ) : (
            invitations.map(invite => (
              <div key={invite.id} className="p-3 bg-white border border-alabaster-vein rounded-lg shadow-sm hover:shadow-md transition-all mb-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-md bg-[#4A67AD] text-white flex items-center justify-center text-lg font-bold shrink-0">
                    {invite.workspaceIcon}
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm text-surgical-steel">
                      <span className="font-semibold">{invite.fromUser.name}</span> invited you to join <span className="font-semibold">{invite.workspaceName}</span>
                    </p>
                    <p className="text-xs text-surgical-dim mt-1">
                      Role: <span className="bg-alabaster-vein px-1.5 py-0.5 rounded border border-black/5">{invite.role}</span>
                    </p>
                    <p className="text-[10px] text-surgical-dim mt-1 opacity-70">
                        {new Date(invite.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pl-[52px]">
                  <button 
                    onClick={() => onAccept(invite.id)}
                    className="flex-1 bg-surgical-accent text-white text-xs font-medium py-1.5 rounded flex items-center justify-center gap-1 hover:brightness-105 transition-all"
                  >
                    <Check size={12} /> Accept
                  </button>
                  <button 
                    onClick={() => onDecline(invite.id)}
                    className="flex-1 bg-alabaster-haze border border-alabaster-vein text-surgical-dim text-xs font-medium py-1.5 rounded flex items-center justify-center gap-1 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
                  >
                    <Ban size={12} /> Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};