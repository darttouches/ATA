import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from './db';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

export async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) return null;

    try {
        const decoded = jwt.verify(token.value, JWT_SECRET);

        // Single device check: Verify sessionId
        await dbConnect();
        const user = await User.findById(decoded.userId).select('sessionId status');

        if (!user ||
            (decoded.sessionId && user.sessionId !== decoded.sessionId) ||
            (user.role !== 'admin' && user.status !== 'approved')) {
            return null;
        }

        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return null;
    }
}
