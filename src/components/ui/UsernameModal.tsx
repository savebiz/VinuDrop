import React, { useState } from 'react';
import { X, User } from 'lucide-react';

interface UsernameModalProps {
    isOpen: boolean;
    currentName: string;
    onSave: (name: string) => void;
    onClose: () => void;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({ isOpen, currentName, onSave, onClose }) => {
    const [name, setName] = useState(currentName || '');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        if (name.length < 3) {
            setError('Name must be at least 3 characters');
            return;
        }
        if (name.length > 15) {
            setError('Name must be less than 15 characters');
            return;
        }
        onSave(name);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-sky-500/20 rounded-xl">
                        <User className="text-sky-400" size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Set Username</h2>
                        <p className="text-slate-400 text-sm">This name will appear on the leaderboard.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError('');
                            }}
                            placeholder="Enter your name..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                        />
                        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(56,189,248,0.3)]"
                        >
                            Save Name
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
