import {supabaseClient} from '@/utils/supabase';
import axios from 'axios';
import {LLMChain} from 'langchain/chains';
import {OpenAI} from 'langchain/llms/openai';
import {PromptTemplate} from 'langchain/prompts';
import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter';
import {NextResponse} from 'next/server';

const URL = 'http://localhost:3001';
// const URL = process.env.AUDIO_SERVICE_URL;

export async function POST(req: Request) {
  const {videoId, token} = await req.json();
  try {
    const response = await axios.post(`${URL}/api/summarize`, {
      videoId,
      token,
    });
    console.log('response.data', response.data);
    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json({error: 'Error contacting external server'});
  }
}
