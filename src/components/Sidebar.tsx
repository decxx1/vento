import { Plus, List, CalendarDays } from 'lucide-react';
import { cn } from '../lib/utils';
import { Category } from '../types';

interface SidebarProps {
    categories: Category[];
    selectedCategory: number | null;
    setSelectedCategory: (id: number | null) => void;
    onAddCategory: () => void;
}

export function Sidebar({ categories, selectedCategory, setSelectedCategory, onAddCategory }: SidebarProps) {
    return (
        <aside className="w-64 glass border-r border-white/10 flex flex-col p-6">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
                    <CalendarDays size={24} />
                </div>
                <h1 className="text-xl font-bold tracking-tight">Vento</h1>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                        selectedCategory === null ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"
                    )}
                >
                    <List size={18} />
                    <span className="font-medium">Todos los eventos</span>
                </button>

                <div className="pt-6 pb-2 px-4 uppercase text-[10px] font-bold tracking-widest text-white/30">Categorías</div>

                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                            selectedCategory === cat.id ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-medium flex-1 text-left">{cat.name}</span>
                    </button>
                ))}

                <button
                    onClick={onAddCategory}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-primary hover:bg-primary/10 transition-all border border-dashed border-primary/30 mt-4"
                >
                    <Plus size={18} />
                    <span className="font-medium">Nueva categoría</span>
                </button>
            </div>
        </aside>
    );
}
