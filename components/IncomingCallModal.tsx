'use client';

import React from 'react';
import { PhoneIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useCall } from '@/context/CallContext';

export default function IncomingCallModal() {
    const { incomingCall, acceptCall, declineCall } = useCall();

    if (!incomingCall) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border-4 border-[#FF7A59] max-w-sm w-full p-8 text-center animate-in zoom-in duration-300">
                <div className="relative mb-6">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center animate-pulse">
                        {incomingCall.type === 'video' ? (
                            <VideoCameraIcon className="w-12 h-12 text-[#FF7A59]" />
                        ) : (
                            <PhoneIcon className="w-12 h-12 text-[#FF7A59]" />
                        )}
                    </div>
                    <div className="absolute -top-2 -right-2 bg-[#FF7A59] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest italic">
                        Incoming
                    </div>
                </div>

                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1 uppercase italic tracking-tighter">
                    {incomingCall.type === 'video' ? 'Video Call' : 'Voice Call'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">
                    Patient is calling you...
                </p>

                <div className="flex items-center justify-center gap-6">
                    <button
                        onClick={declineCall}
                        className="group flex flex-col items-center gap-2"
                    >
                        <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-all hover:scale-110 active:scale-95">
                            <XMarkIcon className="w-8 h-8" />
                        </div>
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            Decline
                        </span>
                    </button>

                    <button
                        onClick={acceptCall}
                        className="group flex flex-col items-center gap-2"
                    >
                        <div className="w-20 h-20 rounded-full bg-[#FF7A59] flex items-center justify-center text-white shadow-lg hover:bg-[#ff8a6f] transition-all hover:scale-110 active:scale-95 ring-4 ring-[#FF7A59]/20">
                            <PhoneIcon className="w-10 h-10" />
                        </div>
                        <span className="text-[10px] font-black text-[#FF7A59] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            Accept
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
