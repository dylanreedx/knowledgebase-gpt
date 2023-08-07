'use client';
import {useEffect, useState} from 'react';
import {SignOutButton, useAuth, useUser} from '@clerk/nextjs';
import axios from 'axios';
import getQueryClient from '@/utils/get-query-client';
import Hydrate from '@/components/hydrate-client';
import {useMutation, useQuery} from '@tanstack/react-query';
import {Skeleton} from '@/components/ui/skeleton';
import {Button} from '@/components/ui/button';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardFooter} from '@/components/ui/card';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';

async function getAudioFromVideo(
  videoUrl: string,
  token: string,
  userId: string,
  userEmail: string
) {
  try {
    const {data} = await axios.post('/api/video', {
      video: videoUrl,
      token: token,
      userId: userId,
      userEmail: userEmail,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
}

async function getUserVideos(token: string, userId: string) {
  try {
    const {data} = await axios.post('/api/getUsersVideos', {
      token: token,
      userId: userId,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
}

export default function Dashboard() {
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoCount, setVideoCount] = useState(0);

  const [url, setUrl] = useState('');
  const {user} = useUser();
  const router = useRouter();
  const {getToken} = useAuth();

  const queryClient = getQueryClient();

  const startASRAndNavigate = async (
    videoId: string,
    hasTranscript: boolean
  ) => {
    const token = await getToken({template: 'supabase'});
    if (!token) {
      console.error('No token found');
      return;
    }
    if (!user) {
      return;
    }

    console.log(hasTranscript);

    // Start the ASR process only if the video hasn't been transcribed yet
    if (!hasTranscript) {
      axios.post('/api/getASR', {
        videoId: videoId,
        token: token as string,
        userId: user.id,
      });
    }

    // Navigate to the video page
    router.push(`/dashboard/${videoId}`);
  };

  const uploadAudio = async (videoUrl: string) => {
    setIsLoadingVideo(true); // Set loading to true when video upload starts
    const token = await getToken({template: 'supabase'});
    if (!token) {
      console.error('No token found');
      return;
    }
    if (!user) {
      return;
    }

    await getAudioFromVideo(
      videoUrl,
      token,
      user.id,
      user.emailAddresses[0].emailAddress
    );
  };

  const mutation = useMutation(uploadAudio, {
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries(['videos']);
    },
  });

  const {
    data: videos,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      const token = await getToken({template: 'supabase'});
      if (!user) {
        return;
      }
      return getUserVideos(token as string, user.id);
    },
  });

  if (error) {
    console.log('Error: ', error);
  }

  useEffect(() => {
    if (user) {
      const videoUrl = window.sessionStorage.getItem('videoUrl');
      console.log(videoUrl);
      if (videoUrl) {
        uploadAudio(videoUrl);

        // Remove the video URL from the user's session or from a cookie
        window.sessionStorage.removeItem('videoUrl');
      }
    }
  }, [user]);

  useEffect(() => {
    setVideoCount(videos?.length || 0);
    if (videos?.length > videoCount) {
      setIsLoadingVideo(false);
      setVideoCount(videos.length);
    }
  }, [videos]);

  return (
    <Hydrate>
      <main className='max-w-3xl mx-auto'>
        <header className='py-6'>
          <div className='flex items-center justify-between pb-4'>
            <h1>Dashboard</h1>
            <SignOutButton />
          </div>
          <div className='flex items-center space-x-2'>
            <Input
              placeholder='https://www.youtube.com/watch?v=TGGwCG6AFz4'
              onChange={(e) => setUrl(e.target.value)}
              value={url}
            />
            <Button
              className='whitespace-nowrap'
              disabled={url.length < 5}
              onClick={() => {
                mutation.mutate(url);
                setUrl('');
              }}
            >
              Upload video
            </Button>
          </div>
        </header>

        {/* banner to signal that a video is being processed */}
        {isLoadingVideo && (
          <Alert className='my-4 flex items-center gap-4'>
            <div className='loader ease-linear rounded-full border-2 border-t-2 border-slate-800 h-12 w-12'></div>
            <div className=''>
              <AlertTitle>Chopping up the video now!</AlertTitle>
              <AlertDescription>
                This may take a few minutes, get some coffee ☕️
              </AlertDescription>
            </div>
          </Alert>
        )}

        <section>
          {isLoading ? (
            <Alert className='my-4 flex items-center gap-4'>
              <div className='loader ease-linear rounded-full border-2 border-t-2 border-slate-800 h-12 w-12'></div>
              <div className=''>
                <AlertTitle>Let&apos;s get your videos.</AlertTitle>
                <AlertDescription>Just a sec.</AlertDescription>
              </div>
            </Alert>
          ) : videos?.length > 0 ? (
            <p>no vidoes</p>
          ) : (
            <ul className='grid grid-cols-3 gap-2'>
              {videos?.videos.map(
                (video: {videoId: string; has_transcript: boolean}) => (
                  <li
                    onClick={() => {
                      startASRAndNavigate(video.videoId, video.has_transcript);
                    }}
                    key={video.videoId}
                    className='space-y-2 hover:cursor-pointer hover:scale-105 duration-200'
                  >
                    <Card>
                      <CardContent className='m-auto p-6'>
                        <iframe
                          className='w-full pointer-events-none h-full rounded-lg'
                          src={`https://www.youtube.com/embed/${video.videoId}?controls=0`}
                          title='YouTube video player'
                          allow='accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                        ></iframe>
                      </CardContent>
                    </Card>
                  </li>
                )
              )}
            </ul>
          )}
        </section>
      </main>
    </Hydrate>
  );
}
