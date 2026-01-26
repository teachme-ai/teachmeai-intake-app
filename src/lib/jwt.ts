import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback-secret-for-dev-only'
);

export interface ChatQuizPayload {
    name: string;
    email: string;
    goal: string;
    source: string;
    iat?: number;
    exp?: number;
}

/**
 * Signs a payload to create a JWT token
 */
export async function signToken(payload: ChatQuizPayload): Promise<string> {
    return await new SignJWT(payload as any)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('48h')
        .sign(secret);
}

/**
 * Verifies a JWT token and returns the payload
 */
export async function verifyToken(token: string): Promise<ChatQuizPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as unknown as ChatQuizPayload;
    } catch (error) {
        console.error('JWT Verification failed:', error);
        return null;
    }
}
