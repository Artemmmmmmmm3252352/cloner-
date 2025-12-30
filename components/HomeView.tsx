import React, { useMemo } from 'react';
import { Page } from '../types';
import { Clock, FileText, CheckSquare, ArrowRight, Sun, Moon, Sunrise, Bell, Calendar as CalendarIcon } from 'lucide-react';
import { TranslationKey } from '../utils/translations';

interface HomeViewProps {
  pages: Page[];
  onNavigate: (pageId: string) => void;
  onToggleTask?: (pageId: string, blockId: string) => void; // Changed content -> blockId
  t: (key: TranslationKey) => string;
}

interface DashboardEvent {
  id: string;
  title: string;
  timestamp: number;
  pageId: string;
  pageTitle: string;
  type: 'ai-reminder' | 'calendar-event';
}

export const HomeView: React.FC<HomeViewProps> = ({ pages, onNavigate, onToggleTask, t }) => {
  // 1. Time-based Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: t('good_morning'), icon: <Sunrise size={24} className="text-orange-400" /> };
    if (hour < 18) return { text: t('good_afternoon'), icon: <Sun size={24} className="text-yellow-500" /> };
    return { text: t('good_evening'), icon: <Moon size={24} className="text-indigo-400" /> };
  }, [t]);

  // 2. Sort pages by recently updated
  const recentPages = useMemo(() => {
    return [...pages].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);
  }, [pages]);

  // 3. Aggregate Tasks (Unchecked todos from all pages)
  const myTasks = useMemo(() => {
    const tasks: { pageId: string; pageTitle: string; content: string; blockId: string }[] = [];
    pages.forEach(page => {
      page.blocks.forEach(block => {
        if (block.type === 'todo' && !block.checked && block.content.trim()) {
          tasks.push({
            pageId: page.id,
            pageTitle: page.title || t('untitled'),
            content: block.content,
            blockId: block.id // Identify by ID
          });
        }
      });
    });
    return tasks.slice(0, 5); // Show top 5
  }, [pages, t]);

  // 4. Aggregate Reminders & Calendar Events
  const upcomingEvents = useMemo(() => {
      const events: DashboardEvent[] = [];
      const now = Date.now();
      const twentyFourHoursAgo = now - 86400000;

      pages.forEach(page => {
          page.blocks.forEach(block => {
              // Source A: AI Reminders from Metadata
              if (block.metadata?.reminder) {
                  const ts = block.metadata.reminder.timestamp;
                  if (ts > twentyFourHoursAgo) {
                       events.push({
                          id: `rem-${block.id}`,
                          pageId: page.id,
                          pageTitle: page.title || t('untitled'),
                          title: block.metadata.reminder.title,
                          timestamp: ts,
                          type: 'ai-reminder'
                      });
                  }
              }

              // Source B: Explicit Calendar Blocks
              if (block.type === 'calendar') {
                  try {
                      const calendarItems = JSON.parse(block.content);
                      if (Array.isArray(calendarItems)) {
                          calendarItems.forEach((item: any) => {
                              // item.date is YYYY-MM-DD. We assume 9:00 AM for display sorting if no time
                              const dateParts = item.date.split('-');
                              if (dateParts.length === 3) {
                                  const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 9, 0, 0);
                                  const ts = dateObj.getTime();
                                  
                                  // Show future events or today's events
                                  if (ts > twentyFourHoursAgo) {
                                      events.push({
                                          id: `cal-${item.id}`,
                                          pageId: page.id,
                                          pageTitle: page.title || t('untitled'),
                                          title: item.title || t('untitled'),
                                          timestamp: ts,
                                          type: 'calendar-event'
                                      });
                                  }
                              }
                          });
                      }
                  } catch (e) {
                      // Ignore parse errors
                  }
              }
          });
      });
      
      return events.sort((a, b) => a.timestamp - b.timestamp).slice(0, 10);
  }, [pages, t]);

  return (
    <div className="flex-grow flex flex-col h-full overflow-y-auto custom-scrollbar bg-alabaster-pure px-6 sm:px-12 md:px-24 pt-12 pb-24">
      
      {/* Greeting Section */}
      <div className="flex flex-col items-center justify-center mb-12 mt-8 animate-modal-entry">
        <div className="mb-4">{greeting.icon}</div>
        <h1 className="text-3xl font-bold text-surgical-steel mb-2 text-center">{greeting.text}, Artemis</h1>
        <p className="text-surgical-dim text-sm text-center">Here is what's happening in your workspace today.</p>
      </div>

      <div className="max-w-[900px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Recently Visited Widget */}
        <div className="flex flex-col gap-4 animate-modal-entry" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-2 text-xs font-semibold text-surgical-dim uppercase tracking-wider">
            <Clock size={14} /> {t('recently_visited')}
          </div>
          <div className="grid grid-cols-1 gap-3">
            {recentPages.map(page => (
              <div 
                key={page.id}
                onClick={() => onNavigate(page.id)}
                className="group p-4 bg-white border border-alabaster-vein rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-alabaster-haze rounded flex items-center justify-center text-xl shadow-inner">
                  {page.icon || <FileText size={18} className="text-surgical-dim" />}
                </div>
                <div className="flex flex-col flex-grow">
                  <span className="font-medium text-surgical-steel group-hover:text-surgical-accent transition-colors">
                    {page.title || t('untitled')}
                  </span>
                  <span className="text-xs text-surgical-dim">
                    Edited {new Date(page.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <ArrowRight size={16} className="text-alabaster-vein group-hover:text-surgical-accent transition-colors opacity-0 group-hover:opacity-100" />
              </div>
            ))}
            {recentPages.length === 0 && (
              <div className="p-6 text-center text-surgical-dim bg-alabaster-haze rounded-lg border border-dashed border-alabaster-vein text-sm">
                {t('no_pages')}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tasks & Reminders */}
        <div className="flex flex-col gap-8">
            
            {/* Upcoming Events Widget */}
            <div className="flex flex-col gap-4 animate-modal-entry" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 text-xs font-semibold text-surgical-dim uppercase tracking-wider">
                <CalendarIcon size={14} /> {t('upcoming_events')}
              </div>
              <div className="bg-white border border-alabaster-vein rounded-lg shadow-sm p-2 min-h-[120px]">
                {upcomingEvents.length > 0 ? (
                    <div className="flex flex-col">
                        {upcomingEvents.map((event, i) => (
                            <div 
                                key={event.id}
                                onClick={() => onNavigate(event.pageId)}
                                className="p-3 hover:bg-alabaster-haze rounded flex items-center justify-between cursor-pointer group transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center border ${event.type === 'ai-reminder' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-orange-50 border-orange-100 text-orange-600'}`}>
                                        <span className="text-[9px] uppercase font-bold opacity-70">{new Date(event.timestamp).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                        <span className="text-sm font-bold leading-none">{new Date(event.timestamp).getDate()}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm font-medium text-surgical-steel">{event.title}</span>
                                        <span className="text-[10px] text-surgical-dim flex items-center gap-1">
                                            {event.type === 'ai-reminder' && <Bell size={8} />}
                                            {new Date(event.timestamp).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})} • in {event.pageTitle}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-surgical-dim gap-2 p-6">
                        <CalendarIcon size={20} className="opacity-20" />
                        <span className="text-sm">{t('no_events')}</span>
                    </div>
                )}
              </div>
            </div>

            {/* My Tasks Widget */}
            <div className="flex flex-col gap-4 animate-modal-entry" style={{ animationDelay: '0.15s' }}>
              <div className="flex items-center gap-2 text-xs font-semibold text-surgical-dim uppercase tracking-wider">
                <CheckSquare size={14} /> {t('task_snapshot')}
              </div>
              <div className="bg-white border border-alabaster-vein rounded-lg shadow-sm p-2">
                {myTasks.length > 0 ? (
                  <div className="flex flex-col">
                    {myTasks.map((task, i) => (
                      <div 
                        key={i}
                        className="p-3 hover:bg-alabaster-haze rounded flex items-start gap-3 group transition-colors cursor-default"
                      >
                        {/* Interactive Checkbox */}
                        <div 
                            className="mt-0.5 w-4 h-4 border border-surgical-dim/40 rounded flex items-center justify-center hover:border-surgical-steel cursor-pointer transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onToggleTask) onToggleTask(task.pageId, task.blockId);
                            }}
                        >
                        </div>
                        <div 
                            className="flex flex-col gap-0.5 flex-grow cursor-pointer"
                            onClick={() => onNavigate(task.pageId)}
                        >
                          <span className="text-sm text-surgical-steel leading-tight group-hover:text-surgical-accent transition-colors">{task.content}</span>
                          <span className="text-[10px] text-surgical-dim flex items-center gap-1">
                            from <span className="font-medium hover:underline">{task.pageTitle}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-surgical-dim gap-2 p-8">
                    <CheckSquare size={24} className="opacity-20" />
                    <span className="text-sm">{t('no_tasks')}</span>
                  </div>
                )}
              </div>
            </div>

        </div>

      </div>
    </div>
  );
};