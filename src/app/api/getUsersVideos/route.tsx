import {supabaseClient} from '@/utils/supabase';
import {NextResponse} from 'next/server';

export async function POST(req: Request) {
  const {token, userId} = await req.json();
  const supabase = await supabaseClient(token);

  const {data, error} = await supabase
    .from('videos')
    .select('videoId, has_transcript, has_summary')
    .eq('userId', userId);

  if (error) {
    console.log('Error: ', error);
    return NextResponse.json({
      message: 'An error occurred while fetching videos.',
    });
  }

  return NextResponse.json({videos: data});
}
