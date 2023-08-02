'use client';
import {useEffect, useState} from 'react';
import {useAuth, useUser} from '@clerk/nextjs';
import axios from 'axios';
import getQueryClient from '@/utils/get-query-client';
import Hydrate from '@/components/hydrate-client';
import {useQuery} from '@tanstack/react-query';
import {Skeleton} from '@/components/ui/skeleton';
import {Button} from '@/components/ui/button';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {Input} from '@/components/ui/input';

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
  const [url, setUrl] = useState('');
  const {user} = useUser();
  const router = useRouter();
  const {getToken} = useAuth();

  const startASRAndNavigate = async (videoId: string) => {
    const token = await getToken({template: 'supabase'});
    if (!user) {
      return;
    }

    // Start the ASR process
    axios.post('/api/getASR', {
      videoId: videoId,
      token: token as string,
      userId: user.id,
    });

    // Navigate to the video page
    router.push(`/dashboard/${videoId}`);
  };

  const queryClient = getQueryClient();

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
  console.log(videos);

  const uploadAudio = async (videoUrl: string) => {
    const token = await getToken({template: 'supabase'});
    if (!user) {
      return;
    }

    await getAudioFromVideo(
      videoUrl,
      token as string,
      user.id,
      user.emailAddresses[0].emailAddress
    );
  };

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
  return (
    <Hydrate>
      <main className='max-w-3xl mx-auto'>
        <header className='py-6'>
          <h1>Dashboard</h1>
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
                uploadAudio(url);
                setUrl('');
              }}
            >
              Upload video
            </Button>
          </div>
        </header>

        <section>
          {isLoading ? (
            <div className='flex items-center space-x-4'>
              <Skeleton className='h-12 w-12 rounded-full' />
              <div className='space-y-2'>
                <Skeleton className='h-4 w-[250px]' />
                <Skeleton className='h-4 w-[200px]' />
              </div>
            </div>
          ) : videos?.length > 0 ? (
            <p>no vidoes</p>
          ) : (
            <ul className='grid grid-cols-3 gap-2'>
              {videos?.videos.map((video: {videoId: string}) => (
                <li key={video.videoId} className='space-y-2'>
                  <iframe
                    className='w-full'
                    src={`https://www.youtube.com/embed/${video.videoId}?controls=0`}
                    title='YouTube video player'
                    allow='accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                  ></iframe>
                  <Button
                    className='w-full'
                    onClick={() => {
                      startASRAndNavigate(video.videoId);
                    }}
                  >
                    Learn Faster
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </Hydrate>
  );
}
