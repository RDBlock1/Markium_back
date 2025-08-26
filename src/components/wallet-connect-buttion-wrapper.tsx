// components/wallet-connect-button-wrapper.tsx
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import the WalletConnectButton with no SSR
// This ensures it only loads in the browser where Node.js modules can be polyfilled
export const WalletConnectButton = dynamic(
  () => import('./wallet-connect-button-client'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    ),
  }
);
