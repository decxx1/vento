import { Edit2, Trash2, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, getProximityColor } from '../lib/utils';
import { Event } from '../types';

interface EventCardProps {
    event: Event;
    onClick: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export function EventCard({ event, onClick, onEdit, onDelete }: EventCardProps) {
    return (
        <div
            onClick={onClick}
            className="glass-card group p-6 rounded-2xl flex flex-col justify-between text-left hover:border-primary/30 cursor-pointer relative"
        >
            <div className="flex justify-between items-start w-full mb-4">
                <h5 className="text-lg font-bold group-hover:text-primary transition-colors flex-1 pr-12">{event.title}</h5>
                <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap",
                    getProximityColor(event.event_date)
                )}>
                    {format(parseISO(event.event_date), "d MMM", { locale: es })}
                </span>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                        title="Editar"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
                <ArrowRight size={14} className="text-white/10 group-hover:text-white/40 transition-colors" />
            </div>
        </div>
    );
}
