# Kingdom Downloader 🏰

A robust YouTube video downloader powered by `yt-dlp`. Built for reliability and ease of use.

## Features

- **Self-Healing Binary:** Automatically downloads the latest `yt-dlp` binary on first run
- **Progressive Streams:** Prioritizes 720p/360p single-file downloads (no FFmpeg required)
- **Retry Logic:** Built-in resilience for network hiccups
- **Cookie Support:** Bypass age-gates and premium restrictions with browser cookies

## Prerequisites

- **Node.js 18+** (ES Modules support)
- **Python 3.8+** (for yt-dlp binary)

## Installation

```bash
git clone https://github.com/rishabhgit0608/kingdom-downloader.git
cd kingdom-downloader
npm install
```

## Usage

### Basic Download

```bash
node index.js "https://www.youtube.com/watch?v=VIDEO_ID"
```

### Custom Output Directory

```bash
node index.js "https://www.youtube.com/watch?v=VIDEO_ID" --output ~/Downloads
```

### With Cookies (for age-gated/premium content)

```bash
node index.js "https://www.youtube.com/watch?v=VIDEO_ID" --cookies cookies.txt
```

**How to export cookies:**
1. Install a browser extension like "Get cookies.txt LOCALLY"
2. Go to youtube.com while logged in
3. Export cookies in Netscape format
4. Save as `cookies.txt`

## How It Works

1. **Binary Check:** On first run, downloads the latest `yt-dlp` binary from GitHub
2. **Metadata Fetch:** Retrieves video info (title, formats, etc.)
3. **Download:** Streams the best progressive format (video+audio in one file)
4. **Save:** Writes to disk with sanitized filename

## CI/CD Notes

⚠️ **GitHub Actions Limitation:** YouTube blocks requests from datacenter IPs (Azure, AWS, GCP). The CI workflow only verifies code syntax, not actual downloads. The tool works correctly on residential/home IPs.

## Project Structure

```
kingdom-downloader/
├── index.js          # Main CLI entry point
├── package.json      # Dependencies
├── yt-dlp            # Binary (auto-downloaded)
└── .github/
    └── workflows/
        └── test.yml  # CI workflow (build verification only)
```

## Troubleshooting

### "Sign in to confirm you're not a bot"
- You're on a blocked IP (datacenter, VPN, etc.)
- Solution: Use `--cookies` flag with exported browser cookies

### "No suitable format found"
- The video might be restricted or unavailable
- Try a different video to verify the tool works

### Binary download fails
- Check your internet connection
- Ensure Python is installed and in PATH

## Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Engine:** yt-dlp (Python binary)
- **Wrapper:** yt-dlp-wrap (Node.js)
- **CLI:** Commander.js
- **Progress:** Ora (spinners)

## License

MIT

---

Built with 🏰 by Kingdom 29
