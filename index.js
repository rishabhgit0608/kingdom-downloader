import YTDlpWrap from 'yt-dlp-wrap';
import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import ora from 'ora';

const BINARY_PATH = path.resolve(process.cwd(), 'yt-dlp');

// Helper to ensure binary exists
async function ensureBinary() {
    if (fs.existsSync(BINARY_PATH)) {
        return new YTDlpWrap.default(BINARY_PATH);
    }

    const spinner = ora('Downloading latest yt-dlp binary...').start();
    try {
        await YTDlpWrap.default.downloadFromGithub(BINARY_PATH);
        // Make executable on Linux/Mac
        if (process.platform !== 'win32') {
            fs.chmodSync(BINARY_PATH, '755');
        }
        spinner.succeed('Binary downloaded & installed.');
        return new YTDlpWrap.default(BINARY_PATH);
    } catch (err) {
        spinner.fail(`Failed to download binary: ${err.message}`);
        throw err;
    }
}

program
  .name('kingdom-dl')
  .description('Robust YouTube Downloader (yt-dlp wrapper)')
  .argument('<url>', 'YouTube Video URL')
  .option('-o, --output <dir>', 'Output directory', '.')
  .action(async (url, options) => {
    
    try {
      const ytDlp = await ensureBinary();
      const spinner = ora('Fetching metadata...').start();

      if (!fs.existsSync(options.output)){
          fs.mkdirSync(options.output, { recursive: true });
      }

      // 1. Metadata
      const metadata = await ytDlp.getVideoInfo(url);
      const title = metadata.title;
      spinner.succeed(`Found: ${title}`);

      // 2. Download
      const downloadSpinner = ora('Downloading...').start();
      const outputTemplate = path.join(options.output, '%(title)s.%(ext)s');

      // Execute download with event emitter for progress
      let ytDlpEventEmitter = ytDlp.exec([
          url,
          '-f', 'best[ext=mp4]/best', // Progressive MP4 priority
          '-o', outputTemplate,
          '--no-warnings'
      ]);

      ytDlpEventEmitter.on('progress', (progress) => {
          downloadSpinner.text = `Downloading: ${progress.percent}% | ${progress.currentSpeed} | ETA: ${progress.eta}`;
      });

      ytDlpEventEmitter.on('error', (error) => {
          downloadSpinner.fail(`Download Error: ${error.message}`);
      });

      ytDlpEventEmitter.on('close', () => {
          downloadSpinner.succeed(`Saved to: ${options.output}`);
      });

    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

program.parse();
