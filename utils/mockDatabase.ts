import { Workspace, User, Invitation, Page, AccessLevel, Member } from '../types';

const DB_KEY = 'surgical_cloud_db';

interface DBStructure {
  users: User[];
  workspaces: Workspace[];
  invitations: Invitation[];
}

// Initial Data Helper
const getDB = (): DBStructure => {
  const stored = localStorage.getItem(DB_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return { users: [], workspaces: [], invitations: [] };
};

const saveDB = (db: DBStructure) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

// --- Data Management (Export/Import) ---

export const dbExportJson = (): string => {
    const db = getDB();
    return JSON.stringify(db, null, 2);
};

export const dbImportJson = (jsonString: string): boolean => {
    try {
        const parsed = JSON.parse(jsonString);
        // Basic validation
        if (Array.isArray(parsed.users) && Array.isArray(parsed.workspaces)) {
            saveDB(parsed);
            return true;
        }
        return false;
    } catch (e) {
        console.error("Import failed", e);
        return false;
    }
};

// --- User Operations ---

export const dbRegisterUser = (user: User): User => {
  const db = getDB();
  const existing = db.users.find(u => u.email === user.email);
  if (existing) return existing;
  
  db.users.push(user);
  saveDB(db);
  return user;
};

export const dbLogin = (email: string): User | null => {
  const db = getDB();
  return db.users.find(u => u.email === email) || null;
};

export const dbUpdateUser = (userId: string, updates: Partial<User>): User | null => {
    const db = getDB();
    const index = db.users.findIndex(u => u.id === userId);
    if (index !== -1) {
        db.users[index] = { ...db.users[index], ...updates };
        
        // Also update member details in all workspaces to keep sync
        db.workspaces.forEach(ws => {
            ws.members.forEach(m => {
                if (m.id === userId) {
                    if (updates.name) m.name = updates.name;
                    if (updates.avatar !== undefined) m.avatar = updates.avatar || m.name?.[0]?.toUpperCase() || 'U';
                }
            });
        });

        saveDB(db);
        return db.users[index];
    }
    return null;
};

// --- Workspace Operations ---

export const dbGetWorkspacesForUser = (userId: string, userEmail: string): Workspace[] => {
  const db = getDB();
  return db.workspaces.filter(ws => 
    ws.members.some(m => m.id === userId || m.email === userEmail)
  );
};

export const dbCreateWorkspace = (workspace: Workspace) => {
  const db = getDB();
  db.workspaces.push(workspace);
  saveDB(db);
};

export const dbUpdateWorkspace = (workspaceId: string, updates: Partial<Workspace>) => {
  const db = getDB();
  const index = db.workspaces.findIndex(w => w.id === workspaceId);
  if (index !== -1) {
    db.workspaces[index] = { ...db.workspaces[index], ...updates };
    saveDB(db);
  }
};

export const dbUpdatePage = (workspaceId: string, updatedPage: Page) => {
    const db = getDB();
    const wsIndex = db.workspaces.findIndex(w => w.id === workspaceId);
    if (wsIndex !== -1) {
        const ws = db.workspaces[wsIndex];
        const pageIndex = ws.pages.findIndex(p => p.id === updatedPage.id);
        
        if (pageIndex !== -1) {
            // Update existing
            ws.pages[pageIndex] = updatedPage;
        } else {
            // Add new (if somehow not added via createPage flow, though usually separate)
            ws.pages.push(updatedPage);
        }
        
        // Also update activePageId logic if needed? No, purely data storage.
        db.workspaces[wsIndex] = ws;
        saveDB(db);
    }
};

export const dbAddPage = (workspaceId: string, newPage: Page) => {
    const db = getDB();
    const ws = db.workspaces.find(w => w.id === workspaceId);
    if (ws) {
        ws.pages.push(newPage);
        ws.activePageId = newPage.id;
        saveDB(db);
    }
};

// --- Invitation Operations ---

export const dbCreateInvitation = (
  fromUser: User,
  toEmail: string,
  workspaceId: string,
  role: AccessLevel
) => {
  const db = getDB();
  const ws = db.workspaces.find(w => w.id === workspaceId);
  if (!ws) return;

  // Check if already member
  if (ws.members.some(m => m.email === toEmail)) {
      return { success: false, message: "User is already a member" };
  }
  
  // Check if already invited
  if (db.invitations.some(i => i.toEmail === toEmail && i.workspaceId === workspaceId && i.status === 'pending')) {
      return { success: false, message: "Invitation already pending" };
  }

  const newInvite: Invitation = {
    id: Math.random().toString(36).substr(2, 9),
    fromUser: { name: fromUser.name, avatar: fromUser.avatar || fromUser.initials },
    toEmail,
    workspaceId,
    workspaceName: ws.name,
    workspaceIcon: ws.icon,
    role,
    timestamp: Date.now(),
    status: 'pending'
  };

  db.invitations.push(newInvite);
  saveDB(db);
  return { success: true };
};

export const dbGetPendingInvitations = (email: string): Invitation[] => {
  const db = getDB();
  return db.invitations.filter(inv => inv.toEmail === email && inv.status === 'pending');
};

// New: Get pending invites specifically for a workspace (to show in Members Modal)
export const dbGetPendingWorkspaceInvites = (workspaceId: string): Invitation[] => {
    const db = getDB();
    return db.invitations.filter(inv => inv.workspaceId === workspaceId && inv.status === 'pending');
};

// New: Cancel an invitation
export const dbCancelInvitation = (inviteId: string) => {
    const db = getDB();
    db.invitations = db.invitations.filter(i => i.id !== inviteId);
    saveDB(db);
};

export const dbAcceptInvitation = (inviteId: string, user: User) => {
  const db = getDB();
  const inviteIndex = db.invitations.findIndex(i => i.id === inviteId);
  if (inviteIndex === -1) return;

  const invite = db.invitations[inviteIndex];
  const wsIndex = db.workspaces.findIndex(w => w.id === invite.workspaceId);

  if (wsIndex !== -1) {
    // Add member to workspace
    const newMember: Member = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar || user.initials,
      role: invite.role
    };
    
    // Avoid duplicates
    if (!db.workspaces[wsIndex].members.some(m => m.id === user.id)) {
        db.workspaces[wsIndex].members.push(newMember);
    }
    
    // Update invite status
    db.invitations[inviteIndex].status = 'accepted';
    
    // Cleanup accepted invites to keep DB small
    db.invitations = db.invitations.filter(i => i.id !== inviteId);
    
    saveDB(db);
    return invite.workspaceId; // Return ID for auto-switching
  }
};

export const dbDeclineInvitation = (inviteId: string) => {
  const db = getDB();
  db.invitations = db.invitations.filter(i => i.id !== inviteId);
  saveDB(db);
};

export const dbRemoveMember = (workspaceId: string, memberId: string) => {
    const db = getDB();
    const ws = db.workspaces.find(w => w.id === workspaceId);
    if(ws) {
        ws.members = ws.members.filter(m => m.id !== memberId);
        saveDB(db);
    }
}

export const dbUpdateMemberRole = (workspaceId: string, memberId: string, role: AccessLevel) => {
    const db = getDB();
    const ws = db.workspaces.find(w => w.id === workspaceId);
    if(ws) {
        const member = ws.members.find(m => m.id === memberId);
        if(member) member.role = role;
        saveDB(db);
    }
}