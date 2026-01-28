import { SignJWT, jwtVerify } from 'jose';
import { ChatQuizPayload } from '@/types';

const secret = new TextEncoder().encode(
    '8fc3db9eca4d2c7cad8e2066985548c2ea8537a9b816f07f02bea261c0f8cd4e'
);


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
