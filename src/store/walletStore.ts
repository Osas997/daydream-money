import { create } from 'zustand';
import { Wallet, WalletType } from '../db/types';
import * as walletsRepo from '../db/repositories/walletsRepo';

interface WalletState {
  wallets: Wallet[];
  totalBalance: number;
  loading: boolean;
  refreshWallets: () => Promise<void>;
  createWallet: (params: {
    name: string;
    type: WalletType;
    colorKey: string;
    iconKey: string;
    initialBalance: number;
    includeInTotal?: boolean;
  }) => Promise<Wallet>;
  updateWallet: (
    id: string,
    params: Partial<{
      name: string;
      type: WalletType;
      colorKey: string;
      iconKey: string;
      includeInTotal: boolean;
      sortOrder: number;
    }>
  ) => Promise<void>;
  archiveWallet: (id: string) => Promise<void>;
  correctBalance: (id: string, targetBalance: number, reason?: string) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  totalBalance: 0,
  loading: false,

  refreshWallets: async () => {
    try {
      const wallets = await walletsRepo.getWallets(false);
      const totalBalance = wallets
        .filter((w) => w.includeInTotal && !w.isArchived)
        .reduce((sum, w) => sum + (w.currentBalance || 0), 0);

      set({ wallets, totalBalance });
    } catch (e) {
      console.error('Error refreshing wallets:', e);
    }
  },

  createWallet: async (params) => {
    const newWallet = await walletsRepo.createWallet(params);
    await get().refreshWallets();
    return newWallet;
  },

  updateWallet: async (id, params) => {
    await walletsRepo.updateWallet(id, params);
    await get().refreshWallets();
  },

  archiveWallet: async (id) => {
    await walletsRepo.archiveWallet(id);
    await get().refreshWallets();
  },

  correctBalance: async (id, targetBalance, reason) => {
    await walletsRepo.correctWalletBalance(id, targetBalance, reason);
    await get().refreshWallets();
  },
}));
