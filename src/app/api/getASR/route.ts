import {HfInference} from '@huggingface/inference';
import {createWriteStream} from 'fs';
import {supabaseClient} from '@/utils/supabase';
import {NextResponse} from 'next/server';
import axios from 'axios';

// const URL = 'http://localhost:3001';
const URL = process.env.AUDIO_SERVICE_URL;

export async function POST(req: Request) {
  const {videoId, token} = await req.json();

  try {
    const response = await axios.post(`${URL}/api/asr`, {
      videoId,
      token,
    });
    NextResponse.json(response.data);
  } catch (error) {
    NextResponse.json({error: 'Error contacting external server'});
  }
}
