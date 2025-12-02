import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: Request) {
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const timeWindow = searchParams.get('timeWindow') || 'daily';
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determine time range
    const now = new Date();
    let startTime = new Date();

    if (timeWindow === 'daily') startTime.setHours(0, 0, 0, 0);
    else if (timeWindow === 'weekly') startTime.setDate(now.getDate() - 7);
    else if (timeWindow === 'monthly') startTime.setMonth(now.getMonth() - 1);
    else if (timeWindow === 'yearly') startTime.setFullYear(now.getFullYear() - 1);

    try {
        // 1. Fetch Top Scores
        const { data: scores, error: scoreError } = await supabase
            .from('scores')
            .select('*')
            .gte('created_at', startTime.toISOString())
            .order('score', { ascending: false })
            .limit(limit);

        if (scoreError) throw scoreError;

        if (!scores || scores.length === 0) {
            return NextResponse.json({ data: [] });
        }

        // 2. Fetch Usernames for these wallets
        const walletAddresses = scores.map(s => s.wallet_address).filter(Boolean);
        let userMap: Record<string, string> = {};

        if (walletAddresses.length > 0) {
            const { data: users, error: userError } = await supabase
                .from('users')
                .select('wallet_address, username')
                .in('wallet_address', walletAddresses);

            if (users) {
                users.forEach(u => {
                    if (u.username) userMap[u.wallet_address] = u.username;
                });
            }
        }

        // 3. Merge Data
        const leaderboardData = scores.map((s, index) => {
            let displayName = userMap[s.wallet_address] || s.player_name;

            if (!displayName || displayName === "Player" || displayName === "Unknown") {
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
                wallet: s.wallet_address,
                timePlayed: "-" // Placeholder
            };
        });

        return NextResponse.json({ data: leaderboardData });

    } catch (e: any) {
        console.error("Leaderboard API Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
