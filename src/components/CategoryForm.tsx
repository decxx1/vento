import { useState } from 'react';
import { cn } from '../lib/utils';

interface CategoryFormProps {
    onClose: () => void;
    onSave: (name: string, color: string) => void;
}

export function CategoryForm({ onClose, onSave }: CategoryFormProps) {
    const [name, setName] = useState("");
    const [color, setColor] = useState("#6366f1");

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium text-white/50">Nombre de la Categoría</label>
                <input
                    autoFocus
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Ej: Trabajo, Personal..."
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-white/50">Elige un Color</label>
                <div className="flex gap-3">
                    {["#6366f1", "#a855f7", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#ff7b7b"].map(c => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={cn(
                                "w-8 h-8 rounded-full border-2 transition-all",
                                color === c ? "border-white scale-110" : "border-transparent"
                            )}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
            </div>
            <div className="flex gap-3 pt-4">
                <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors">Cancelar</button>
                <button onClick={() => onSave(name, color)} className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 font-bold transition-colors shadow-lg shadow-primary/20">Crear</button>
            </div>
        </div>
    );
}
