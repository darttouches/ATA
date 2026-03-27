import dbConnect from '@/lib/db';
import GameScore from '@/models/GameScore';
import User from '@/models/User';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET(request) {
    try {
        await dbConnect();
        
        // Finalized aggregation with robust normalization
        const topScores = await GameScore.aggregate([
            { $match: { gameId: 'wasaaa3' } },
            // Normalize userId to ObjectId before grouping
            { $addFields: { normalizedUserId: { $toObjectId: "$userId" } } },
            { $sort: { score: -1, energy: -1 } },
            { 
                $group: {
                    _id: "$normalizedUserId",
                    bestScore: { $first: "$score" },
                    bestEnergy: { $first: "$energy" },
                    createdAt: { $first: "$createdAt" }
                }
            },
            { $sort: { bestScore: -1, bestEnergy: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            { $unwind: "$userInfo" },
            {
                $project: {
                    _id: 1,
                    score: "$bestScore",
                    energy: "$bestEnergy",
                    user: {
                        _id: "$userInfo._id",
                        firstName: "$userInfo.firstName",
                        lastName: "$userInfo.lastName",
                        name: "$userInfo.name",
                        profileImage: "$userInfo.profileImage"
                    }
                }
            }
        ]);
            
        return NextResponse.json(topScores);
    } catch (error) {
        console.error('Error fetching wasaaa3 scores:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const userPayload = await getUser();
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const { score, energy, distance, metadata } = await request.json();
        await dbConnect();
        
        // Consistent ObjectId casting for future runs
        const userId = new mongoose.Types.ObjectId(userPayload.userId);
        
        const newScore = new GameScore({
            userId: userId,
            gameId: 'wasaaa3',
            score: score || 0,
            energy: energy || 0,
            distance: distance || 0,
            metadata: metadata || {}
        });
        
        await newScore.save();
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving wasaaa3 score:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
