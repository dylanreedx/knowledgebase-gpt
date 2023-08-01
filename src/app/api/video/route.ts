import cp from 'child_process';
import fs from 'fs';
import ytdl from 'ytdl-core';

export async function POST(req: Request) {
  const {video} = await req.json();
  await new Promise<void>((resolve, reject) => {
    ytdl.getInfo(video).then((info) => {
      const format = ytdl.chooseFormat(info.formats, {quality: 'highestaudio'});
      const start = Date.now();

      const ffmpegProcess = cp.spawn(
        'ffmpeg',
        ['-i', 'pipe:3', '-f', 'mp3', 'pipe:4'],
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

      ffmpegProcess.on('close', () => {
        console.log(`\ndone, thanks - ${(Date.now() - start) / 1000}s`);
        resolve();
      });

      ffmpegProcess.on('error', reject);

      ytdl
        .downloadFromInfo(info, {format: format})
        .pipe(ffmpegProcess.stdio[3] as any);

      ffmpegProcess.stdio[4]?.pipe(fs.createWriteStream('audio.mp3'));
    });
  });
}
