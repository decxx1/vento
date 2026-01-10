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

export function EventCard({ event, onClick }: EventCardProps) {
    return (
        <div
            onClick={onClick}
            className="glass-card group px-6 py-4 rounded-2xl flex flex-col justify-between text-left hover:border-primary/30 cursor-pointer relative"
        >
            <div className="flex justify-between items-start w-full">
                <h5 className="text-base font-bold group-hover:text-primary transition-colors flex-1 pr-12">{event.title}</h5>
                <span className={cn(
                    "px-3 py-1 rounded-full text-sm font-bold uppercase border whitespace-nowrap",
                    getProximityColor(event.event_date)
                )}>
                    {format(parseISO(event.event_date), "d MMM", { locale: es })}
                </span>
            </div>

        </div>
    );
}
