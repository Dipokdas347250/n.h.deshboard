import { create } from "zustand";

/** The signed-in merchant's own account (status, trial, payments), loaded by `MerchantLayout`. */
const useMerchantStore = create((set) => ({
  merchant: null,
  setMerchant: (merchant) => set({ merchant }),
  clearMerchant: () => set({ merchant: null }),
}));

export { useMerchantStore };
