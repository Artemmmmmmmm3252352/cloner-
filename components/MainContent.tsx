import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Sparkles, Smile, ImageIcon, MessageSquare, X,
  Type, CheckSquare, 
  GripVertical, Trash2,
  Loader2, Kanban, GalleryHorizontal, FileText,
  BellRing, Send, RefreshCw, Lightbulb, Code,
  ChevronRight, ChevronDown, Video, Palette, PlayCircle, Map, ExternalLink, CornerUpRight
} from 'lucide-react';
import { Page, Block, BlockType, User, Comment, AccessLevel } from '../types';
import { askGemini, parseReminderWithAI } from '../utils/aiHelper';
import { TranslationKey } from '../utils/translations';

// --- Interfaces ---

interface MainContentProps {
  page: Page;
  currentUser: User;
  onUpdatePage: (updatedPage: Page) => void;
  showComments: boolean;
  setShowComments: (show: boolean) => void;
  t: (key: TranslationKey) => string;
  role: AccessLevel;
  onCreateSubPage?: (parentId: string) => string; // New prop
  onNavigate?: (pageId: string) => void; // New prop
}

interface CommandItem {
  id: BlockType | 'ask_ai' | 'timeline' | 'gallery' | string; // Allow string for colors
  label: string;
  desc: string;
  icon: React.ReactNode;
  category?: 'basic' | 'database' | 'media' | 'color';
  meta?: any; // Extra data for command execution (e.g. specific color)
}

// --- Utils ---

const generateId = () => Math.random().toString(36).substr(2, 9);

const getCaretCoordinates = () => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  return { x: rect.left, y: rect.bottom };
};

const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', 
  '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', 
  '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', 
  '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', 
  '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', 
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', 
  '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋', 
  '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👉', '👆', '🖕', '👇', 
  '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', 
  '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁', '👅', 
  '👄', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '👨‍🦰', '👨‍🦱', '👨‍🦳', '👨‍🦲', '👩', '👩‍🦰', 
  '🥬', '🥦', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩',
  '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛳', '⛴', '🚢', '⚓', '⛽', '🚧', '🚦', 
  '🏔️', '⛰', '🌋', '🗻', '⛺', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', 
  '🏗', '🧱', '🪨', '🪵', '🛖', '🏘️', '🏚️', '🏠', '🏡', '🏢',
  '🦊', '🦁', '🐯', '🐴', '🦄', '🦓', '🦌', '🐮', '🐂', '🐃', '🐄', '🐖', '🐗', 
  '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦣', '🦏'
];

// --- Sub-components ---

const PlaceholderBlock = ({ type, label }: { type: 'timeline' | 'gallery', label?: string }) => (
    <div className="w-full h-32 bg-alabaster-haze border border-dashed border-alabaster-vein rounded-lg flex items-center justify-center text-surgical-dim">
        <div className="flex flex-col items-center gap-2">
            {type === 'timeline' ? <Kanban size={24} /> : <GalleryHorizontal size={24} />}
            <span className="text-sm font-medium">{label || (type === 'timeline' ? "Timeline View" : "Gallery View")}</span>
        </div>
    </div>
);

const CommentsSidebar = ({ comments, onAddComment, onClose, currentUser, t }: { comments: Comment[], onAddComment: (text: string) => void, onClose: () => void, currentUser: User, t: (key: TranslationKey) => string }) => {
    const [newComment, setNewComment] = useState("");
    return (
        <div className="w-[300px] border-l border-alabaster-vein bg-white flex flex-col h-full shrink-0 animate-modal-entry absolute right-0 top-0 bottom-0 z-40 shadow-xl">
            <div className="p-4 border-b border-alabaster-vein flex justify-between items-center bg-alabaster-haze/30">
                <span className="font-semibold text-sm text-surgical-steel">{t('comments')}</span>
                <button onClick={onClose}><X size={16} className="text-surgical-dim" /></button>
            </div>
            <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                {comments.length === 0 ? (
                    <div className="text-center text-surgical-dim text-sm italic">{t('no_comments_yet')}</div>
                ) : (
                    comments.map(c => (
                        <div key={c.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-alabaster-vein flex items-center justify-center text-xs font-bold text-surgical-steel shrink-0 border border-white shadow-sm">
                                {c.userInitials}
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm font-medium text-surgical-steel">{c.userName}</span>
                                    <span className="text-[10px] text-surgical-dim">{new Date(c.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <p className="text-sm text-surgical-steel mt-0.5">{c.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="p-4 border-t border-alabaster-vein bg-white">
                <div className="relative">
                    <input 
                        className="w-full bg-alabaster-haze border border-alabaster-vein rounded-md px-3 py-2 pr-8 text-sm outline-none focus:border-surgical-accent transition-all"
                        placeholder={t('add_comment')}
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && newComment.trim()) {
                                onAddComment(newComment);
                                setNewComment("");
                            }
                        }}
                    />
                    <Send size={14} className="absolute right-2 top-2.5 text-surgical-dim cursor-pointer hover:text-surgical-accent" onClick={() => {
                        if (newComment.trim()) {
                             onAddComment(newComment);
                             setNewComment("");
                        }
                    }}/>
                </div>
            </div>
        </div>
    );
};

const TemplatePicker = ({ onSelect, t }: { onSelect: (type: 'meeting' | 'project' | 'journal') => void, t: (key: TranslationKey) => string }) => (
    <div className="mt-8 pt-8 border-t border-alabaster-vein opacity-60 hover:opacity-100 transition-opacity">
        <h3 className="text-xs font-semibold text-surgical-dim mb-4 uppercase tracking-wider text-center">{t('start_template')}</h3>
        <div className="flex justify-center gap-4">
            <button onClick={() => onSelect('meeting')} className="px-4 py-2 border border-alabaster-vein rounded-full hover:bg-stone-50 text-sm flex items-center gap-2 text-surgical-dim hover:text-surgical-steel transition-all">
                <MessageSquare size={14} /> {t('meeting_notes')}
            </button>
            <button onClick={() => onSelect('project')} className="px-4 py-2 border border-alabaster-vein rounded-full hover:bg-stone-50 text-sm flex items-center gap-2 text-surgical-dim hover:text-surgical-steel transition-all">
                <CheckSquare size={14} /> {t('project_plan')}
            </button>
            <button onClick={() => onSelect('journal')} className="px-4 py-2 border border-alabaster-vein rounded-full hover:bg-stone-50 text-sm flex items-center gap-2 text-surgical-dim hover:text-surgical-steel transition-all">
                <FileText size={14} /> {t('journal')}
            </button>
        </div>
    </div>
);

const TableBlock = ({ content, onUpdate, readOnly }: { content: string, onUpdate: (newContent: string) => void, readOnly: boolean }) => {
    const [data, setData] = useState<string[][]>([]);

    useEffect(() => {
        try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) setData(parsed);
            else throw new Error();
        } catch {
            setData([["Header 1", "Header 2"], ["Cell 1", "Cell 2"], ["Cell 3", "Cell 4"]]);
        }
    }, [content]);

    const handleCellChange = (rowIndex: number, colIndex: number, val: string) => {
        if (readOnly) return;
        const newData = [...data];
        newData[rowIndex] = [...newData[rowIndex]];
        newData[rowIndex][colIndex] = val;
        setData(newData);
        onUpdate(JSON.stringify(newData));
    };

    return (
        <div className="w-full overflow-x-auto my-2 border border-alabaster-vein rounded-lg bg-white shadow-sm">
            <table className="w-full text-sm border-collapse">
                <tbody>
                    {data.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-alabaster-vein last:border-0">
                            {row.map((cell, cIdx) => (
                                <td key={cIdx} className={`border-r border-alabaster-vein last:border-0 p-0 relative ${rIdx === 0 ? 'bg-stone-50 font-medium text-surgical-dim' : 'text-surgical-steel'}`}>
                                    <input 
                                        type="text" 
                                        value={cell} 
                                        onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                                        readOnly={readOnly}
                                        className="w-full px-3 py-2 bg-transparent outline-none focus:bg-blue-50/20 disabled:cursor-default"
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {!readOnly && (
                <div className="bg-stone-50 px-2 py-1 text-[10px] text-surgical-dim border-t border-alabaster-vein flex justify-between">
                    <span>Simple Table</span>
                    <span className="cursor-pointer hover:text-surgical-steel" onClick={() => {
                        const newData = [...data, Array(data[0].length).fill("")];
                        setData(newData);
                        onUpdate(JSON.stringify(newData));
                    }}>+ Row</span>
                </div>
            )}
        </div>
    );
};

const BlockComponent = React.memo(({ 
  block, 
  index, 
  onUpdate, 
  onKeyDown, 
  onFocus, 
  onAddBlock, 
  onDeleteBlock,
  autoFocus,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onContextMenu,
  t,
  readOnly,
  onNavigate
}: { 
  block: Block; 
  index: number; 
  onUpdate: (id: string, content: string, type?: BlockType, checked?: boolean, metadata?: any, indent?: number) => void; 
  onKeyDown: (e: React.KeyboardEvent, id: string, index: number) => void;
  onFocus: (id: string) => void;
  onAddBlock: (index: number) => void;
  onDeleteBlock: (id: string) => void;
  autoFocus?: boolean;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragEnter: (e: React.DragEvent, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  t: (key: TranslationKey) => string;
  readOnly: boolean;
  onNavigate?: (id: string) => void;
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [draggable, setDraggable] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  useEffect(() => {
    if (autoFocus && contentRef.current && !readOnly && !['table', 'board', 'calendar', 'placeholder', 'image', 'video', 'page_link', 'map'].includes(block.type)) {
      contentRef.current.focus();
    }
  }, [autoFocus, block.type, readOnly]);

  useEffect(() => {
    if (contentRef.current && contentRef.current.innerText !== block.content && !['table', 'board', 'calendar', 'placeholder', 'image', 'video', 'page_link', 'map'].includes(block.type)) {
       if (document.activeElement !== contentRef.current) {
          contentRef.current.innerText = block.content;
       }
    }
  }, [block.content, block.type]);

  const runAnalysis = async (text: string) => {
      if (readOnly) return;
      const timeRegex = /((today|tomorrow|mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|(сегодня|завтра|послезавтра|понедельник|вторник|среда|четверг|пятница|суббота|воскресенье|январ|феврал|март|апрел|мая|июн|июл|август|сентябр|октябр|ноябр|декабр)|(\d{1,2}[./-]\d{1,2})|(\d{1,2}:\d{2})|(at \d|in \d|next|remind|в \d|через \d))/i;
      if (!['text', 'todo', 'bullet', 'toggle'].includes(block.type) || text.length < 3 || !timeRegex.test(text)) return;
      setIsAnalyzing(true);
      const reminder = await parseReminderWithAI(text);
      setIsAnalyzing(false);
      if (reminder) {
          onUpdate(block.id, text, block.type, block.checked, { ...block.metadata, reminder: { ...reminder, originalText: text } });
      }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (readOnly) return;
    const newContent = e.currentTarget.innerText;
    onUpdate(block.id, newContent);
  };

  const handleLocalKeyDown = (e: React.KeyboardEvent) => {
      if (readOnly) return;
      if (e.key === 'Enter') {
          if (!e.shiftKey && !['code'].includes(block.type)) {
             runAnalysis(contentRef.current?.innerText || block.content);
          }
      }
      onKeyDown(e, block.id, index);
  };

  const getStyles = () => {
    let base = "";
    // Apply Color
    if (block.metadata?.color) {
        base += ` ${block.metadata.color}`;
    } else {
        base += " text-surgical-steel";
    }

    switch (block.type) {
      case 'h1': return `text-4xl font-serif font-medium mt-6 mb-3 ${base}`;
      case 'h2': return `text-2xl font-serif font-medium mt-5 mb-2 ${base}`;
      case 'h3': return `text-xl font-serif font-medium mt-3 mb-1 ${base}`;
      case 'quote': return `border-l-2 border-surgical-steel pl-4 py-2 my-3 text-lg font-serif italic ${block.metadata?.color ? base : 'text-surgical-steel/80'}`;
      case 'callout': return `bg-stone-50 p-4 rounded-lg border border-alabaster-vein flex items-start gap-3 my-2 shadow-sm ${base}`;
      case 'code': return `font-mono text-sm bg-stone-50 p-3 rounded-lg border border-alabaster-vein my-2 whitespace-pre-wrap ${base}`;
      case 'toggle': return `font-medium cursor-pointer flex items-center gap-1 ${base}`;
      case 'text': default: return `text-base py-1 min-h-[1.5em] leading-relaxed ${base}`;
    }
  };

  return (
    <div 
        className="group/block relative flex items-start py-[2px] transition-all"
        draggable={!readOnly && draggable}
        onDragStart={(e) => !readOnly && onDragStart(e, index)}
        onDragEnter={(e) => !readOnly && onDragEnter(e, index)}
        onDragEnd={!readOnly ? onDragEnd : undefined}
        onDragOver={(e) => e.preventDefault()}
        style={{ 
            opacity: 1,
            paddingLeft: `${(block.indent || 0) * 24}px` 
        }}
    >
      {!readOnly && (
          <div 
            className="absolute left-0 top-1.5 opacity-0 group-hover/block:opacity-100 transition-opacity cursor-grab active:cursor-grabbing flex items-center p-0.5 rounded hover:bg-stone-100 text-surgical-dim -ml-8"
            contentEditable={false}
            onMouseEnter={() => setDraggable(true)}
            onMouseLeave={() => setDraggable(false)}
            onContextMenu={(e) => onContextMenu(e, block.id)}
          >
            <div className="relative group/menu">
                <GripVertical size={16} />
            </div>
          </div>
      )}

      {/* Markers / Icons */}
      {block.type === 'bullet' && <div className="w-6 mr-1 flex items-center justify-center shrink-0 mt-2.5 select-none"><div className="w-1.5 h-1.5 bg-surgical-dim/60 rounded-full" /></div>}
      {block.type === 'number' && <div className="w-6 mr-1 flex items-center justify-end shrink-0 mt-1 select-none font-mono text-sm text-surgical-dim">1.</div>}
      {block.type === 'todo' && (
        <div className="w-6 mr-1 flex items-center justify-center shrink-0 mt-1.5 select-none">
          <div 
            onClick={() => !readOnly && onUpdate(block.id, block.content, block.type, !block.checked)}
            className={`w-4 h-4 border rounded ${readOnly ? 'cursor-default' : 'cursor-pointer'} transition-colors flex items-center justify-center ${block.checked ? 'bg-surgical-steel border-surgical-steel' : 'border-surgical-dim/40 hover:border-surgical-steel'}`}
          >
             {block.checked && <CheckSquare size={10} className="text-white" />}
          </div>
        </div>
      )}
      {block.type === 'toggle' && (
          <div 
            className="w-6 mr-1 flex items-center justify-center shrink-0 mt-1.5 cursor-pointer text-surgical-dim hover:bg-stone-100 rounded"
            contentEditable={false}
            onClick={() => !readOnly && onUpdate(block.id, block.content, block.type, block.checked, { ...block.metadata, collapsed: !block.metadata?.collapsed })}
          >
              {block.metadata?.collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </div>
      )}
      {block.type === 'callout' && (
          <div className="mt-3.5 select-none" contentEditable={false}>
              <Lightbulb size={20} className="text-amber-500" />
          </div>
      )}

      <div className="flex-grow relative min-w-0">
        {block.type === 'divider' ? (
            <div className="w-full py-4 cursor-default" contentEditable={false}><hr className="border-alabaster-vein border-t" /></div>
        ) : block.type === 'table' ? (
            <TableBlock content={block.content} onUpdate={(c) => onUpdate(block.id, c)} readOnly={readOnly} />
        ) : block.type === 'placeholder' ? (
            <PlaceholderBlock type={block.metadata?.placeholderType || 'timeline'} label={block.metadata?.label} />
        ) : block.type === 'image' ? (
            <div className="relative group/image my-2" contentEditable={false}>
                {block.content ? (
                    <>
                        <img 
                            src={block.content} 
                            alt="Block media" 
                            className="max-w-full rounded-lg shadow-sm border border-alabaster-vein" 
                        />
                        {!readOnly && (
                            <button 
                                className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-surgical-dim opacity-0 group-hover/image:opacity-100 transition-opacity shadow-sm hover:bg-white"
                                onClick={() => onUpdate(block.id, '')} 
                                title="Change Image"
                            >
                                <RefreshCw size={14} />
                            </button>
                        )}
                    </>
                ) : (
                    <div className="flex gap-2 items-center bg-stone-50 p-4 rounded-lg border border-alabaster-vein border-dashed">
                        <ImageIcon size={16} className="text-surgical-dim" />
                        <input 
                            className="bg-transparent outline-none text-sm w-full placeholder:text-surgical-dim/50 text-surgical-steel" 
                            placeholder={readOnly ? "Empty image block" : "Paste image URL and press Enter..."}
                            readOnly={readOnly}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') {
                                    onUpdate(block.id, e.currentTarget.value);
                                }
                            }}
                            onBlur={(e) => {
                                if(e.target.value) onUpdate(block.id, e.target.value);
                            }}
                            autoFocus={autoFocus}
                        />
                    </div>
                )}
            </div>
        ) : block.type === 'video' ? (
             <div className="relative group/video my-2" contentEditable={false}>
                {block.content ? (
                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-sm">
                        {block.content.includes('youtube.com') || block.content.includes('youtu.be') ? (
                             <iframe 
                                src={block.content.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')} 
                                className="w-full h-full" 
                                frameBorder="0" 
                                allowFullScreen 
                             />
                        ) : (
                             <video src={block.content} controls className="w-full h-full" />
                        )}
                        {!readOnly && (
                            <button 
                                className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-surgical-dim opacity-0 group-hover/video:opacity-100 transition-opacity shadow-sm hover:bg-white z-10"
                                onClick={() => onUpdate(block.id, '')} 
                                title="Change Video"
                            >
                                <RefreshCw size={14} />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex gap-2 items-center bg-stone-50 p-4 rounded-lg border border-alabaster-vein border-dashed">
                        <Video size={16} className="text-surgical-dim" />
                        <input 
                            className="bg-transparent outline-none text-sm w-full placeholder:text-surgical-dim/50 text-surgical-steel" 
                            placeholder={readOnly ? "Empty video block" : "Paste YouTube or Video URL..."}
                            readOnly={readOnly}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') {
                                    onUpdate(block.id, e.currentTarget.value);
                                }
                            }}
                            onBlur={(e) => {
                                if(e.target.value) onUpdate(block.id, e.target.value);
                            }}
                            autoFocus={autoFocus}
                        />
                    </div>
                )}
            </div>
        ) : block.type === 'map' ? (
             <div className="relative group/map my-2" contentEditable={false}>
                {block.content ? (
                    <div className="relative w-full aspect-video bg-stone-50 rounded-lg overflow-hidden border border-alabaster-vein shadow-sm">
                        <iframe 
                           src={`https://www.google.com/maps/embed/v1/place?key=${(window as any).process.env.API_KEY}&q=${encodeURIComponent(block.content)}`}
                           className="w-full h-full" 
                           frameBorder="0" 
                           allowFullScreen 
                        />
                        {!readOnly && (
                            <button 
                                className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-surgical-dim opacity-0 group-hover/map:opacity-100 transition-opacity shadow-sm hover:bg-white z-10"
                                onClick={() => onUpdate(block.id, '')} 
                                title="Change Location"
                            >
                                <RefreshCw size={14} />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex gap-2 items-center bg-stone-50 p-4 rounded-lg border border-alabaster-vein border-dashed">
                        <Map size={16} className="text-surgical-dim" />
                        <input 
                            className="bg-transparent outline-none text-sm w-full placeholder:text-surgical-dim/50 text-surgical-steel" 
                            placeholder={readOnly ? "Empty map block" : "Type location (e.g. 'Paris') and press Enter..."}
                            readOnly={readOnly}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') {
                                    onUpdate(block.id, e.currentTarget.value);
                                }
                            }}
                            onBlur={(e) => {
                                if(e.target.value) onUpdate(block.id, e.target.value);
                            }}
                            autoFocus={autoFocus}
                        />
                    </div>
                )}
            </div>
        ) : block.type === 'page_link' ? (
            <div 
                className="my-1 group/link" 
                contentEditable={false}
                onClick={() => block.metadata?.pageId && onNavigate && onNavigate(block.metadata.pageId)}
            >
                <div className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-stone-50 border border-alabaster-vein rounded-lg cursor-pointer transition-colors shadow-sm">
                    <div className="w-8 h-8 flex items-center justify-center text-lg bg-stone-50 rounded-full border border-alabaster-vein">
                        <FileText size={16} className="text-surgical-dim" />
                    </div>
                    <span className="text-sm font-medium text-surgical-steel pb-0.5">
                        {block.content || "Untitled Page"}
                    </span>
                    <CornerUpRight size={14} className="ml-auto text-surgical-dim opacity-0 group-hover/link:opacity-100 transition-opacity" />
                </div>
            </div>
        ) : (
            <div
                ref={contentRef}
                contentEditable={!readOnly}
                suppressContentEditableWarning
                className={`
                    w-full outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300
                    ${getStyles()}
                    ${block.type === 'todo' && block.checked ? 'line-through text-gray-400' : ''}
                    ${readOnly ? 'cursor-text' : ''}
                `}
                data-placeholder={readOnly ? '' : (block.type === 'text' ? "Type '/' for commands" : block.type === 'code' ? 'Type code...' : block.type === 'toggle' ? 'Toggle list' : `Heading ${block.type.replace('h', '')}`)}
                onInput={handleInput}
                onKeyDown={handleLocalKeyDown}
                onFocus={() => !readOnly && onFocus(block.id)}
                id={`block-${block.id}`}
            />
        )}
        
        {/* Reminders Logic Visuals */}
        <div className="absolute top-0 right-0 flex items-center gap-2 h-full pointer-events-none transform translate-x-full pl-2">
            {isAnalyzing && <Loader2 size={12} className="text-surgical-accent animate-spin opacity-50" />}
            {block.metadata?.reminder && !isAnalyzing && (
                <div className="flex items-center gap-1 text-[10px] text-surgical-accent bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap animate-in fade-in zoom-in shadow-sm min-w-fit">
                    <BellRing size={10} />
                    <span className="font-medium">{new Date(block.metadata.reminder.timestamp).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
});

// --- Main Editor Export ---

export const MainContent: React.FC<MainContentProps> = ({ page, currentUser, onUpdatePage, showComments, setShowComments, t, role, onCreateSubPage, onNavigate }) => {
  const canEdit = [AccessLevel.OWNER, AccessLevel.FULL_ACCESS, AccessLevel.CAN_EDIT].includes(role);
  const readOnly = !canEdit;

  const [title, setTitle] = useState(page.title);
  const [coverStyle, setCoverStyle] = useState<string | null>(page.coverStyle);
  const [icon, setIcon] = useState<string | null>(page.icon);
  const [blocks, setBlocks] = useState<Block[]>(page.blocks);
  const [comments, setComments] = useState<Comment[]>(page.comments || []);
  
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  
  // Slash Command State
  const [slashFilter, setSlashFilter] = useState('');
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; blockId: string | null }>({ visible: false, x: 0, y: 0, blockId: null });
  const [aiDialog, setAiDialog] = useState<{ visible: boolean; blockId: string | null; x: number; y: number }>({ visible: false, blockId: null, x: 0, y: 0 });
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Drag & Drop Refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const blockListRef = useRef<HTMLDivElement>(null);
  const aiDialogRef = useRef<HTMLDivElement>(null);
  const menuJustOpened = useRef(false);

  const isEmptyPage = blocks.length === 1 && blocks[0].type === 'text' && !blocks[0].content;

  const commands = useMemo<CommandItem[]>(() => [
    { id: 'text', label: t('text_label'), desc: t('text_desc'), icon: <Type size={18} />, category: 'basic' },
    { id: 'page', label: 'Page', desc: 'Embed a sub-page inside this page.', icon: <FileText size={18} />, category: 'basic' },
    { id: 'h1', label: t('h1_label'), desc: t('h1_desc'), icon: <Type size={18} className="font-bold" />, category: 'basic' },
    { id: 'h2', label: t('h2_label'), desc: t('h2_desc'), icon: <Type size={16} className="font-bold" />, category: 'basic' },
    { id: 'h3', label: t('h3_label'), desc: t('h3_desc'), icon: <Type size={14} className="font-bold" />, category: 'basic' },
    { id: 'todo', label: t('todo_label'), desc: t('todo_desc'), icon: <CheckSquare size={18} />, category: 'basic' },
    { id: 'bullet', label: t('bullet_label'), desc: t('bullet_desc'), icon: <div className="w-1.5 h-1.5 bg-current rounded-full" />, category: 'basic' },
    { id: 'toggle', label: 'Toggle list', desc: 'Toggles can hide and show content inside.', icon: <ChevronRight size={18} />, category: 'basic' },
    { id: 'image', label: t('image_label'), desc: t('image_desc'), icon: <ImageIcon size={18} />, category: 'media' },
    { id: 'video', label: 'Video', desc: 'Embed from YouTube or upload.', icon: <Video size={18} />, category: 'media' },
    { id: 'map', label: 'Google Maps', desc: 'Embed a Google Map.', icon: <Map size={18} />, category: 'media' },
    { id: 'code', label: t('code_label'), desc: t('code_desc'), icon: <Code size={18} />, category: 'basic' },
    { id: 'callout', label: t('callout_label'), desc: t('callout_desc'), icon: <Lightbulb size={18} />, category: 'basic' },
    { id: 'divider', label: t('divider_label'), desc: t('divider_desc'), icon: <div className="h-[1px] w-4 bg-current" />, category: 'basic' },
    { id: 'ask_ai', label: t('ask_ai_label'), desc: t('ask_ai_desc'), icon: <Sparkles size={18} />, category: 'media' },
    // Colors
    { id: 'color_red', label: 'Red', desc: 'Color text red', icon: <div className="w-4 h-4 bg-red-500 rounded" />, category: 'color', meta: 'text-red-600' },
    { id: 'color_blue', label: 'Blue', desc: 'Color text blue', icon: <div className="w-4 h-4 bg-blue-500 rounded" />, category: 'color', meta: 'text-blue-600' },
    { id: 'color_green', label: 'Green', desc: 'Color text green', icon: <div className="w-4 h-4 bg-green-500 rounded" />, category: 'color', meta: 'text-green-600' },
    { id: 'bg_yellow', label: 'Yellow Background', desc: 'Highlight text yellow', icon: <div className="w-4 h-4 bg-yellow-200 rounded" />, category: 'color', meta: 'bg-yellow-100' },
    { id: 'bg_red', label: 'Red Background', desc: 'Highlight text red', icon: <div className="w-4 h-4 bg-red-100 rounded" />, category: 'color', meta: 'bg-red-50' },
    { id: 'reset_color', label: 'Default Color', desc: 'Remove color', icon: <X size={16} />, category: 'color', meta: '' },
  ], [t]);

  // Filtered Commands for Menu
  const filteredCommands = useMemo(() => {
    if (!slashFilter) return commands;
    const lowerFilter = slashFilter.toLowerCase();
    return commands.filter(c => 
        c.label.toLowerCase().includes(lowerFilter) || 
        c.id.includes(lowerFilter)
    );
  }, [commands, slashFilter]);

  // Reset selected index when filter changes
  useEffect(() => {
      setSelectedCommandIndex(0);
  }, [filteredCommands]);

  // Detect Slash Command Typing in Active Block
  useEffect(() => {
      if (menuOpen && activeBlockId) {
          const block = blocks.find(b => b.id === activeBlockId);
          if (block) {
               // Fix: Handle the initial state where slash command was just triggered but content might be stale or just updated
               if (menuJustOpened.current) {
                   menuJustOpened.current = false;
                   return; // Skip the check immediately after opening
               }

               const match = block.content.match(/^\/(.*)/); 
               if (match) {
                   setSlashFilter(match[1]);
               } else {
                   setMenuOpen(false); 
                   setSlashFilter('');
               }
          }
      }
  }, [blocks, menuOpen, activeBlockId]);

  useEffect(() => {
    if (page.title !== title || page.icon !== icon || page.coverStyle !== coverStyle || page.blocks !== blocks || page.comments !== comments) {
        onUpdatePage({ ...page, title, icon, coverStyle, blocks, comments, updatedAt: Date.now() });
    }
  }, [title, icon, coverStyle, blocks, comments]);

  // Click Outside Handlers
  useEffect(() => {
    const handleClick = () => {
        setContextMenu({ ...contextMenu, visible: false });
        if (menuOpen) {
            setMenuOpen(false);
            setSlashFilter('');
        }
        if (showIconPicker) setShowIconPicker(false);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [menuOpen, showIconPicker, contextMenu]);

  const handleAddComment = (text: string) => {
      const newComment: Comment = { id: generateId(), userId: currentUser.id, userName: currentUser.name, userInitials: currentUser.initials, content: text, timestamp: Date.now() };
      setComments(prev => [...prev, newComment]);
  };

  const updateBlock = useCallback((id: string, content: string, type?: BlockType, checked?: boolean, metadata?: any, indent?: number) => {
    if (readOnly) return;
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content, ...(type && { type }), checked, metadata: metadata || b.metadata, indent: indent !== undefined ? indent : b.indent } : b));
  }, [readOnly]);

  const addBlockCorrect = useCallback((index: number, type: BlockType = 'text', metadata?: any) => {
      if (readOnly) return generateId();
      const newId = generateId();
      setBlocks(prev => {
          const prevBlock = prev[index]; 
          const indent = prevBlock ? (prevBlock.indent || 0) : 0;
          const newBlock: Block = { id: newId, type, content: '', metadata, indent };
          return [...prev.slice(0, index + 1), newBlock, ...prev.slice(index + 1)];
      });
      return newId;
  }, [readOnly]);

  const deleteBlock = useCallback((id: string) => {
    if (readOnly) return;
    setBlocks(prev => {
        if (prev.length <= 1) return [{ ...prev[0], content: '', type: 'text' }]; 
        return prev.filter(b => b.id !== id);
    });
  }, [readOnly]);

  // --- Indentation & Reordering & Menu Nav ---

  const handleKeyDown = (e: React.KeyboardEvent, id: string, index: number) => {
    if (readOnly) return;
    
    // Slash Menu Navigation
    if (menuOpen) {
        if (e.key === 'Escape') {
            e.preventDefault();
            setMenuOpen(false);
            setSlashFilter('');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedCommandIndex(prev => (prev + 1) % filteredCommands.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedCommandIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands.length > 0) {
                executeCommand(filteredCommands[selectedCommandIndex]);
            }
        }
        return;
    }

    // Tab for Indentation
    if (e.key === 'Tab') {
        e.preventDefault();
        const direction = e.shiftKey ? -1 : 1;
        const currentIndent = blocks[index].indent || 0;
        const newIndent = Math.max(0, Math.min(8, currentIndent + direction)); // Max depth 8
        updateBlock(id, blocks[index].content, undefined, undefined, undefined, newIndent);
        return;
    }

    if (e.key === '/') {
        const coords = getCaretCoordinates();
        if (coords) {
             setMenuPosition({ top: coords.y + 10, left: coords.x });
             setMenuOpen(true);
             menuJustOpened.current = true; // Flag to prevent immediate closing by effect
             setSlashFilter('');
             setSelectedCommandIndex(0);
        }
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();

        // UX Improvement: Handle lists specifically
        const currentBlock = blocks[index];
        const isList = ['bullet', 'number', 'todo', 'toggle'].includes(currentBlock.type);

        if (isList && currentBlock.content === '') {
            // Empty list item?
            if ((currentBlock.indent || 0) > 0) {
                 // Outdent
                 updateBlock(id, '', undefined, undefined, undefined, (currentBlock.indent || 0) - 1);
            } else {
                 // Convert to text
                 updateBlock(id, '', 'text');
            }
            return;
        }

        // Create new block
        // Headers (h1, h2, h3) should break into 'text', Lists should continue as list
        const nextType = isList ? currentBlock.type : 'text';
        const newId = addBlockCorrect(index, nextType);
        setTimeout(() => document.getElementById(`block-${newId}`)?.focus(), 10);
    }
    
    if (e.key === 'Backspace' && blocks[index].content === '') {
        e.preventDefault();
        // UX Improvement: Outdent on backspace
        if ((blocks[index].indent || 0) > 0) {
             updateBlock(id, '', undefined, undefined, undefined, (blocks[index].indent || 0) - 1);
        } else {
            deleteBlock(id);
            if (index > 0) {
                setTimeout(() => {
                    const el = document.getElementById(`block-${blocks[index - 1].id}`);
                    if (el) {
                        el.focus();
                        // Move cursor to end for better UX
                        const range = document.createRange();
                        const sel = window.getSelection();
                        if (el.childNodes.length > 0) {
                             range.selectNodeContents(el);
                             range.collapse(false);
                             sel?.removeAllRanges();
                             sel?.addRange(range);
                        }
                    }
                }, 10);
            }
        }
    }
    
    // Block Navigation (Arrow Up/Down)
    if (e.key === 'ArrowUp' && index > 0) {
        setTimeout(() => document.getElementById(`block-${blocks[index - 1].id}`)?.focus(), 0);
    }
    if (e.key === 'ArrowDown' && index < blocks.length - 1) {
        setTimeout(() => document.getElementById(`block-${blocks[index + 1].id}`)?.focus(), 0);
    }
  };

  // --- Drag and Drop Handlers ---

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItem.current = index;
    // visual effect
    e.dataTransfer.effectAllowed = "move";
    // Phantom element hiding
    const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
    ghost.style.opacity = "1";
    ghost.style.position = "absolute"; 
    ghost.style.top = "-1000px";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const dragIndex = dragItem.current;
    const hoverIndex = dragOverItem.current;

    if (dragIndex !== null && hoverIndex !== null && dragIndex !== hoverIndex) {
        const _blocks = [...blocks];
        const draggedBlock = _blocks[dragIndex];
        _blocks.splice(dragIndex, 1);
        _blocks.splice(hoverIndex, 0, draggedBlock);
        
        setBlocks(_blocks);
        onUpdatePage({ ...page, blocks: _blocks, updatedAt: Date.now() });
    }
    
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleContextMenu = (e: React.MouseEvent, blockId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ visible: true, x: e.pageX, y: e.pageY, blockId });
  };

  const applyTemplate = (type: 'meeting' | 'project' | 'journal') => {
      if(readOnly) return;
      let newBlocks: Block[] = [];
      if (type === 'meeting') {
          newBlocks = [
              { id: generateId(), type: 'h1', content: 'Meeting Notes' },
              { id: generateId(), type: 'text', content: `Date: ${new Date().toLocaleDateString()}` },
              { id: generateId(), type: 'h2', content: 'Agenda' },
              { id: generateId(), type: 'todo', content: 'Topic 1' },
          ];
      } else if (type === 'project') {
           newBlocks = [
              { id: generateId(), type: 'h1', content: 'Project Plan' },
              { id: generateId(), type: 'text', content: 'Overview...' },
              { id: generateId(), type: 'h2', content: 'Tasks' },
              { id: generateId(), type: 'todo', content: 'Phase 1' },
          ];
      } else {
           newBlocks = [
              { id: generateId(), type: 'h1', content: 'Daily Journal' },
              { id: generateId(), type: 'quote', content: 'Write a quote here.' },
          ];
      }
      setBlocks(newBlocks);
      onUpdatePage({ ...page, blocks: newBlocks, updatedAt: Date.now() });
  };

  const executeCommand = (cmd: CommandItem) => {
       if(readOnly || !activeBlockId) return;
       setMenuOpen(false);
       setSlashFilter('');
       
       if (cmd.id === 'ask_ai') {
           const block = blocks.find(b => b.id === activeBlockId);
           if (block) {
               const rect = document.getElementById(`block-${block.id}`)?.getBoundingClientRect();
               if (rect) {
                  setAiDialog({ visible: true, blockId: block.id, x: rect.left, y: rect.bottom + 10 });
               }
           }
           return;
       }

       // Handle Sub-page creation
       if (cmd.id === 'page') {
           if (onCreateSubPage) {
               const newPageId = onCreateSubPage(page.id);
               const block = blocks.find(b => b.id === activeBlockId);
               if (block) {
                   updateBlock(activeBlockId, "Untitled Page", 'page_link', undefined, { ...block.metadata, pageId: newPageId });
               }
           }
           return;
       }

       // Handle Colors
       if (cmd.category === 'color') {
           const block = blocks.find(b => b.id === activeBlockId);
           if (block) {
                updateBlock(activeBlockId, block.content.replace(`/${slashFilter}`, '').trim(), block.type, block.checked, { ...block.metadata, color: cmd.meta });
           }
           return;
       }

       // Clear slash command text when converting type
       updateBlock(activeBlockId, '', cmd.id as BlockType);
       
       setTimeout(() => {
           const el = document.getElementById(`block-${activeBlockId}`);
           const input = el?.querySelector('input');
           if (input) input.focus();
           else el?.focus();
       }, 50);
  };

  const handleAiSubmit = async () => {
      if (!aiDialog.blockId || !aiPrompt.trim()) return;
      setIsAiLoading(true);
      const result = await askGemini(aiPrompt);
      if (result) {
         updateBlock(aiDialog.blockId, result);
         // Force focus back to the block to enable editing immediately
         setTimeout(() => {
             const el = document.getElementById(`block-${aiDialog.blockId}`);
             if(el) el.focus();
         }, 100);
      }
      setIsAiLoading(false);
      setAiDialog({ ...aiDialog, visible: false });
      setAiPrompt('');
  };

  // --- Render Logic for Toggles ---
  // We need to hide blocks that are children of collapsed toggles.
  const visibleBlocks: { block: Block, index: number }[] = [];
  const hiddenStack: number[] = []; // Stores indentation levels of collapsed toggles

  blocks.forEach((block, index) => {
     const currentIndent = block.indent || 0;
     
     // Check if we should be hidden
     if (hiddenStack.length > 0) {
         const parentIndent = hiddenStack[hiddenStack.length - 1];
         if (currentIndent > parentIndent) {
             // We are a child of a collapsed block -> Hide
             return; 
         } else {
             // We popped out of the collapsed level
             hiddenStack.pop(); 
             // Keep popping if we are still deeper than previous collapsed parents
             while(hiddenStack.length > 0 && currentIndent <= hiddenStack[hiddenStack.length - 1]) {
                 hiddenStack.pop();
             }
         }
     }

     // If this block is a collapsed toggle, push its indent to stack
     if (block.type === 'toggle' && block.metadata?.collapsed) {
         hiddenStack.push(currentIndent);
     }

     visibleBlocks.push({ block, index });
  });


  return (
    <div className="flex-grow flex h-full overflow-hidden relative">
        <div className="flex-grow flex flex-col h-full overflow-y-auto relative custom-scrollbar bg-white rounded-b-xl">
        
        {/* Cover */}
        {coverStyle && (
            <div className={`w-full h-[180px] relative group/cover shrink-0 animate-modal-entry ${coverStyle.startsWith('bg-[url') ? coverStyle : 'bg-gradient-to-r from-stone-100 to-stone-200'}`}>
            {!readOnly && (
                <div className="absolute bottom-2 right-4 opacity-0 group-hover/cover:opacity-100 transition-opacity flex gap-2">
                    <button onClick={() => setCoverStyle(null)} className="bg-white/80 hover:bg-white text-xs px-2 py-1 rounded text-surgical-dim shadow-sm flex items-center gap-1"><X size={12} /> Remove</button>
                </div>
            )}
            </div>
        )}

        <div className={`w-full mx-auto px-12 sm:px-16 pb-32 flex flex-col min-h-full transition-all duration-300 ${coverStyle ? 'pt-6' : 'pt-10'} ${page.fullWidth ? 'max-w-full' : 'max-w-[850px]'} ${page.smallText ? 'text-sm' : 'text-base'}`}>
            
            {/* Header Controls */}
            <div className="group/header mb-8 relative border-b border-transparent hover:border-alabaster-vein pb-2 transition-colors">
                {icon && (
                    <div className="relative w-fit z-20">
                        <div 
                            ref={iconRef}
                            className={`text-[64px] leading-none mb-4 w-fit hover:scale-105 transition-transform origin-left ${coverStyle ? '-mt-[50px]' : ''} ${readOnly ? 'cursor-default' : 'cursor-pointer'}`} 
                            onClick={(e) => { e.stopPropagation(); !readOnly && setShowIconPicker(!showIconPicker); }}
                        >
                            {icon.startsWith('http') ? ( <img src={icon} alt="Page icon" className="w-[64px] h-[64px] object-cover rounded-xl shadow-sm bg-white ring-2 ring-white" /> ) : ( <span>{icon}</span> )}
                        </div>
                        {showIconPicker && !readOnly && (
                            <div ref={pickerRef} className="absolute top-full left-0 mt-2 w-[350px] bg-white rounded-xl shadow-menu border border-black/5 z-50 overflow-hidden animate-modal-entry origin-top-left flex flex-col h-[400px]" onClick={e => e.stopPropagation()}>
                                <div className="grid grid-cols-6 gap-1 p-2"> {EMOJI_LIST.map((emoji) => ( <button key={emoji} className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-stone-50 rounded" onClick={() => { setIcon(emoji); setShowIconPicker(false); }}>{emoji}</button> ))} </div>
                            </div>
                        )}
                    </div>
                )}
                {!readOnly && (
                    <div className={`flex gap-2 h-6 transition-opacity duration-200 ${!icon && !coverStyle ? 'opacity-0 group-hover/header:opacity-100' : 'opacity-100'} ${coverStyle && !icon ? 'mt-4' : ''}`}>
                        {!icon && <button onClick={() => { const random = EMOJI_LIST[Math.floor(Math.random() * EMOJI_LIST.length)]; setIcon(random); }} className="text-xs text-surgical-dim hover:bg-stone-50 px-2 py-1 rounded flex gap-1"><Smile size={14}/> Add icon</button>}
                        {!coverStyle && <button onClick={() => setCoverStyle(`bg-[url('https://source.unsplash.com/random/1200x400/?abstract')] bg-cover bg-center`)} className="text-xs text-surgical-dim hover:bg-stone-50 px-2 py-1 rounded flex gap-1"><ImageIcon size={14}/> Add cover</button>}
                    </div>
                )}
                <textarea 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    readOnly={readOnly}
                    placeholder={t('new_page')} 
                    className="w-full resize-none overflow-hidden bg-transparent text-[40px] font-serif font-semibold text-surgical-steel placeholder:text-gray-200 outline-none border-none leading-tight mt-1" 
                    rows={1} 
                    style={{ height: 'auto', minHeight: '60px' }} 
                    onInput={(e) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} 
                />
            </div>

            {/* BLOCKS RENDERER */}
            <div className="flex flex-col gap-1 relative" ref={blockListRef}>
                {visibleBlocks.map(({ block, index }) => (
                    <BlockComponent 
                        key={block.id}
                        index={index}
                        block={block}
                        onUpdate={updateBlock}
                        onKeyDown={handleKeyDown}
                        onFocus={setActiveBlockId}
                        onAddBlock={addBlockCorrect}
                        onDeleteBlock={deleteBlock}
                        autoFocus={activeBlockId === block.id}
                        onDragStart={handleDragStart} 
                        onDragEnter={handleDragEnter}
                        onDragEnd={handleDragEnd}
                        onContextMenu={handleContextMenu}
                        t={t}
                        readOnly={readOnly}
                        onNavigate={onNavigate}
                    />
                ))}
            </div>
            {isEmptyPage && !readOnly && <TemplatePicker onSelect={applyTemplate} t={t} />}
        </div>

        {/* Slash Menu */}
        {menuOpen && !readOnly && (
            <div ref={menuRef} className="fixed w-[280px] bg-white rounded-xl shadow-menu border border-black/5 z-50 flex flex-col p-2 animate-modal-entry origin-top-left overflow-hidden max-h-[360px] overflow-y-auto custom-scrollbar" style={{ top: menuPosition.top, left: menuPosition.left }}>
                {filteredCommands.length > 0 ? (
                    filteredCommands.map((cmd, idx) => ( 
                        <div 
                            key={cmd.id} 
                            className={`p-2 cursor-pointer flex items-center gap-3 rounded-lg transition-colors ${idx === selectedCommandIndex ? 'bg-stone-50' : 'hover:bg-stone-50'}`}
                            onClick={()=>executeCommand(cmd)}
                            onMouseEnter={() => setSelectedCommandIndex(idx)}
                        >
                            <div className="w-10 h-10 flex items-center justify-center border border-alabaster-vein rounded-lg bg-white text-surgical-dim shadow-sm">
                                {cmd.icon} 
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-surgical-steel">{cmd.label}</span>
                                <span className="text-[11px] text-surgical-dim">{cmd.desc}</span>
                            </div>
                        </div> 
                    ))
                ) : (
                    <div className="p-2 text-xs text-surgical-dim text-center">No results</div>
                )}
            </div>
        )}

        {/* Context Menu (Right Click) */}
        {contextMenu.visible && !readOnly && (
             <div 
                className="fixed bg-white rounded-lg shadow-menu border border-black/5 z-[60] py-1 w-[160px] animate-modal-entry origin-top-left"
                style={{ top: contextMenu.y, left: contextMenu.x }}
             >
                 <div 
                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-2"
                    onClick={() => {
                        if (contextMenu.blockId) deleteBlock(contextMenu.blockId);
                        setContextMenu({ ...contextMenu, visible: false });
                    }}
                 >
                     <Trash2 size={14} /> Delete
                 </div>
             </div>
        )}

        {/* AI Dialog */}
        {aiDialog.visible && (
            <div 
                ref={aiDialogRef}
                className="fixed w-[320px] bg-white rounded-xl shadow-2xl border border-surgical-accent/20 z-[70] p-3 animate-modal-entry"
                style={{ top: aiDialog.y, left: aiDialog.x }}
            >
                <div className="flex items-center gap-2 mb-2 text-surgical-accent text-xs font-bold uppercase tracking-wide">
                    <Sparkles size={12} /> Ask AI
                </div>
                <textarea 
                    className="w-full h-20 bg-stone-50 border border-alabaster-vein rounded-md p-2 text-sm outline-none focus:border-surgical-accent resize-none mb-2"
                    placeholder="Help me write..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    autoFocus
                />
                <div className="flex justify-end gap-2">
                     <button onClick={() => setAiDialog({ ...aiDialog, visible: false })} className="text-xs px-2 py-1 text-surgical-dim hover:bg-alabaster-vein rounded">Cancel</button>
                     <button onClick={handleAiSubmit} disabled={isAiLoading} className="text-xs px-3 py-1 bg-surgical-accent text-white rounded hover:brightness-105 flex items-center gap-1">
                         {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Generate
                     </button>
                </div>
            </div>
        )}
        
        {showComments && (
            <CommentsSidebar 
                comments={comments} 
                onAddComment={handleAddComment} 
                onClose={() => setShowComments(false)}
                currentUser={currentUser}
                t={t}
            />
        )}
    </div>
  );
};