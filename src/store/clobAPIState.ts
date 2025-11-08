// store/clobAPIState.ts
import { ClobClient } from '@polymarket/clob-client';
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

interface ClobAPIState {
  clobClient: ClobClient | null;
  isApiReady: boolean;
  initializedAddress: string | null;
  apiCredentials: {
    key: string;
    secret: string;
    passphrase: string;
  } | null;
  setClobClient: (client: ClobClient | null) => void;
  setApiReady: (ready: boolean) => void;
  setInitializedAddress: (address: string | null) => void;
  setApiCredentials: (creds: { key: string; secret: string; passphrase: string } | null) => void;
  reset: () => void;
}

const useClobAPIStore = create<ClobAPIState>()(
  devtools(
    persist(
      (set) => ({
        clobClient: null,
        isApiReady: false,
        initializedAddress: null,
        apiCredentials: null,
        
        setClobClient: (client: ClobClient | null) => 
          set({ clobClient: client }),
        
        setApiReady: (ready: boolean) => 
          set({ isApiReady: ready }),
        
        setInitializedAddress: (address: string | null) => 
          set({ initializedAddress: address }),
        
        setApiCredentials: (creds: { key: string; secret: string; passphrase: string } | null) =>
          set({ apiCredentials: creds }),
        
        reset: () => 
          set({
            clobClient: null,
            isApiReady: false,
            initializedAddress: null,
            apiCredentials: null
          }),
      }),
      {
        name: 'clob-api-storage',
        storage: createJSONStorage(() => sessionStorage),
        // Only persist these fields (not the clobClient object itself)
        partialize: (state) => ({
          isApiReady: state.isApiReady,
          initializedAddress: state.initializedAddress,
          apiCredentials: state.apiCredentials,
        }),
      }
    ),
    {
      name: 'clob-api-store',
    }
  )
);

export default useClobAPIStore;