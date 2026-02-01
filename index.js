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

// Robust User Agent
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

program
  .name('kingdom-dl')
  .description('Robust YouTube Downloader (yt-dlp wrapper)')
  .argument('<url>', 'YouTube Video URL')
  .option('-o, --output <dir>', 'Output directory', '.')
  .option('--cookies <file>', 'Path to cookies.txt (Netscape format)')
  .action(async (url, options) => {
    
    try {
      const ytDlp = await ensureBinary();
      const spinner = ora('Fetching metadata...').start();

      if (!fs.existsSync(options.output)){
          fs.mkdirSync(options.output, { recursive: true });
      }

      // Base arguments for evasion
      const baseArgs = [
          '--no-warnings',
          '--no-check-certificates',
          '--user-agent', USER_AGENT,
          '--prefer-free-formats',
          '--js-runtimes', 'node' // Use system Node.js for de-obfuscation
      ];

      if (options.cookies) {
          baseArgs.push('--cookies', options.cookies);
      }

      // 1. Metadata
      // Construct args for metadata fetch
      const metaArgs = [url, '--dump-json', ...baseArgs];
      
      // execPromise is internal to yt-dlp-wrap, we use exec directly with stdout capture
      const metadataJson = await ytDlp.execPromise(metaArgs);
      const metadata = JSON.parse(metadataJson);
      
      const title = metadata.title;
      spinner.succeed(`Found: ${title}`);

      // 2. Download
      const downloadSpinner = ora('Downloading...').start();
      const outputTemplate = path.join(options.output, '%(title)s.%(ext)s');

      const downArgs = [
          url,
          '-f', 'best[ext=mp4]/best', 
          '-o', outputTemplate,
          ...baseArgs
      ];

      let ytDlpEventEmitter = ytDlp.exec(downArgs);

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
