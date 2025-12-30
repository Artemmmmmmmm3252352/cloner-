import React from 'react';

export type BlockType = 'text' | 'h1' | 'h2' | 'h3' | 'bullet' | 'number' | 'todo' | 'quote' | 'divider' | 'table' | 'board' | 'calendar' | 'placeholder' | 'callout' | 'code' | 'image' | 'toggle' | 'video' | 'page_link' | 'map';

export type Language = 'en' | 'ru';

export interface Block {
  id: string;
  type: BlockType;
  content: string; // For tables/boards/calendars, this will be a JSON string
  checked?: boolean;
  indent?: number; // New: Indentation level (0-N)
  metadata?: {
      placeholderType?: 'timeline' | 'gallery'; // Reduced list since board/calendar are now real
      label?: string;
      reminder?: {
          title: string;
          timestamp: number; // Unix timestamp
          originalText: string;
      };
      language?: string; // For code blocks
      caption?: string; // For images
      color?: string; // e.g. 'text-red-600' or 'bg-yellow-100'
      collapsed?: boolean; // For toggle blocks
      pageId?: string; // For page_link blocks
  }
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userInitials: string;
  content: string;
  timestamp: number;
}

export interface Page {
  id: string;
  parentId?: string; // New: For nested pages
  title: string;
  icon: string | null;
  coverStyle: string | null;
  fullWidth?: boolean; // New: Toggle container width
  smallText?: boolean; // New: Toggle font size
  blocks: Block[];
  comments?: Comment[];
  updatedAt: number;
  deletedAt?: number; // Timestamp when moved to trash
  favorite?: boolean; // New property
}

export enum AccessLevel {
  OWNER = "Owner",
  FULL_ACCESS = "Full access",
  CAN_EDIT = "Can edit",
  CAN_COMMENT = "Can comment",
  CAN_VIEW = "Can view",
  NO_ACCESS = "No access"
}

export interface Member {
  id: string;
  email: string;
  name?: string;
  avatar?: string; // Emoji or URL
  role: AccessLevel;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string; // Emoji or initial
  tag: string; // e.g. "Work", "Personal", "School"
  pages: Page[];
  activePageId: string;
  members: Member[]; // List of workspace members
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  initials: string;
}

export interface Invitation {
  id: string;
  fromUser: { name: string; avatar: string };
  toEmail: string;
  workspaceId: string;
  workspaceName: string;
  workspaceIcon: string;
  role: AccessLevel;
  timestamp: number;
  status: 'pending' | 'accepted' | 'declined';
}

export interface NavItem {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}