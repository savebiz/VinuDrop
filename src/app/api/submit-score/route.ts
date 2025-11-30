import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
// Note: In a real app, use process.env.SUPABASE_URL and process.env.SUPABASE_SERVICE_ROLE_KEY
// For this prototype, we'll assume these are set or will be set by the user.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only initialize if keys are present to prevent build errors
const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export async function POST(request: Request) {
    if (!supabase) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    try {
        const body = await request.json();
        const { score, walletAddress, gameSignature, duration } = body;

        if (!score || !walletAddress) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validation: Ensure score is mathematically possible
        // Simple heuristic: Max score per second is roughly limited by physics
        // e.g., max 1000 points per second (very generous)
        const maxPossibleScore = (duration || 600) * 1000;
        if (score > maxPossibleScore && duration > 0) {
            return NextResponse.json({ error: 'Score validation failed' }, { status: 400 });
        }

        // Insert into Supabase
        const { data, error } = await supabase
            .from('scores')
            .insert([
                {
                    wallet_address: walletAddress,
                    score: score,
                    metadata: { duration, signature: gameSignature }
                }
            ])
            .select();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (e) {
        console.error('API error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
