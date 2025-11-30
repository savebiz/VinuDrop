import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase credentials");
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    try {
        const body = await request.json();
        const { walletAddress, score, playerName } = body;

        if (!walletAddress || score === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Insert score into Supabase
        const { data, error } = await supabase
            .from('scores')
            .insert([
                {
                    wallet_address: walletAddress,
                    score: score,
                    player_name: playerName || 'Unknown',
                    created_at: new Date().toISOString()
                }
            ])
            .select();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });

    } catch (e) {
        console.error('Server error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
