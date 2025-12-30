import React, { useMemo } from 'react';
import { Page } from '../types';
import { Bell, Calendar, ArrowRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface InboxViewProps {
  pages: Page[];
  onNavigate: (pageId: string) => void;
}

interface InboxItem {
  id: string;
  title: string;
  timestamp: number;
  pageId: string;
  pageTitle: string;
  type: 'reminder' | 'event';
  isOverdue: boolean;
  isToday: boolean;
}

export const InboxView: React.FC<InboxViewProps> = ({ pages, onNavigate }) => {
  const items = useMemo(() => {
    const allItems: InboxItem[] = [];
    const now = new Date();
    const todayStr = now.toDateString();

    pages.forEach(page => {
        if (page.deletedAt) return;

        page.blocks.forEach(block => {
            // 1. AI Reminders
            if (block.metadata?.reminder) {
                const ts = block.metadata.reminder.timestamp;
                const date = new Date(ts);
                allItems.push({
                    id: `rem-${block.id}`,
                    title: block.metadata.reminder.title,
                    timestamp: ts,
                    pageId: page.id,
                    pageTitle: page.title || "Untitled",
                    type: 'reminder',
                    isOverdue: ts < now.getTime(),
                    isToday: date.toDateString() === todayStr
                });
            }

            // 2. Calendar Blocks
            if (block.type === 'calendar') {
                try {
                    const events = JSON.parse(block.content);
                    if (Array.isArray(events)) {
                        events.forEach((ev: any) => {
                            // Date string YYYY-MM-DD
                            const dateParts = ev.date.split('-');
                            if (dateParts.length === 3) {
                                // Default to 9 AM for calendar events without specific time
                                const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 9, 0);
                                const ts = dateObj.getTime();
                                allItems.push({
                                    id: `cal-${ev.id}`,
                                    title: ev.title || "Untitled Event",
                                    timestamp: ts,
                                    pageId: page.id,
                                    pageTitle: page.title || "Untitled",
                                    type: 'event',
                                    isOverdue: ts < now.getTime() && dateObj.toDateString() !== todayStr, // Only overdue if strictly yesterday or before
                                    isToday: dateObj.toDateString() === todayStr
                                });
                            }
                        });
                    }
                } catch (e) {}
            }
        });
    });

    return allItems.sort((a, b) => a.timestamp - b.timestamp);
  }, [pages]);

  const overdueItems = items.filter(i => i.isOverdue);
  const todayItems = items.filter(i => i.isToday && !i.isOverdue);
  const upcomingItems = items.filter(i => !i.isToday && !i.isOverdue);

  const Section = ({ title, data, icon: Icon, colorClass }: any) => (
      <div className="mb-8 animate-modal-entry">
          <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3 ${colorClass}`}>
              <Icon size={14} /> {title} <span className="opacity-50 ml-1">({data.length})</span>
          </div>
          <div className="flex flex-col gap-2">
              {data.length === 0 ? (
                  <div className="text-sm text-surgical-dim italic pl-6 opacity-60">Nothing here</div>
              ) : (
                  data.map((item: InboxItem) => (
                      <div 
                        key={item.id}
                        onClick={() => onNavigate(item.pageId)}
                        className="group flex items-center bg-white border border-alabaster-vein rounded-lg p-3 hover:shadow-sm hover:border-surgical-accent/30 cursor-pointer transition-all"
                      >
                          <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 mr-4 ${item.type === 'reminder' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                              {item.type === 'reminder' ? <Bell size={18} /> : <Calendar size={18} />}
                          </div>
                          
                          <div className="flex-grow flex flex-col justify-center">
                              <span className={`text-sm font-medium ${item.isOverdue ? 'text-red-600' : 'text-surgical-steel'}`}>
                                  {item.title}
                              </span>
                              <span className="text-xs text-surgical-dim flex items-center gap-1">
                                  {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                                  <span className="w-1 h-1 bg-surgical-dim/30 rounded-full mx-1" />
                                  in {item.pageTitle}
                              </span>
                          </div>

                          <div className="opacity-0 group-hover:opacity-100 text-surgical-accent transition-opacity">
                              <ArrowRight size={16} />
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>
  );

  return (
    <div className="flex-grow flex flex-col h-full overflow-y-auto custom-scrollbar bg-alabaster-pure px-12 sm:px-24 pt-12 pb-24">
        <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-surgical-steel text-white rounded-xl flex items-center justify-center shadow-lg">
                <Bell size={24} />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-surgical-steel">Inbox</h1>
                <p className="text-surgical-dim text-sm">All your reminders and scheduled events.</p>
            </div>
        </div>

        <div className="max-w-[800px]">
            {overdueItems.length > 0 && (
                <Section title="Overdue" data={overdueItems} icon={AlertCircle} colorClass="text-red-600" />
            )}
            
            <Section title="Today" data={todayItems} icon={CheckCircle2} colorClass="text-green-600" />
            
            <Section title="Upcoming" data={upcomingItems} icon={Clock} colorClass="text-surgical-steel" />
        </div>
    </div>
  );
};