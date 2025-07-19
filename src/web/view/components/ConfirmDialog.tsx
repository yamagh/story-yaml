import React from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="confirm-dialog-overlay">
            <div className="confirm-dialog">
                <h3>{title}</h3>
                <div className="confirm-dialog-content">
                    {children}
                </div>
                <div className="confirm-dialog-actions">
                    <button onClick={onClose}>Cancel</button>
                    <button onClick={onConfirm} className="confirm-button">Confirm</button>
                </div>
            </div>
        </div>
    );
};