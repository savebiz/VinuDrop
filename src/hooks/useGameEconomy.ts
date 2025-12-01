import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@supabase/supabase-js';
import { getWalletBalance } from "thirdweb/wallets";
import { client, vinuChain as chain } from '@/lib/thirdweb';

// Initialize Supabase client (client-side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

interface EconomyState {
    freeShakes: number;
    freeBlasts: number;
    extraShakes: number; // Purchased shakes
    extraBlasts: number; // Purchased blasts
    lastDailyClaim: number | null; // Timestamp
    username?: string;
    balance?: string; // VC Balance

    // Actions
    useShake: () => boolean; // Uses free first, then extra
    addExtraShakes: (amount: number) => void;
    useBlast: () => boolean; // Uses free first, then extra
    addExtraBlasts: (amount: number) => void;
    useFreeBlast: () => boolean; // Deprecated, kept for compatibility if needed, but useBlast is preferred
    checkDailyRewards: () => void;
    syncWithDb: (walletAddress: string) => Promise<void>;
    setUsername: (name: string) => void;
}

export const useGameEconomy = create<EconomyState>()(
    persist(
        (set, get) => ({
            freeShakes: 1,
            freeBlasts: 1,
            extraShakes: 0,
            extraBlasts: 0,
            lastDailyClaim: null,
            balance: '0',

            useShake: () => {
                const { freeShakes, extraShakes } = get();
                if (freeShakes > 0) {
                    set({ freeShakes: freeShakes - 1 });
                    return true;
                } else if (extraShakes > 0) {
                    set({ extraShakes: extraShakes - 1 });
                    return true;
                }
                return false;
            },

            addExtraShakes: (amount) => {
                set((state) => ({ extraShakes: state.extraShakes + amount }));
            },

            useBlast: () => {
                const { freeBlasts, extraBlasts } = get();
                if (freeBlasts > 0) {
                    set({ freeBlasts: freeBlasts - 1 });
                    return true;
                } else if (extraBlasts > 0) {
                    set({ extraBlasts: extraBlasts - 1 });
                    return true;
                }
                return false;
            },

            addExtraBlasts: (amount) => {
                set((state) => ({ extraBlasts: state.extraBlasts + amount }));
            },

            useFreeBlast: () => {
                const { freeBlasts } = get();
                if (freeBlasts > 0) {
                    set({ freeBlasts: freeBlasts - 1 });
                    return true;
                }
                return false;
            },

            checkDailyRewards: () => {
                const { lastDailyClaim } = get();
                const now = Date.now();
                const oneDay = 24 * 60 * 60 * 1000;

                if (!lastDailyClaim || (now - lastDailyClaim > oneDay)) {
                    // Reset rewards
                    set({
                        freeShakes: 1,
                        freeBlasts: 1,
                        lastDailyClaim: now
                    });
                }
            },

            syncWithDb: async (walletAddress: string) => {
                // Fetch Balance
                try {
                    const balanceData = await getWalletBalance({
                        address: walletAddress,
                        client,
                        chain,
                    });
                    set({ balance: balanceData.displayValue });
                } catch (e) {
                    console.error("Failed to fetch balance:", e);
                }

                if (!supabase) return;

                // 1. Fetch user data
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('wallet_address', walletAddress)
                    .single();

                if (error && error.code !== 'PGRST116') { // Ignore not found error
                    console.error("Error fetching user economy:", error);
                    return;
                }

                const now = Date.now();
                const oneDay = 24 * 60 * 60 * 1000;

                if (data) {
                    const lastClaim = new Date(data.last_daily_claim).getTime();

                    // Sync username if exists in DB (optional, if we want cross-device sync)
                    // For now, we prioritize local, or we could sync. Let's sync if local is empty.
                    const { username } = get();
                    if (!username && data.username) {
                        set({ username: data.username });
                    }

                    if (now - lastClaim > oneDay) {
                        // It's been more than 24h since last DB claim. Reset everything.
                        set({
                            freeShakes: 1,
                            freeBlasts: 1,
                            lastDailyClaim: now
                        });
                        // Update DB with new claim time and reset counts
                        await supabase.from('users').upsert({
                            wallet_address: walletAddress,
                            last_daily_claim: new Date().toISOString(),
                            free_shakes: 1,
                            free_blasts: 1,
                            username: username || data.username // Persist username
                        });
                    } else {
                        // Less than 24h. Sync local with DB values (which track remaining freebies).
                        set({
                            freeShakes: data.free_shakes,
                            freeBlasts: data.free_blasts,
                            lastDailyClaim: lastClaim
                        });
                    }
                } else {
                    // New user, insert default
                    const { username } = get();
                    await supabase.from('users').insert({
                        wallet_address: walletAddress,
                        last_daily_claim: new Date().toISOString(),
                        free_shakes: 1,
                        free_blasts: 1,
                        username: username || null
                    });
                    set({
                        freeShakes: 1,
                        freeBlasts: 1,
                        lastDailyClaim: Date.now()
                    });
                }
            },
            setUsername: (name: string) => set({ username: name }),
        }),
        {
            name: 'vinudrop-economy',
        }
    )
);
