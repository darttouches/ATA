import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

export async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) return null;

    try {
        const decoded = jwt.verify(token.value, JWT_SECRET);
        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return null;
    }
}
