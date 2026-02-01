# Development Notes

## 2026-02-01 - Initial Build

### Session Summary
Built the YouTube downloader POC from scratch with Rishabh.

### Journey
1. **Started with ytdl-core (JS)** - Clean, pure Node.js approach
2. **Hit bot detection wall** - YouTube blocks datacenter IPs aggressively
3. **Tried various evasions:**
   - User-Agent spoofing ❌
   - Android client API ❌
   - JS runtime injection ❌
4. **Pivoted to yt-dlp** - The nuclear option that works
5. **Fixed CI lockfile sync** - `npm ci` requires exact lockfile match
6. **Accepted reality** - CI can only verify build, not actual downloads

### Lessons Learned
- YouTube's bot detection is IP-based, not just header-based
- GitHub Actions runs on Azure IPs = instant block
- yt-dlp is battle-tested for a reason
- Always run `npm install` after editing `package.json` to sync lockfile

### Environment
- EC2 instance (Ubuntu)
- Node.js 20+
- Python 3.10+
- OpenClaw gateway for orchestration

### Connected Services
- **Email:** bhambanirishabh@gmail.com (via Himalaya CLI)
- **GitHub:** rishabhgit0608 (authenticated via PAT)
- **WhatsApp:** Connected via OpenClaw gateway
