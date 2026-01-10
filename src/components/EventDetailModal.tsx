import { X, Calendar, Bell, Edit2, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Category, Event } from '../types';

interface EventDetailModalProps {
    event: Event;
    categories: Category[];
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export function EventDetailModal({ event, categories, onClose, onEdit, onDelete }: EventDetailModalProps) {
    const category = categories.find(c => c.id === event.category_id);

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-surface border border-white/10 rounded-3xl p-10 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-8 text-white/20 hover:text-white"
                >
                    <X size={24} />
                </button>

                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-8 rounded-full" style={{ backgroundColor: category?.color }} />
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-1">
                                {category?.name}
                            </p>
                            <h3 className="text-3xl font-bold">{event.title}</h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 py-6 border-y border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-lg text-primary">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-white/30 font-bold">Fecha</p>
                                <p className="font-semibold capitalize">{format(parseISO(event.event_date), "eeee d 'de' MMMM, yyyy", { locale: es })}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-lg text-accent">
                                <Bell size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-white/30 font-bold">Estado</p>
                                <p className="font-semibold">{event.event_date < new Date().toISOString().split('T')[0] ? "Vencido" : "Próximo"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] uppercase text-white/30 font-bold">Descripción</p>
                        <p className="text-white/70 leading-relaxed text-lg whitespace-pre-wrap">
                            {event.description || "Sin descripción adicional."}
                        </p>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <button
                            onClick={onEdit}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
                        >
                            <Edit2 size={18} />
                            Editar
                        </button>
                        <button
                            onClick={onDelete}
                            className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
                        >
                            <Trash2 size={18} />
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
