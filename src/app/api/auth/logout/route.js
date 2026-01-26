import { NextResponse } from 'next/server';

export async function POST(request) {
    // Redirect to login after logout
    const response = NextResponse.redirect(new URL('/login', request.url));

    // Clear the cookie
    response.cookies.delete('token');

    return response;
}
