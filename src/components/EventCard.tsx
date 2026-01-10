import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertCircle, CheckCircle2, EyeOff } from 'lucide-react';
import { cn, getProximityColor } from '../lib/utils';
import { Event } from '../types';

interface EventCardProps {
    event: Event;
    onClick: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
    const isDeactivated = event.status === 'deactivated';
    const isPending = event.status === 'pending';
    const isCompleted = event.status === 'completed';

    return (
        <div
            onClick={onClick}
            className={cn(
                "glass-card group px-6 py-4 rounded-2xl flex flex-col justify-between text-left hover:border-primary/30 cursor-pointer relative transition-all duration-300",
                isDeactivated && "opacity-40 grayscale hover:grayscale-0 hover:opacity-100",
                isPending && "border-urgent/20",
                isCompleted && "border-green-500/20"
            )}
        >
            <div className="flex justify-between items-start w-full gap-4">
                <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-2">
                        {isPending && <AlertCircle size={14} className="text-urgent" />}
                        {isCompleted && <CheckCircle2 size={14} className="text-green-400" />}
                        {isDeactivated && <EyeOff size={14} className="text-white/40" />}
                        <h5 className={cn(
                            "text-base font-bold transition-colors line-clamp-1",
                            isDeactivated ? "text-white/40" : "group-hover:text-primary",
                            isPending && "text-urgent"
                        )}>
                            {event.title}
                        </h5>
                    </div>
                    {isDeactivated && <span className="text-[10px] text-white/20 uppercase font-black">Desactivado</span>}
                </div>

                <span className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-bold uppercase border whitespace-nowrap self-start",
                    isDeactivated ? "bg-white/5 border-white/10 text-white/20" : getProximityColor(event.event_date)
                )}>
                    {format(parseISO(event.event_date), "d MMM", { locale: es })}
                </span>
            </div>
        </div>
    );
}
