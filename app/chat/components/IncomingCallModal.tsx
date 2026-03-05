'use client';

import { PhoneIcon, PhoneXMarkIcon, VideoCameraIcon } from '@heroicons/react/24/solid';
import { IncomingCallData } from '../hooks/useCall';

interface IncomingCallModalProps {
  callData: IncomingCallData | null;
  callerName: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallModal({
  callData,
  callerName,
  onAccept,
  onReject,
}: IncomingCallModalProps) {
  if (!callData) return null;

  const isVideoCall = callData.type === 'video';

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        {/* Caller Avatar */}
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#FF7A59] to-[#FF5722] flex items-center justify-center">
          <span className="text-white font-bold text-3xl">
            {callerName
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </span>
        </div>

        {/* Call Info */}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Incoming {isVideoCall ? 'Video' : 'Voice'} Call
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-8">{callerName} is calling...</p>

        {/* Call Type Icon */}
        <div className="flex justify-center mb-8">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isVideoCall
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            }`}
          >
            {isVideoCall ? (
              <VideoCameraIcon className="w-8 h-8" />
            ) : (
              <PhoneIcon className="w-8 h-8" />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6">
          {/* Reject Button */}
          <button
            onClick={onReject}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg">
              <PhoneXMarkIcon className="w-8 h-8" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Decline</span>
          </button>

          {/* Accept Button */}
          <button
            onClick={onAccept}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors shadow-lg">
              <PhoneIcon className="w-8 h-8" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}
