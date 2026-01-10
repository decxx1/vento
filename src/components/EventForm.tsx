import { useState } from 'react';
import { Category, Event } from '../types';

interface EventFormProps {
    categories: Category[];
    initialData: Event | null;
    onClose: () => void;
    onSave: (evt: any) => void;
}

export function EventForm({ categories, initialData, onClose, onSave }: EventFormProps) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [desc, setDesc] = useState(initialData?.description || "");
    const [date, setDate] = useState(initialData?.event_date || new Date().toISOString().split('T')[0]);
    const [catId, setCatId] = useState(initialData?.category_id || categories[0]?.id || "");
    const [isDeactivated, setIsDeactivated] = useState(initialData?.status === 'deactivated');

    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-widest text-white/30">Título</label>
                <input
                    autoFocus
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors font-medium"
                    placeholder="Nombre del evento"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-widest text-white/30">Descripción</label>
                <textarea
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors h-32 resize-none no-scrollbar"
                    placeholder="Notas adicionales..."
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-black uppercase tracking-widest text-white/30">Fecha</label>
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-black uppercase tracking-widest text-white/30">Categoría</label>
                    <select
                        value={catId}
                        onChange={e => setCatId(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    >
                        {categories.map((c) => (
                            <option key={c.id} value={c.id} className="bg-surface">{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 group cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setIsDeactivated(!isDeactivated)}>
                <div className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                    isDeactivated ? "bg-primary border-primary" : "border-white/20 group-hover:border-white/40"
                )}>
                    {isDeactivated && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold">Desactivar evento</span>
                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Ocultar de las listas principales</span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3.5 rounded-2xl border border-white/10 hover:bg-white/5 transition-colors font-bold text-white/60 hover:text-white"
                >
                    Cancelar
                </button>
                <button
                    onClick={() => onSave({
                        category_id: Number(catId),
                        title,
                        description: desc,
                        event_date: date,
                        status: isDeactivated ? 'deactivated' : (initialData?.status === 'deactivated' ? 'normal' : initialData?.status)
                    })}
                    className="flex-2 px-4 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 font-black transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                >
                    {initialData ? "Guardar Cambios" : "Crear Evento"}
                </button>
            </div>
        </div>
    );
}
import { cn } from '../lib/utils';
