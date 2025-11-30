import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (client-side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

interface EconomyState {
    freeShakes: number;
    freeBlasts: number;
    extraShakes: number; // Purchased shakes
    lastDailyClaim: number | null; // Timestamp

    // Actions
    useShake: () => boolean; // Uses free first, then extra
    addExtraShakes: (amount: number) => void;
    useFreeBlast: () => boolean;
    checkDailyRewards: () => void;
    syncWithDb: (walletAddress: string) => Promise<void>;
}

export const useGameEconomy = create<EconomyState>()(
    persist(
        (set, get) => ({
            freeShakes: 1,
            freeBlasts: 1,
            extraShakes: 0,
            lastDailyClaim: null,

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
                            free_blasts: 1
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
                    await supabase.from('users').insert({
                        wallet_address: walletAddress,
                        last_daily_claim: new Date().toISOString(),
                        free_shakes: 1,
                        free_blasts: 1
                    });
                    set({
                        freeShakes: 1,
                        freeBlasts: 1,
                        lastDailyClaim: Date.now()
                    });
                }
            }
        }),
        {
            name: 'vinudrop-economy',
        }
    )
);
