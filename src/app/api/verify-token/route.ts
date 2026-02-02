import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
    try {
        const { token } = await req.json();
        
        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        const payload = await verifyToken(token);
        
        if (!payload) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        return NextResponse.json({ valid: true, payload });
    } catch (error) {
        console.error('Token verification error:', error);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
