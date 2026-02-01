import ytDlp from 'yt-dlp-exec';
import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import ora from 'ora';

program
  .name('kingdom-dl')
  .description('Robust YouTube Downloader powered by yt-dlp')
  .argument('<url>', 'YouTube Video URL')
  .option('-o, --output <dir>', 'Output directory', '.')
  .action(async (url, options) => {
    const spinner = ora('Initializing yt-dlp engine...').start();

    try {
      if (!fs.existsSync(options.output)){
          fs.mkdirSync(options.output, { recursive: true });
      }

      // 1. Get Metadata First
      spinner.text = 'Fetching video metadata...';
      const info = await ytDlp(url, {
        dumpSingleJson: true,
        noWarnings: true,
        preferFreeFormats: true,
      });

      const title = info.title;
      spinner.succeed(`Found: ${title}`);

      // 2. Download
      const downloadSpinner = ora('Downloading (Best Progressive)...').start();
      
      // Flags:
      // -f best[ext=mp4] : Best single file MP4
      // -o : Output template
      const outputTemplate = path.join(options.output, '%(title)s.%(ext)s');

      await ytDlp(url, {
        format: 'best[ext=mp4]/best', // Prefer MP4, fallback to best
        output: outputTemplate,
        noWarnings: true,
      });

      downloadSpinner.succeed(`Saved to: ${options.output}`);

    } catch (error) {
      spinner.fail(`Error: ${error.message}`);
      // Log the full error if it's a yt-dlp specific issue
      if (error.stderr) {
        console.error('\n--- YT-DLP LOGS ---');
        console.error(error.stderr);
      }
    }
  });

program.parse();
