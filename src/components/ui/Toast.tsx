import React, { useEffect, useState } from 'react';
import { Fingerprint, X } from 'lucide-react';

interface ToastProps {
    message: string;
    onAction?: () => void;
    actionLabel?: string;
    onClose: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, onAction, actionLabel, onClose, duration = 5000 }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 bg-slate-900/90 backdrop-blur-md border border-sky-500/30 p-4 rounded-2xl shadow-2xl transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
        >
            <div className="p-2 bg-sky-500/20 rounded-full text-sky-400">
                <Fingerprint size={24} />
            </div>
            <div>
                <p className="text-white font-medium text-sm">{message}</p>
            </div>
            {onAction && (
                <button
                    onClick={onAction}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-lg transition-colors"
                >
                    {actionLabel}
                </button>
            )}
            <button onClick={() => setIsVisible(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
            </button>
        </div>
    );
};
