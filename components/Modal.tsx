
import React, { useEffect } from 'react';
import { Icons } from './Icons';

interface ModalProps {
    children: React.ReactNode;
    onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({ children, onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);

        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="glass-panel rounded-[2.5rem] shadow-2xl w-full max-w-lg relative max-h-[90vh] flex flex-col border border-white/40 transform animate-scaleIn"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-slate-400 rounded-full hover:bg-white/40 dark:hover:bg-slate-700/40 hover:text-slate-900 dark:hover:text-white transition-all z-10"
                    aria-label="Close modal"
                >
                    <Icons.Close className="w-6 h-6" />
                </button>
                <div className="flex-1 overflow-y-auto p-10 pr-12">
                    {children}
                </div>
            </div>
        </div>
    );
};
