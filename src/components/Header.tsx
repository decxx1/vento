import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HeaderProps {
    onAddEvent: () => void;
}

export function Header({ onAddEvent }: HeaderProps) {
    return (
        <header className="h-20 flex items-center justify-between px-10 border-b border-white/5">
            <h2 className="text-2xl font-bold capitalize">
                {format(new Date(), "MMMM yyyy", { locale: es })}
            </h2>
            <button
                onClick={onAddEvent}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full font-semibold shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
            >
                <Plus size={20} />
                Nuevo Evento
            </button>
        </header>
    );
}
