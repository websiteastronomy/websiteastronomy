import { NextResponse } from 'next/server';
import { fetchCollectionAction } from '@/app/actions';

export async function GET() {
  try {
    const data = await fetchCollectionAction('projects');
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}
