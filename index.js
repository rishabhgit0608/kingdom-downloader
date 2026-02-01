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

      // Use a robust User-Agent (Chrome on Windows) to avoid "Sign in to confirm you're not a bot"
      const agentOptions = {
          requestOptions: {
              headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                  'Accept-Language': 'en-US,en;q=0.9',
              }
          }
      };

      const info = await ytdl.getInfo(url, agentOptions);
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

      // --- KINGDOM SELECTOR LOGIC ---
      // Priority: 720p (itag 22) -> 360p (itag 18)
      // This ensures a single file with both video and audio (Progressive).
      const preferredItags = [22, 18];
      let format = info.formats.find(f => f.itag === 22);
      
      if (!format) {
        format = info.formats.find(f => f.itag === 18);
        if (format) {
            spinner.warn('720p not available. Falling back to 360p.');
        }
      }

      if (!format) {
        // Ultimate fallback: any container with audio+video
        format = ytdl.chooseFormat(info.formats, { filter: 'audioandvideo' });
      }

      if (!format) {
        spinner.fail('No suitable video+audio format found!');
        return;
      }

      // --- RETRY & DOWNLOAD LOOP ---
      const downloadWithRetry = (attempt = 1) => {
          return new Promise((resolve, reject) => {
            const downloadSpinner = ora(attempt > 1 ? `Retry attempt ${attempt}...` : 'Downloading...').start();
            
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
                // Avoid infinity on start
                const estimatedDownloadTime = percent > 0 ? (downloadedMinutes / percent) - downloadedMinutes : 0;
                
                downloadSpinner.text = `Downloading: ${(percent * 100).toFixed(1)}% | ${(downloaded / 1024 / 1024).toFixed(1)}MB`;
            });

            videoStream.on('end', () => {
                downloadSpinner.succeed(`Saved to: ${outputPath}`);
                resolve();
            });

            videoStream.on('error', (err) => {
                fileStream.close();
                downloadSpinner.fail(`Error: ${err.message}`);
                
                if (attempt < 3) {
                    setTimeout(() => {
                        resolve(downloadWithRetry(attempt + 1));
                    }, 2000);
                } else {
                    reject(err);
                }
            });
          });
      };

      await downloadWithRetry();

    } catch (error) {
      spinner.fail(`Critical Error: ${error.message}`);
    }
  });

program.parse();
