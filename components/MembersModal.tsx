import React, { useState, useRef, useEffect } from 'react';
import { UserPlus, X, Mail, ChevronDown, Check, Shield, Clock, Trash2 } from 'lucide-react';
import { AccessLevel, Member, Workspace, Invitation } from '../types';
import { dbGetPendingWorkspaceInvites, dbCancelInvitation } from '../utils/mockDatabase';

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
  onInvite: (email: string, role: AccessLevel) => void;
  onUpdateRole: (memberId: string, newRole: AccessLevel) => void;
  onRemoveMember: (memberId: string) => void;
  t: (key: any) => string; // Pass translator
}

export const MembersModal: React.FC<MembersModalProps> = ({ 
  isOpen, 
  onClose, 
  workspace, 
  onInvite, 
  onUpdateRole, 
  onRemoveMember,
  t
}) => {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<AccessLevel>(AccessLevel.CAN_EDIT);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [activeMemberMenu, setActiveMemberMenu] = useState<string | null>(null);
  
  // Pending Invites State
  const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);

  const modalRef = useRef<HTMLDivElement>(null);

  const loadPendingInvites = () => {
      const invites = dbGetPendingWorkspaceInvites(workspace.id);
      setPendingInvites(invites);
  };

  useEffect(() => {
    if (isOpen) {
        loadPendingInvites();
    }
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose, workspace.id]);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onInvite(email, selectedRole);
      setEmail('');
      // Slight delay to allow DB update before refresh (mock sync)
      setTimeout(loadPendingInvites, 100);
    }
  };

  const handleCancelInvite = (id: string) => {
      dbCancelInvitation(id);
      loadPendingInvites();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[100] flex items-center justify-center animate-in fade-in duration-200">
      <div 
        ref={modalRef}
        className="w-[550px] max-w-[95vw] bg-white rounded-xl shadow-2xl border border-white/40 flex flex-col overflow-hidden animate-modal-entry h-[500px]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-alabaster-vein flex justify-between items-center bg-alabaster-haze/30">
          <div>
            <h2 className="text-lg font-semibold text-surgical-steel flex items-center gap-2">
              <UserPlus size={18} className="text-surgical-dim" />
              Invite to {workspace.name}
            </h2>
            <p className="text-xs text-surgical-dim mt-1">Manage access and roles for your team.</p>
          </div>
          <button onClick={onClose} className="text-surgical-dim hover:text-surgical-steel p-1 rounded hover:bg-alabaster-vein transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Invite Section */}
        <div className="p-6 border-b border-alabaster-vein">
          <form onSubmit={handleInviteSubmit} className="flex gap-2">
            <div className="relative flex-grow">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surgical-dim" />
              <input 
                type="email" 
                placeholder="colleague@example.com"
                className="w-full pl-9 pr-3 py-2 bg-alabaster-haze border border-alabaster-vein rounded-md text-sm outline-none focus:border-surgical-accent focus:bg-white transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            
            {/* Role Select for Invite */}
            <div className="relative">
              <button 
                type="button"
                className="h-full px-3 border border-alabaster-vein rounded-md bg-white text-xs font-medium text-surgical-steel flex items-center gap-2 hover:bg-alabaster-haze transition-colors min-w-[100px] justify-between"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              >
                {selectedRole}
                <ChevronDown size={12} />
              </button>
              
              {isRoleDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsRoleDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-[160px] bg-white border border-alabaster-vein shadow-menu rounded-lg z-20 overflow-hidden py-1">
                    {[AccessLevel.FULL_ACCESS, AccessLevel.CAN_EDIT, AccessLevel.CAN_COMMENT, AccessLevel.CAN_VIEW].map((role) => (
                      <div 
                        key={role}
                        className="px-3 py-2 text-xs hover:bg-alabaster-vein cursor-pointer flex items-center justify-between text-surgical-steel"
                        onClick={() => { setSelectedRole(role); setIsRoleDropdownOpen(false); }}
                      >
                        {role}
                        {selectedRole === role && <Check size={12} />}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button 
              type="submit"
              disabled={!email.trim()}
              className="bg-surgical-accent text-white px-4 py-2 rounded-md text-sm font-medium hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Invite
            </button>
          </form>
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto custom-scrollbar p-2">
            
            {/* Pending Invites */}
            {pendingInvites.length > 0 && (
                <div className="mb-4">
                    <div className="px-3 py-2 text-xs font-semibold text-surgical-dim uppercase tracking-wider">Pending ({pendingInvites.length})</div>
                    {pendingInvites.map(invite => (
                        <div key={invite.id} className="flex items-center justify-between p-3 hover:bg-alabaster-haze rounded-lg group transition-colors opacity-80">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-alabaster-vein border border-dashed border-surgical-dim flex items-center justify-center text-surgical-dim">
                                    <Clock size={14} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-surgical-steel">{invite.toEmail}</span>
                                    <span className="text-xs text-surgical-dim">Invited as {invite.role}</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleCancelInvite(invite.id)}
                                className="text-xs text-surgical-dim hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                                title="Revoke invitation"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    <div className="h-[1px] bg-alabaster-vein mx-3 my-2" />
                </div>
            )}

            {/* Active Members */}
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-surgical-dim uppercase tracking-wider">Members ({workspace.members.length})</div>
              {workspace.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 hover:bg-alabaster-haze rounded-lg group transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center text-sm font-semibold text-surgical-steel border border-white shadow-sm">
                      {member.avatar || member.email[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-surgical-steel">
                        {member.name || member.email.split('@')[0]} 
                        {member.role === AccessLevel.OWNER && <span className="ml-2 text-[10px] bg-alabaster-vein px-1.5 py-0.5 rounded text-surgical-dim">Owner</span>}
                        {member.id === workspace.members.find(m => m.role === AccessLevel.OWNER)?.id && <span className="ml-2 text-[10px] text-surgical-dim opacity-50">(You)</span>}
                      </span>
                      <span className="text-xs text-surgical-dim">{member.email}</span>
                    </div>
                  </div>

                  {/* Role Management */}
                  <div className="relative">
                    <button 
                      className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors ${member.role === AccessLevel.OWNER ? 'text-surgical-dim cursor-default' : 'text-surgical-steel hover:bg-alabaster-vein cursor-pointer'}`}
                      onClick={() => member.role !== AccessLevel.OWNER && setActiveMemberMenu(activeMemberMenu === member.id ? null : member.id)}
                    >
                      {member.role}
                      {member.role !== AccessLevel.OWNER && <ChevronDown size={12} className="opacity-50" />}
                    </button>

                    {activeMemberMenu === member.id && (
                      <>
                         <div className="fixed inset-0 z-10" onClick={() => setActiveMemberMenu(null)} />
                         <div className="absolute right-0 top-full mt-1 w-[180px] bg-white border border-alabaster-vein shadow-menu rounded-lg z-20 py-1 overflow-hidden animate-modal-entry origin-top-right">
                            {[AccessLevel.FULL_ACCESS, AccessLevel.CAN_EDIT, AccessLevel.CAN_COMMENT, AccessLevel.CAN_VIEW].map((role) => (
                               <div 
                                  key={role}
                                  className="px-3 py-2 text-xs hover:bg-alabaster-vein cursor-pointer flex items-center justify-between text-surgical-steel"
                                  onClick={() => { onUpdateRole(member.id, role); setActiveMemberMenu(null); }}
                               >
                                  {role}
                                  {member.role === role && <Check size={12} />}
                               </div>
                            ))}
                            <div className="h-[1px] bg-alabaster-vein my-1" />
                            <div 
                              className="px-3 py-2 text-xs text-red-600 hover:bg-red-50 cursor-pointer"
                              onClick={() => { onRemoveMember(member.id); setActiveMemberMenu(null); }}
                            >
                              Remove from workspace
                            </div>
                         </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-alabaster-haze border-t border-alabaster-vein flex items-center justify-between text-xs text-surgical-dim shrink-0">
           <div className="flex items-center gap-2">
              <Shield size={12} />
              <span>Admins can manage settings</span>
           </div>
           <button 
             className="hover:text-surgical-steel transition-colors"
             onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Link copied to clipboard"); }}
           >
             Copy invite link
           </button>
        </div>
      </div>
    </div>
  );
};