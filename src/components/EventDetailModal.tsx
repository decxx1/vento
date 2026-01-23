import { X, Calendar, Bell, Edit2, Trash2, CheckCircle2, FastForward, History, AlertCircle, RotateCcw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Category, Event, EventStatus } from '../types';
import { cn } from '../lib/utils';

interface EventDetailModalProps {
    event: Event;
    categories: Category[];
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onUpdateStatus: (id: number, status: EventStatus) => void;
    onPostpone: (id: number, type: 'month' | 'year') => void;
}

export function EventDetailModal({ event, categories, onClose, onEdit, onDelete, onUpdateStatus, onPostpone }: EventDetailModalProps) {
    const category = categories.find(c => c.id === event.category_id);
    const isDeactivated = event.status === 'deactivated';
    const isPending = event.status === 'pending';
    const isCompleted = event.status === 'completed';

    const getStatusLabel = () => {
        switch (event.status) {
            case 'pending': return 'En curso';
            case 'completed': return 'Finalizado';
            case 'deactivated': return 'Desactivado';
            default: return 'Próximo';
        }
    };

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-surface border border-white/10 rounded-3xl p-10 shadow-2xl overflow-hidden">
                {/* Decorative Background Icon */}
                <div className="absolute -right-10 -bottom-10 text-white/5 pointer-events-none">
                    {isCompleted ? <CheckCircle2 size={240} /> : <Calendar size={240} />}
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-6 right-8 text-white/20 hover:text-white transition-colors z-10"
                >
                    <X size={24} />
                </button>

                <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-10 rounded-full" style={{ backgroundColor: category?.color }} />
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black mb-1">
                                {category?.name} {isDeactivated && "• DESACTIVADO"}
                            </p>
                            <h3 className={cn(
                                "text-3xl font-bold leading-tight",
                                isDeactivated && "text-white/40"
                            )}>{event.title}</h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 py-6 border-y border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/5 rounded-xl text-primary">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-white/30 font-bold">Fecha</p>
                                <p className="font-semibold capitalize">{format(parseISO(event.event_date), "d 'de' MMMM, yyyy", { locale: es })}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "p-2.5 rounded-xl",
                                isPending ? "bg-urgent/10 text-urgent" : "bg-white/5 text-accent"
                            )}>
                                <Bell size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-white/30 font-bold">Estado</p>
                                <p className={cn("font-semibold", isPending && "text-urgent")}>{getStatusLabel()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] uppercase text-white/30 font-bold">Descripción</p>
                        <p className="text-white/70 leading-relaxed text-lg whitespace-pre-wrap max-h-40 overflow-y-auto no-scrollbar">
                            {event.description || "Sin descripción adicional."}
                        </p>
                    </div>

                    {/* Quick Actions for Pending */}
                    {isPending && (
                        <div className="bg-urgent/5 border border-urgent/20 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center gap-2 text-urgent">
                                <AlertCircle size={18} />
                                <span className="text-sm font-bold uppercase tracking-wider">Intervención Requerida</span>
                            </div>
                            <p className="text-sm text-white/60">Este evento ya pasó de fecha. ¿Qué quieres hacer?</p>
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => onPostpone(event.id, 'month')}
                                        className="flex-1 bg-urgent/10 hover:bg-urgent/20 text-urgent text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <FastForward size={14} />
                                        Próximo Mes
                                    </button>
                                    <button
                                        onClick={() => onPostpone(event.id, 'year')}
                                        className="flex-1 bg-urgent/10 hover:bg-urgent/20 text-urgent text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <History size={14} />
                                        Próximo Año
                                    </button>
                                </div>
                                <button
                                    onClick={() => onUpdateStatus(event.id, 'completed' as EventStatus)}
                                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={14} />
                                    Finalizar Evento
                                </button>
                                <button
                                    onClick={() => onUpdateStatus(event.id, 'normal' as EventStatus)}
                                    className="w-full bg-white/5 hover:bg-white/10 text-white/40 text-[10px] font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 border border-white/5"
                                >
                                    <RotateCcw size={12} />
                                    Regresar a Próximos
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Main Footer Actions */}
                    <div className="space-y-4 pt-4">
                        <div className="flex gap-3">
                            {!isCompleted && !isPending && (
                                <>
                                    <button
                                        onClick={() => onUpdateStatus(event.id, 'pending' as EventStatus)}
                                        className="flex-1 bg-urgent/10 hover:bg-urgent/20 text-urgent font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
                                    >
                                        <AlertCircle size={18} />
                                        En curso
                                    </button>
                                    <button
                                        onClick={() => onUpdateStatus(event.id, 'completed' as EventStatus)}
                                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
                                    >
                                        <CheckCircle2 size={18} />
                                        Finalizar
                                    </button>
                                </>
                            )}
                            {isCompleted && (
                                <button
                                    onClick={() => onUpdateStatus(event.id, 'normal' as EventStatus)}
                                    className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
                                >
                                    <RotateCcw size={18} />
                                    Reactivar
                                </button>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onEdit}
                                className="flex-1 border border-white/5 hover:bg-white/5 text-white/60 hover:text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                            >
                                <Edit2 size={16} />
                                Editar
                            </button>
                            <button
                                onClick={onDelete}
                                className="flex-[0.5] bg-red-500/5 hover:bg-red-500/10 text-red-500 hover:text-red-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
