import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Calendar, Globe, Maximize2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useGameStore } from '@/store/gameStore';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  timePlayed: string;
}

type TimeWindow = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const LeaderboardPanel: React.FC = () => {
  const { toggleLeaderboardModal } = useGameStore();
  const [activeTab, setActiveTab] = useState<TimeWindow>('daily');
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!supabase) return;
      setLoading(true);

      // Determine time range
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
        .limit(10);

      if (error) {
        console.error("Error fetching leaderboard:", error);
      } else if (scores) {
        const formattedData = scores.map((s, index) => {
          let displayName = s.player_name;
          if (!displayName || displayName === "Player" || displayName === "Unknown") {
            // Fallback to abbreviated wallet
            if (s.wallet_address) {
              displayName = `${s.wallet_address.slice(0, 4)}...${s.wallet_address.slice(-4)}`;
            } else {
              displayName = "Unknown";
            }
          }
          return {
            rank: index + 1,
            name: displayName,
            score: s.score,
            timePlayed: "-"
          };
        });
        setData(formattedData);
      }
      setLoading(false);
    };

    fetchLeaderboard();

    // Subscribe to changes for real-time updates
    if (supabase) {
      const channel = supabase
        .channel('public:scores')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scores' }, () => {
          fetchLeaderboard();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

  }, [activeTab]);

  const MOCK_POTS: Record<TimeWindow, string> = {
    daily: "45,000 VC",
    weekly: "120,000 VC",
    monthly: "500,000 VC",
    yearly: "2,000,000 VC"
  };

  const currentPot = MOCK_POTS[activeTab];

  return (
    <div className="glass-panel-cosmic p-6 rounded-3xl w-full h-full flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-golden-yellow/20 rounded-xl border border-amber-200 dark:border-golden-yellow/30 shadow-sm dark:shadow-[0_0_15px_rgba(255,215,0,0.3)]">
            <Trophy className="text-amber-600 dark:text-golden-yellow" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">LEADERBOARD</h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">TOP PILOTS</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] text-indigo-500 dark:text-neon-cyan uppercase tracking-widest font-bold mb-1">Prize Pot</div>
            <div className="text-slate-800 dark:text-white font-mono font-bold text-lg dark:drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">{currentPot}</div>
          </div>
          <button
            onClick={toggleLeaderboardModal}
            className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors group"
            title="Expand View"
          >
            <Maximize2 className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-black/40 rounded-xl mb-4 relative z-10 border border-slate-200 dark:border-white/5">
        {(['daily', 'weekly', 'monthly', 'yearly'] as TimeWindow[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${activeTab === tab
              ? 'bg-white dark:bg-neon-cyan text-indigo-600 dark:text-black shadow-sm dark:shadow-[0_0_15px_rgba(0,240,255,0.4)]'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar flex-grow relative z-10">
        {loading ? (
          <div className="flex items-center justify-center h-full text-indigo-500 dark:text-neon-cyan animate-pulse font-mono text-sm">
            SCANNING DATABASE...
          </div>
        ) : data.length === 0 ? (
          <div className="text-center text-slate-500 py-8 italic text-sm">
            No flight records found.
          </div>
        ) : (
          data.map((entry) => (
            <div
              key={entry.rank}
              className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-neon-cyan/50 hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className={`
                                    w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm font-mono
                                    ${entry.rank === 1 ? 'bg-amber-100 dark:bg-golden-yellow text-amber-700 dark:text-black shadow-sm dark:shadow-[0_0_10px_rgba(255,215,0,0.5)]' :
                    entry.rank === 2 ? 'bg-slate-200 dark:bg-slate-300 text-slate-700 dark:text-black shadow-sm dark:shadow-[0_0_10px_rgba(203,213,225,0.5)]' :
                      entry.rank === 3 ? 'bg-orange-100 dark:bg-amber-700 text-orange-800 dark:text-white shadow-sm dark:shadow-[0_0_10px_rgba(180,83,9,0.5)]' :
                        'bg-slate-100 dark:bg-white/5 text-slate-500'}
                                `}>
                  {entry.rank}
                </div>
                <div>
                  <div className="font-bold text-slate-700 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-neon-cyan transition-colors">
                    {entry.name}
                  </div>
                </div>
              </div>
              <div className="font-mono font-bold text-indigo-600 dark:text-neon-cyan text-sm dark:drop-shadow-[0_0_5px_rgba(0,240,255,0.3)]">
                {entry.score.toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
