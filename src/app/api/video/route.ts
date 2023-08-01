import cp from 'child_process';
import fs from 'fs';
import ytdl from 'ytdl-core';
import path from 'path';
import {supabaseClient} from '@/utils/supabase';

export async function POST(req: Request) {
  const {video, token} = await req.json();

  async function uploadFile(filePath: string) {
    const supabase = await supabaseClient(token);
    const file = fs.readFileSync(filePath);
    let {data, error} = await supabase.storage
      .from('chunks')
      .upload(filePath, file);
    if (error) throw error;
    return data;
  }

  ytdl.getInfo(video).then((info) => {
    const format = ytdl.chooseFormat(info.formats, {quality: 'highestaudio'});
    console.log('info', info);
    const start = Date.now();

    const outputDir = `chunks/${info.videoDetails.videoId}`;
    fs.mkdirSync(outputDir, {recursive: true}); // create the directory if it doesn't exist

    const ffmpegProcess = cp.spawn(
      'ffmpeg',
      [
        '-i',
        'pipe:3',
        '-map',
        '0:a', // map only audio stream
        '-f',
        'segment',
        '-segment_time',
        '15', // split every 30 seconds
        '-c:a',
        'libmp3lame', // use libmp3lame codec for audio
        `${outputDir}/output%03d.mp3`, // output pattern
      ],
      {
        windowsHide: true,
        stdio: [
          /* Standard: stdin, stdout, stderr */
          'inherit',
          'inherit',
          'inherit',
          /* Custom: pipe:3, pipe:4 */
          'pipe',
          'pipe',
        ],
      }
    );

    ffmpegProcess.on('close', async () => {
      console.log(`\ndone, thanks - ${(Date.now() - start) / 1000}s`);

      // Upload files to Supabase after ffmpeg process is done
      for (let i = 0; i < 1000; i++) {
        // assuming a maximum of 1000 files
        const filePath = `${outputDir}/output${i
          .toString()
          .padStart(3, '0')}.mp3`;
        console.log(filePath);
        if (fs.existsSync(filePath)) {
          await uploadFile(filePath);
          fs.unlinkSync(filePath); // delete the local file after it's uploaded
        } else {
          break; // stop the loop if file doesn't exist
        }
      }
    });

    ytdl
      .downloadFromInfo(info, {format: format})
      .pipe(ffmpegProcess.stdio[3] as any);
  });

  return {
    status: 200,
    body: {message: 'ok'},
  };
}
