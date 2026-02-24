'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

export default function EntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return null;
}