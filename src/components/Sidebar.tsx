import { Plus, List, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { Category } from '../types';

interface SidebarProps {
    categories: Category[];
    selectedCategory: number | null;
    setSelectedCategory: (id: number | null) => void;
    onAddCategory: () => void;
    isLocked: boolean;
}

export function Sidebar({ categories, selectedCategory, setSelectedCategory, onAddCategory, isLocked }: SidebarProps) {
    const [isHovered, setIsHovered] = useState(false);

    const isExpanded = isLocked || isHovered;

    return (
        <aside
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                "glass border-r border-white/10 flex flex-col p-4 transition-all duration-300 ease-in-out h-full overflow-hidden shrink-0",
                isExpanded ? "w-64" : "w-20"
            )}
        >
            {/* Sidebar Top: Logo Only (Hamburger moved to Header) */}
            <div className={cn(
                "w-full inline-flex items-center mb-10 h-10",
                !isExpanded ? "" : "gap-3"
            )}>
                <div className="px-3 py-3 bg-primary rounded-xl shadow-lg shadow-primary/20 shrink-0">
                    <CalendarDays size={20} />
                </div>
                <h1 className={cn(
                    "text-xl font-bold tracking-tight whitespace-nowrap transition-all duration-300",
                    isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
                )}>
                    Vento
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                        "w-full inline-flex items-center py-3 rounded-xl transition-all duration-200 group",
                        selectedCategory === null ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5",
                        !isExpanded ? "justify-center px-0" : "px-4 gap-3"
                    )}
                    title={!isExpanded ? "Todos los eventos" : ""}
                >
                    <div className="shrink-0">
                        <List size={20} />
                    </div>
                    <span className={cn(
                        "font-medium transition-all duration-300 whitespace-nowrap overflow-hidden",
                        isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
                    )}>
                        Todos los eventos
                    </span>
                </button>

                <div className={cn(
                    "pt-6 pb-2 px-4 uppercase text-[10px] font-bold tracking-widest text-white/30 transition-opacity duration-300",
                    isExpanded ? "opacity-100" : "opacity-0"
                )}>
                    {isExpanded ? "Categorías" : ""}
                </div>

                {!isExpanded && <div className="h-px bg-white/5 my-2 mx-2" />}

                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                            "w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group",
                            selectedCategory === cat.id ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"
                        )}
                        title={!isExpanded ? cat.name : ""}
                    >
                        <div className="shrink-0 flex items-center justify-center w-[20px]">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        </div>
                        <span className={cn(
                            "ml-3 font-medium flex-1 text-left transition-all duration-300 whitespace-nowrap overflow-hidden",
                            isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
                        )}>
                            {cat.name}
                        </span>
                    </button>
                ))}

                <button
                    onClick={onAddCategory}
                    className={cn(
                        "w-full inline-flex items-center py-3 rounded-xl text-primary hover:bg-primary/10 transition-all border border-dashed border-primary/30 mt-4",
                        !isExpanded ? "justify-center px-0" : "px-4 gap-3"
                    )}
                    title={!isExpanded ? "Nueva categoría" : ""}
                >
                    <div className="shrink-0">
                        <Plus size={20} />
                    </div>
                    <span className={cn(
                        "font-medium transition-all duration-300 whitespace-nowrap overflow-hidden",
                        isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
                    )}>
                        Nueva categoría
                    </span>
                </button>
            </div>
        </aside>
    );
}
