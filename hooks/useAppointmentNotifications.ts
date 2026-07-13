'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export function useAppointmentNotifications() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await apiClient('/appointments/assignments/me');
        const sourceData = response?.resultData || response?.data || response || [];
        
        if (Array.isArray(sourceData)) {
          const newAppointments = sourceData.filter(
            (item: any) => item.status === 'PENDING'
          );
          setPendingCount(newAppointments.length);
        }
      } catch (err) {
        console.warn("Failed to sync appointment badge count", err);
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 15000);
    return () => clearInterval(interval);
  }, []);

  return pendingCount;
}