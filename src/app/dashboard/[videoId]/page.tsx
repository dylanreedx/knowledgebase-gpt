'use client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {Button} from '@/components/ui/button';
import {supabaseClient} from '@/utils/supabase';
import {useAuth} from '@clerk/nextjs';
import axios from 'axios';
import {useEffect, useState} from 'react';

export default function VideoPage({params}: {params: {videoId: string}}) {
  const [transcription, setTranscription] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const {getToken} = useAuth();

  async function summarizeVideo(videoId: string) {
    const token = await getToken({template: 'supabase'});
    try {
      const {data} = await axios.post('/api/summarize', {
        videoId: videoId,
        token: token,
      });
      return data;
    } catch (error) {
      console.log(error);
    }
  }

  const getTranscriptionFile = async (videoId: string) => {
    const token = await getToken({template: 'supabase'});
    if (!token) {
      console.error('No token found');
      return null;
    }
    const supabase = await supabaseClient(token);
    const {data, error} = await supabase.storage
      .from('transcriptions')
      .download(`${videoId}/transcription.txt`);

    if (error) {
      console.error('Error downloading transcription file:', error);
      return null;
    }

    return data.text();
  };

  useEffect(() => {
    const intervalId = setInterval(async () => {
      const text = await getTranscriptionFile(params.videoId);
      setTranscription(text);
      if (text) {
        clearInterval(intervalId);
      }
    }, 5000); // check every 5 seconds

    return () => clearInterval(intervalId); // clean up on unmount
  }, [params.videoId]);

  return (
    <main className='max-w-3xl mx-auto space-y-20'>
      <header className='h-[25vh]'>
        <h2>{params.videoId}</h2>
        <iframe
          className='w-full h-full'
          src={`https://www.youtube.com/embed/${params.videoId}?controls=0`}
          title='YouTube video player'
          allow='accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
        ></iframe>
      </header>
      {transcription ? (
        <section>
          {summary && <p>{summary}</p>}
          <Button
            className='w-full'
            onClick={async () => {
              const summary = await summarizeVideo(params.videoId);
              console.log(summary);
              setSummary(summary.summary);
            }}
          >
            Summarize
          </Button>
          <Accordion type='single' collapsible className='w-full'>
            <AccordionItem value='item-1'>
              <AccordionTrigger>Full Transcription</AccordionTrigger>
              <AccordionContent>
                <p>{transcription}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      ) : (
        'Waiting for transcription...'
      )}
    </main>
  );
}
