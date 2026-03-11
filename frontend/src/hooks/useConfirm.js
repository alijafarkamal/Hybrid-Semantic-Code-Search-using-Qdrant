import { useState } from 'react';

const useConfirm = () => {
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        isDestructive: false,
        mode: 'confirm',
        resolve: null
    });

    const requestConfirm = (title, message, isDestructive = false) => {
        return new Promise((resolve) => {
            setModalConfig({
                isOpen: true,
                title,
                message,
                isDestructive,
                mode: 'confirm',
                resolve
            });
        });
    };

    const requestAlert = (title, message, isDestructive = false) => {
        return new Promise((resolve) => {
            setModalConfig({
                isOpen: true,
                title,
                message,
                isDestructive,
                mode: 'alert',
                resolve
            });
        });
    };

    const handleClose = () => {
        if (modalConfig.resolve) modalConfig.resolve(false);
        setModalConfig({ ...modalConfig, isOpen: false });
    };

    const handleConfirm = () => {
        if (modalConfig.resolve) modalConfig.resolve(true);
        setModalConfig({ ...modalConfig, isOpen: false });
    };

    return {
        modalConfig,
        requestConfirm,
        requestAlert,
        handleClose,
        handleConfirm
    };
};

export default useConfirm;
