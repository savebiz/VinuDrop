import React, { useState } from 'react';
import { Trophy, Clock, Calendar, Globe } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  timePlayed: string;
}

type TimeWindow = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const LeaderboardPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TimeWindow>('daily');

  // Mock Data for UI demonstration
  // In a real implementation, fetch from Supabase based on activeTab
  const MOCK_DATA: Record<TimeWindow, LeaderboardEntry[]> = {
    daily: [
      { rank: 1, name: "DailyChamp", score: 1200, timePlayed: "05:20" },
      { rank: 2, name: "SpeedRunner", score: 1150, timePlayed: "04:10" },
    ],
    weekly: [
      { rank: 1, name: "WeekWarrior", score: 5400, timePlayed: "12:45" },
      { rank: 2, name: "Grinder", score: 4800, timePlayed: "15:30" },
    ],
    monthly: [
      { rank: 1, name: "MoonWalker", score: 25000, timePlayed: "45:00" },
    ],
    yearly: [
      { rank: 1, name: "CosmicKing", score: 150000, timePlayed: "120:00" },
    ]
  };

  const MOCK_POTS: Record<TimeWindow, string> = {
    daily: "45,000 VC",
    weekly: "120,000 VC",
    monthly: "500,000 VC",
    yearly: "2,000,000 VC"
  };

  const currentData = MOCK_DATA[activeTab];
  const currentPot = MOCK_POTS[activeTab];

  return (
    <div className="glass-panel p-6 rounded-2xl w-full h-full min-h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Trophy className="text-yellow-400" size={24} />
          </div>
          <h2 className="text-xl font-bold text-white">Leaderboard</h2>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Prize Pot</div>
          <div className="text-sky-400 font-mono font-bold">{currentPot}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-900/50 rounded-xl mb-4">
        {(['daily', 'weekly', 'monthly', 'yearly'] as TimeWindow[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === tab
                ? 'bg-sky-500 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar flex-grow">
        {currentData.length === 0 ? (
          <div className="text-center text-slate-500 py-8 italic">
            No scores yet for this period.
          </div>
        ) : (
          currentData.map((entry) => (
            <div
              key={entry.rank}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className={`
                    w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm
                    ${entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                    entry.rank === 2 ? 'bg-slate-300/20 text-slate-300' :
                      entry.rank === 3 ? 'bg-amber-700/20 text-amber-600' :
                        'bg-slate-800 text-slate-500'}
                `}>
                  {entry.rank}
                </div>
                <div>
                  <div className="font-bold text-slate-200 group-hover:text-sky-300 transition-colors">
                    {entry.name}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={10} />
                    {entry.timePlayed}
                  </div>
                </div>
              </div>
              <div className="font-mono font-bold text-sky-400">
                {entry.score.toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
