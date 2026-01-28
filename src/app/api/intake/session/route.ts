import { NextRequest, NextResponse } from 'next/server';
import { initializeState } from '@/intake/state';
import { verifyToken } from '@/lib/jwt';
import { randomUUID } from 'crypto';

// In a real app we would use a DB. For this session-duration persistence, 
// we rely on the client holding the state or a temporary cache.
// BUT, the architecture says "Load Session + Intake State".
// Since we don't have a DB yet, we will initialize state from JWT on client load,
// and then client will pass full state (or diff) back and forth?
// NO - that's insecure and heavy. 
// REAL ITY: We need a place to store state. Google Sheets is "Write Only" mostly (or slow to read).
// For V1 MVP: We will store the encrypted state in a HTTP-only cookie OR
// we will just trust the client to pass the state JSON back and forth (signed).

// Let's go with Client-Side State passing for MVP (Signed/Verified if possible, but trust for now).
// This avoids needing Redis/Postgres right now.

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Bootstrap State
    const sessionId = randomUUID();
    const state = initializeState(sessionId, {
        name: payload.name,
        email: payload.email,
        role: payload.role,
        goal: payload.goal
    });

    return NextResponse.json({
        session_id: sessionId,
        state
    });
}
