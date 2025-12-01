import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Trophy, Medal, Award, Globe } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useGameStore } from '@/store/gameStore';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

type TimeWindow = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface LeaderboardEntry {
    rank: number;
    name: string;
    score: number;
    wallet: string;
}

export const FullLeaderboardModal: React.FC = () => {
    const { isLeaderboardModalOpen, toggleLeaderboardModal } = useGameStore();
    const [activeTab, setActiveTab] = useState<TimeWindow>('daily');
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [searchWallet, setSearchWallet] = useState('');
    const [playerRank, setPlayerRank] = useState<{ rank: number; score: number; diff: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    // Fetch Leaderboard Data
    useEffect(() => {
        if (!isLeaderboardModalOpen || !supabase) return;

        const fetchLeaderboard = async () => {
            setLoading(true);
            const now = new Date();
            let startTime = new Date();

            if (activeTab === 'daily') startTime.setHours(0, 0, 0, 0);
            else if (activeTab === 'weekly') startTime.setDate(now.getDate() - 7);
            else if (activeTab === 'monthly') startTime.setMonth(now.getMonth() - 1);
            else if (activeTab === 'yearly') startTime.setFullYear(now.getFullYear() - 1);

            const { data: scores, error } = await supabase
                .from('scores')
                .select('*')
                .gte('created_at', startTime.toISOString())
                .order('score', { ascending: false })
                .limit(30);

            if (scores) {
                const formatted = scores.map((s, i) => ({
                    rank: i + 1,
                    name: s.player_name || 'Unknown',
                    score: s.score,
                    wallet: s.wallet_address || ''
                }));
                setLeaderboardData(formatted);
            }
            setLoading(false);
        };

        fetchLeaderboard();
    }, [isLeaderboardModalOpen, activeTab]);

    // Rank Finder Logic
    const handleSearch = async () => {
        if (!searchWallet || !supabase) return;
        setSearching(true);
        setPlayerRank(null);

        try {
            const { data, error } = await supabase
                .rpc('get_player_rank', {
                    search_wallet: searchWallet,
                    time_period: activeTab
                });

            if (data && data.length > 0 && data[0].rank !== null) {
                setPlayerRank({
                    rank: data[0].rank,
                    score: data[0].score,
                    diff: data[0].top_score_diff
                });
            } else {
                // Handle not found
                setPlayerRank(null);
            }
        } catch (e) {
            console.error(e);
        }
        setSearching(false);
    };

    const MOCK_POTS: Record<TimeWindow, string> = {
        daily: "45,000 VC",
        weekly: "120,000 VC",
        monthly: "500,000 VC",
        yearly: "2,000,000 VC"
    };

    return (
        <AnimatePresence>
            {isLeaderboardModalOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) toggleLeaderboardModal();
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="w-full max-w-2xl h-[80vh] glass-panel-cosmic rounded-3xl flex flex-col overflow-hidden relative"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                                    <Globe className="w-6 h-6 text-neon-cyan" />
                                    Global Rankings
                                </h2>
                                <div className="text-sm text-gray-400 mt-1">
                                    Prize Pool: <span className="text-golden-yellow font-bold glow-text">{MOCK_POTS[activeTab]}</span>
                                </div>
                            </div>
                            <button
                                onClick={toggleLeaderboardModal}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-4 gap-2 bg-black/20">
                            {(['daily', 'weekly', 'monthly', 'yearly'] as TimeWindow[]).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-2 rounded-xl text-sm font-bold uppercase tracking-wide transition-all ${activeTab === tab
                                        ? 'bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {loading ? (
                                <div className="text-center py-20 text-gray-500 animate-pulse">Scanning blockchain...</div>
                            ) : (
                                leaderboardData.map((entry) => (
                                    <div
                                        key={entry.rank}
                                        className={`flex items-center p-4 rounded-xl border border-white/5 transition-all hover:bg-white/10 ${entry.rank <= 3 ? 'bg-white/10 border-white/20' : 'bg-white/5'
                                            }`}
                                    >
                                        <div className="w-12 flex justify-center">
                                            {entry.rank === 1 && <Trophy className="w-6 h-6 text-golden-yellow drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]" />}
                                            {entry.rank === 2 && <Medal className="w-6 h-6 text-gray-300 drop-shadow-[0_0_8px_rgba(192,192,192,0.6)]" />}
                                            {entry.rank === 3 && <Award className="w-6 h-6 text-orange-400 drop-shadow-[0_0_8px_rgba(205,127,50,0.6)]" />}
                                            {entry.rank > 3 && <span className="text-lg font-bold text-gray-500">#{entry.rank}</span>}
                                        </div>
                                        <div className="flex-1 px-4">
                                            <div className="font-bold text-white">{entry.name}</div>
                                            <div className="text-xs text-gray-500 font-mono">{entry.wallet.slice(0, 6)}...{entry.wallet.slice(-4)}</div>
                                        </div>
                                        <div className="text-xl font-mono font-bold text-neon-cyan">
                                            {entry.score.toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Rank Finder Footer */}
                        <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-xl relative z-20">
                            <div className="relative flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Enter Wallet Address to find rank..."
                                        value={searchWallet}
                                        onChange={(e) => setSearchWallet(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan transition-colors font-mono text-sm"
                                    />
                                </div>
                                <button
                                    onClick={handleSearch}
                                    disabled={searching || !searchWallet}
                                    className="bg-neon-cyan text-black font-bold px-6 rounded-xl hover:bg-cyan-400 disabled:opacity-50 transition-colors"
                                >
                                    {searching ? '...' : 'FIND'}
                                </button>
                            </div>

                            {/* Player Rank Card (Slide Up) */}
                            <AnimatePresence>
                                {playerRank && (
                                    <motion.div
                                        initial={{ y: 100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: 100, opacity: 0 }}
                                        className="absolute bottom-full left-0 right-0 m-4 p-4 glass-panel-cosmic rounded-2xl border-t-2 border-neon-cyan shadow-[0_0_30px_rgba(0,240,255,0.2)]"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Your Rank</div>
                                                <div className="text-3xl font-black text-white">#{playerRank.rank.toLocaleString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-mono text-neon-cyan">{playerRank.score.toLocaleString()}</div>
                                                {playerRank.diff > 0 && (
                                                    <div className="text-xs text-hot-pink">-{playerRank.diff.toLocaleString()} to #1</div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
