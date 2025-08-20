/* eslint-disable @typescript-eslint/no-explicit-any */
// stores/walletStore.ts
import { create } from 'zustand';

type WalletStore = {
  activeAccount: string | null;
  setActiveAccount: (address: string | null) => void;

  walletConnected: boolean;
  setWalletConnected: (connected: boolean) => void;

  activeWallet: any;
  setActiveWallet: (wallet: any) => void;

  sessionData: any;
  setSessionData: (data: any) => void;
};

export const useWalletStore = create<WalletStore>((set) => ({
  activeAccount: null,
  setActiveAccount: (address) => set({ activeAccount: address }),

  walletConnected: false,
  setWalletConnected: (connected) => set({ walletConnected: connected }),

  activeWallet: null,
  setActiveWallet: (wallet) => set({ activeWallet: wallet }),

  sessionData: null,
  setSessionData: (data) => set({ sessionData: data }),
}));