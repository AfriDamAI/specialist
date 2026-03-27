'use client';

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText?: string;
}

export default function ImageModal({ isOpen, onClose, imageUrl, altText }: ImageModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white active:scale-95"
      >
        <XMarkIcon className="w-6 h-6" />
      </button>

      <div 
        className="relative max-w-full max-h-full flex items-center justify-center p-4 bg-white/5 rounded-3xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={altText || 'Full size view'}
          className="max-w-[95vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl transition-transform"
        />
      </div>
    </div>
  );
}
