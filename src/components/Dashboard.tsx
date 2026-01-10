import { Bell, Calendar, CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Category, Event } from '../types';

interface DashboardProps {
    nextEvent: Event | undefined;
    currentMonthEvents: Event[];
    categories: Category[];
    setViewingEvent: (event: Event) => void;
}

export function Dashboard({ nextEvent, currentMonthEvents, categories, setViewingEvent }: DashboardProps) {
    return (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Next Up Card */}
            <div
                className="relative overflow-hidden rounded-3xl p-8 glass-card border-white/10 min-h-[220px] flex flex-col justify-between cursor-pointer group"
                onClick={() => nextEvent && setViewingEvent(nextEvent)}
            >
                <div className="absolute top-0 right-0 p-8 text-primary/10 -mr-4 -mt-4 transition-transform group-hover:scale-110">
                    <Bell size={100} strokeWidth={1} />
                </div>
                {nextEvent ? (
                    <div className="relative z-10">
                        <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest">Siguiente</span>
                        <h3 className="text-4xl font-bold mt-4 mb-2 group-hover:text-primary transition-colors">{nextEvent.title}</h3>
                        <div className="flex items-center gap-2 text-white/40 mt-4">
                            <Calendar size={18} />
                            <span className="capitalize">{format(parseISO(nextEvent.event_date), "eeee d 'de' MMMM", { locale: es })}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/20">
                        <CalendarDays size={48} className="mb-2" />
                        <p>No hay eventos próximos</p>
                    </div>
                )}
            </div>

            {/* This Month List Card */}
            <div className="glass-card rounded-3xl p-6 border-white/10 flex flex-col">
                <h4 className="text-sm font-bold uppercase tracking-widest text-white/30 mb-4 px-2">Eventos de este mes</h4>
                <div className="flex-1 space-y-3 overflow-y-auto pr-2 max-h-[160px]">
                    {currentMonthEvents.length > 0 ? (
                        currentMonthEvents.map(e => (
                            <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group" onClick={() => setViewingEvent(e)}>
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: categories.find(c => c.id === e.category_id)?.color }} />
                                    <span className="font-medium text-sm truncate max-w-[150px] group-hover:text-primary">{e.title}</span>
                                </div>
                                <span className="text-[11px] text-white/40">{format(parseISO(e.event_date), "d MMM", { locale: es })}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-white/20 py-8 text-sm">Sin eventos este mes</p>
                    )}
                </div>
            </div>
        </section>
    );
}
