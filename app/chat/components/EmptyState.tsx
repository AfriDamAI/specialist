'use client';

import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export default function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <ChatBubbleLeftRightIcon className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select a conversation</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
        Choose a patient from the list to start or continue a conversation
      </p>
    </div>
  );
}
