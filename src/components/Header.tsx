import { Plus, Menu } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HeaderProps {
    onAddEvent: () => void;
    isSidebarLocked: boolean;
    setIsSidebarLocked: (locked: boolean) => void;
}

export function Header({ onAddEvent, isSidebarLocked, setIsSidebarLocked }: HeaderProps) {
    return (
        <header className="h-20 flex items-center justify-between pl-3 pr-6 lg:pr-10 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setIsSidebarLocked(!isSidebarLocked)}
                    className="p-2 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all duration-200 active:scale-95"
                    title={isSidebarLocked ? "Desbloquear menú lateral" : "Bloquear menú lateral"}
                >
                    <Menu size={24} />
                </button>
                <h2 className="text-2xl font-bold capitalize">
                    {format(new Date(), "MMMM yyyy", { locale: es })}
                </h2>
            </div>
            <button
                onClick={onAddEvent}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full font-semibold shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
            >
                <Plus size={20} />
                <span className="hidden sm:inline">Nuevo Evento</span>
            </button>
        </header>
    );
}
