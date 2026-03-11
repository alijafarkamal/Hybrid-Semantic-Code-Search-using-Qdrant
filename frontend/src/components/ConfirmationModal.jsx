import React from 'react';
import Icons from './Icons';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isDestructive, mode = "confirm" }) => {
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (isOpen && e.key === 'Enter') {
                e.preventDefault();
                onConfirm();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onConfirm, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div
                className="bg-[#111827] border border-slate-700 shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-5 ${isDestructive ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {isDestructive ? <Icons.AlertTriangle /> : <Icons.Database />}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
                </div>
                <div className="px-6 py-4 bg-[#0f172a] border-t border-slate-800/50 flex items-center justify-end gap-3">
                    {mode === "confirm" && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-5 py-2 text-sm font-semibold rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111827] ${isDestructive
                            ? 'bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500'
                            : 'bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-500'
                            }`}
                    >
                        {mode === "alert" ? "OK" : (isDestructive ? "Yes, Delete" : "Confirm")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
