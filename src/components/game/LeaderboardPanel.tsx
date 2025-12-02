import React, { useState, useEffect } from 'react';
import { Trophy, Maximize2, Gem } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

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
      setLoading(true);
      try {
        const response = await fetch(`/api/leaderboard?timeWindow=${activeTab}&limit=10`);
        const result = await response.json();

        if (result.data) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();

    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);

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
          <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg shadow-amber-500/30">
            <Trophy className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-wide drop-shadow-md">LEADERBOARD</h2>
            <div className="text-xs text-cyan-300 font-mono tracking-widest">TOP PILOTS</div>
          </div>
        </div>

        <button
          onClick={toggleLeaderboardModal}
          className="p-2 hover:bg-white/10 rounded-full transition-colors group"
          title="Expand View"
        >
          <Maximize2 className="w-5 h-5 text-cyan-400 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Prize Pot Display */}
      <div className="mb-6 relative p-4 rounded-2xl bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-[40px] rounded-full pointer-events-none group-hover:bg-purple-500/30 transition-all"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-400/30">
              <Gem className="text-purple-300 w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-purple-300 uppercase tracking-widest font-bold">Prize Pot</div>
              <div className="text-xl font-black text-white drop-shadow-[0_0_10px_rgba(192,38,211,0.5)]">{currentPot}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-black/40 rounded-xl mb-4 relative z-10 border border-white/5">
        {(['daily', 'weekly', 'monthly', 'yearly'] as TimeWindow[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${activeTab === tab
              ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar flex-grow relative z-10">
        {loading ? (
          <div className="flex items-center justify-center h-full text-cyan-400 animate-pulse font-mono text-sm tracking-widest">
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
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/50 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className={`
                    w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm font-mono
                    ${entry.rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black shadow-[0_0_10px_rgba(255,215,0,0.5)]' :
                    entry.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-black shadow-[0_0_10px_rgba(203,213,225,0.5)]' :
                      entry.rank === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-600 text-black shadow-[0_0_10px_rgba(180,83,9,0.5)]' :
                        'bg-white/5 text-slate-400'}
                `}>
                  {entry.rank}
                </div>
                <div>
                  <div className="font-bold text-slate-200 text-sm group-hover:text-cyan-300 transition-colors">
                    {entry.name}
                  </div>
                </div>
              </div>
              <div className="font-mono font-bold text-cyan-400 text-sm drop-shadow-[0_0_5px_rgba(0,240,255,0.3)]">
                {entry.score.toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
