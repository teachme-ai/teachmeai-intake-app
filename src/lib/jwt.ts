import { SignJWT, jwtVerify } from 'jose';
import { ChatQuizPayload } from '@/types';

const getSecret = () => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return new TextEncoder().encode(jwtSecret);
};


/**
 * Signs a payload to create a JWT token
 */
export async function signToken(payload: ChatQuizPayload): Promise<string> {
    return await new SignJWT(payload as any)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('48h')
        .sign(getSecret());
}

/**
 * Verifies a JWT token and returns the payload
 */
export async function verifyToken(token: string): Promise<ChatQuizPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getSecret());
        return payload as unknown as ChatQuizPayload;
    } catch (error) {
        console.error('JWT Verification failed:', error);
        return null;
    }
}

export async function verifyIntakeToken(token: string): Promise<ChatQuizPayload | null> {
    return verifyToken(token);
}
