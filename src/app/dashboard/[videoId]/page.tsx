'use client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import {supabaseClient} from '@/utils/supabase';
import {useAuth} from '@clerk/nextjs';
import axios from 'axios';
import {ChevronLeft} from 'lucide-react';
import Link from 'next/link';
import {useEffect, useState} from 'react';
import {useChat} from 'ai/react';
import {Card, CardContent} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {ScrollArea} from '@/components/ui/scroll-area';

export default function VideoPage({params}: {params: {videoId: string}}) {
  const [transcription, setTranscription] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  async function chat() {
    setMessages([...messages, {role: 'user', content: input}]);
    if (!input) return;
    if (messages.length < 1) return;
    try {
      const response = await axios.post(
        '/api/chat',
        {
          messages: messages,
          transcript: transcription,
        },
        {
          responseType: 'stream', // Indicate that we expect a stream
        }
      );
      console.log(response);
      setMessages([...messages, {role: 'assistant', content: response.data}]);
    } catch (error) {
      console.log(error);
    }
  }

  const {getToken} = useAuth();

  async function summarizeVideo(videoId: string) {
    const token = await getToken({template: 'supabase'});
    setIsSummaryLoading(true);
    try {
      const {data} = await axios.post('/api/summarize', {
        videoId: videoId,
        token: token,
      });

      setSummary(data.summary);
      setIsSummaryLoading(false);
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
      <header className='h-[25vh] pt-4 space-y-4'>
        <Button>
          <Link href='/dashboard' className='flex items-center'>
            <ChevronLeft className='w-6 h-6' />
            Back
          </Link>
        </Button>
        <iframe
          className='w-full h-full rounded-xl'
          src={`https://www.youtube.com/embed/${params.videoId}?controls=0`}
          title='YouTube video player'
          allow='accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
        ></iframe>
      </header>
      {transcription ? (
        <section className='space-y-2'>
          {summary ? (
            <div className='space-y-12'>
              <p>{summary}</p>
              <div>
                {messages.length > 0 && (
                  <ScrollArea className='h-[50vh] w-full rounded-md border p-4'>
                    {messages.map((m) => (
                      <Card key={m.id} className='my-2'>
                        <CardContent className='p-6'>
                          <h3 className='text-foreground font-bold text-sm'>
                            {m.role}
                          </h3>
                          <p className='text-lg'>{m.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </ScrollArea>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    chat();
                  }}
                >
                  <Label>
                    Say something...
                    <div className='flex items-center space-x-2'>
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                      />
                      <Button
                        onClick={() => {
                          chat();
                        }}
                      >
                        Chat
                      </Button>
                    </div>
                  </Label>
                </form>
              </div>
            </div>
          ) : (
            <p className='py-4 text-primary/75'>
              You can now summarize the whole video with it&apos;s transcript.
            </p>
          )}
          <Button
            disabled={isSummaryLoading}
            className='w-full'
            onClick={async () => {
              await summarizeVideo(params.videoId);
            }}
          >
            {isSummaryLoading ? (
              <div className='flex items-center gap-4'>
                <div className='loader ease-linear rounded-full border-2 border-t-2 border-gray-200 h-6 w-6'></div>
                <span className='text-gray-400'>Summarizing...</span>
              </div>
            ) : (
              'Summarize'
            )}
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
        <Alert className='my-4 flex items-center gap-4'>
          <div className='loader ease-linear rounded-full border-2 border-t-2 border-slate-800 h-12 w-12'></div>
          <div className=''>
            <AlertTitle>
              Letting the AI take a listen to the video...
            </AlertTitle>
            <AlertDescription>
              This may take a few minutes, get some coffee ☕️
            </AlertDescription>
          </div>
        </Alert>
      )}
    </main>
  );
}
