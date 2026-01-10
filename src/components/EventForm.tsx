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

    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <label className="text-sm font-medium text-white/50">Título</label>
                <input
                    autoFocus
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Nombre del evento"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-white/50">Descripción</label>
                <textarea
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors h-24 resize-none"
                    placeholder="Notas adicionales..."
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white/50">Fecha</label>
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white/50">Categoría</label>
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
            <div className="flex justify-between gap-3 pt-6">

                <button onClick={onClose} className="w-full px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-semibold">
                    Cancelar
                </button>
                <button
                    onClick={() => onSave({ category_id: Number(catId), title, description: desc, event_date: date })}
                    className="w-full px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 font-bold transition-colors shadow-lg shadow-primary/20"
                >
                    {initialData ? "Guardar Cambios" : "Crear Evento"}
                </button>
            </div>
        </div>
    );
}
