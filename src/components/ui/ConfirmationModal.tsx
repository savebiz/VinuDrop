import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDestructive = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="glass-panel p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-700/50">
                <div className="flex items-start gap-4 mb-6">
                    <div className={`p-3 rounded-full ${isDestructive ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                        <p className="text-slate-400 leading-relaxed">{message}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2.5 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-5 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all
                            ${isDestructive
                                ? 'bg-red-500 hover:bg-red-400 hover:shadow-red-500/25'
                                : 'bg-sky-500 hover:bg-sky-400 hover:shadow-sky-500/25'
                            }
                        `}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
