import ytdl from '@distube/ytdl-core';
import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import sanitize from 'sanitize-filename';
import ora from 'ora';

program
  .name('kingdom-dl')
  .description('Custom YouTube Downloader POC')
  .argument('<url>', 'YouTube Video URL')
  .option('-o, --output <dir>', 'Output directory', '.')
  .action(async (url, options) => {
    const spinner = ora('Fetching video info...').start();

    try {
      if (!ytdl.validateURL(url)) {
        spinner.fail('Invalid YouTube URL');
        return;
      }

      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title;
      const cleanTitle = sanitize(title);
      const outputDir = options.output;
      
      if (!fs.existsSync(outputDir)){
          fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = path.join(outputDir, `${cleanTitle}.mp4`);

      spinner.text = `Found: ${title}`;
      spinner.succeed();

      const downloadSpinner = ora('Downloading...').start();

      // Get format: highest quality with both video and audio
      // YouTube usually limits "combined" streams to 720p. 
      // Higher qualities require downloading video/audio separately and merging (complex for a simple Node POC without ffmpeg dependency).
      const format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioandvideo' });

      if (!format) {
        downloadSpinner.fail('No suitable format found!');
        return;
      }

      const videoStream = ytdl.downloadFromInfo(info, { format: format });
      const fileStream = fs.createWriteStream(outputPath);

      let starttime;
      videoStream.pipe(fileStream);

      videoStream.once('response', () => {
        starttime = Date.now();
      });

      videoStream.on('progress', (chunkLength, downloaded, total) => {
        const percent = downloaded / total;
        const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
        const estimatedDownloadTime = (downloadedMinutes / percent) - downloadedMinutes;
        
        downloadSpinner.text = `Downloading: ${(percent * 100).toFixed(2)}% | ${(downloaded / 1024 / 1024).toFixed(2)}MB downloaded`;
      });

      videoStream.on('end', () => {
        downloadSpinner.succeed(`Saved to: ${outputPath}`);
      });

      videoStream.on('error', (err) => {
        downloadSpinner.fail(`Download failed: ${err.message}`);
        fs.unlink(outputPath, () => {}); // Delete partial file
      });

    } catch (error) {
      spinner.fail(`Error: ${error.message}`);
    }
  });

program.parse();
