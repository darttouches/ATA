import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import QuizQuestion from '@/models/QuizQuestion';

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const limitStr = searchParams.get('limit');
        
        if (limitStr) {
            // Get random questions
            const limit = parseInt(limitStr);
            const questions = await QuizQuestion.aggregate([
                { $match: { isActive: true } },
                { $sample: { size: limit } }
            ]);
            return NextResponse.json({ success: true, data: questions }, { status: 200 });
        }
        
        const questions = await QuizQuestion.find({ isActive: true });
        return NextResponse.json({ success: true, data: questions }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        
        if (Array.isArray(body)) {
             const questions = await QuizQuestion.insertMany(body);
             return NextResponse.json({ success: true, data: questions }, { status: 201 });
        }
        
        const question = await QuizQuestion.create(body);
        return NextResponse.json({ success: true, data: question }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
