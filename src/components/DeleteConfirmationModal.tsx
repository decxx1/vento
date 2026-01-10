import { Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
    onCancel: () => void;
    onConfirm: () => void;
}

export function DeleteConfirmationModal({ onCancel, onConfirm }: DeleteConfirmationModalProps) {
    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={onCancel} />
            <div className="relative w-full max-w-sm bg-surface border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trash2 size={32} />
                </div>
                <h4 className="text-xl font-bold mb-2">¿Estás seguro?</h4>
                <p className="text-white/50 text-sm mb-8">Esta acción no se puede deshacer. El evento se eliminará para siempre.</p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-semibold"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow-lg shadow-red-500/20"
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}
