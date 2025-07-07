import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api';
import { FindymailSearchResponse, FindymailErrorResponse } from '@/types/findymail';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, domain } = body;

    if (!name || !domain) {
      return NextResponse.json<FindymailErrorResponse>(
        { success: false, error: 'Name and domain are required' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json<FindymailErrorResponse>(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    // Forward the request to the backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/integrations/${params.id}/findymail/find-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({ name, domain }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json<FindymailErrorResponse>(
        { success: false, error: data.error || 'Failed to find email' },
        { status: response.status }
      );
    }

    return NextResponse.json<FindymailSearchResponse>(data);
  } catch (error: any) {
    console.error('Error in findymail find-email route:', error);
    return NextResponse.json<FindymailErrorResponse>(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 