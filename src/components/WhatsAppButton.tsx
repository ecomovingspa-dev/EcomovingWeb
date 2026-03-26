'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
    phone: string;
    message?: string;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ phone, message = "Hola Ecomoving, me gustaría solicitar una asesoría para merchandising corporativo." }) => {
    const whatsappUrl = `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`;

    return (
        <motion.a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{ scale: 1.1, boxShadow: '0 0 25px rgba(0, 229, 160, 0.4)' }}
            whileTap={{ scale: 0.9 }}
            style={{
                position: 'fixed',
                bottom: '30px',
                right: '30px',
                zIndex: 1000,
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#000',
                border: '1px solid #00E5A0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00E5A0',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                cursor: 'pointer',
                textDecoration: 'none',
            }}
            title="WhatsApp Ecomoving"
        >
            <MessageCircle size={32} />
            <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    width: '15px',
                    height: '15px',
                    backgroundColor: '#00E5A0',
                    borderRadius: '50%',
                    border: '2px solid #000',
                }}
            />
        </motion.a>
    );
};

export default WhatsAppButton;
