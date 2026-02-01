# Kingdom Downloader - Project Context

## Overview
A YouTube video downloader CLI built with Node.js, wrapping `yt-dlp` for maximum reliability.

## Architecture Decisions

### Why yt-dlp (Python) over ytdl-core (JS)?
- **Reliability:** yt-dlp is actively maintained by a large community
- **Evasion:** Built-in anti-bot measures and signature deciphering
- **Updates:** Self-updating binary stays ahead of YouTube changes
- **Formats:** Better format selection and fallback logic

### Why Progressive Streams (720p max)?
- No FFmpeg dependency required
- Single file download (video + audio combined)
- Faster, simpler, fewer failure points
- Good enough for most use cases

### CI Limitations
GitHub Actions IPs are blocked by YouTube (bot detection). CI only verifies:
- Code syntax (`node --check`)
- Module loading
- Dependency installation

Actual download testing must be done locally on residential IPs.

## Key Files

| File | Purpose |
|------|---------|
| `index.js` | Main CLI entry point |
| `package.json` | Dependencies and scripts |
| `yt-dlp` | Binary (auto-downloaded on first run) |
| `.github/workflows/test.yml` | CI workflow |

## Dependencies

- `yt-dlp-wrap` - Node.js wrapper for yt-dlp binary
- `commander` - CLI argument parsing
- `ora` - Terminal spinners
- `sanitize-filename` - Safe filenames

## Usage Patterns

```bash
# Basic download
node index.js "URL"

# Custom output directory
node index.js "URL" --output ./downloads

# With cookies (for restricted content)
node index.js "URL" --cookies cookies.txt
```

## Known Issues

1. **Datacenter IPs blocked** - Use cookies or residential IP
2. **Some videos have no progressive formats** - Falls back to best available
3. **Binary download may fail on restricted networks** - Check firewall/proxy

## Future Improvements

- [ ] Add format selection flag (-f 22/18/etc)
- [ ] Add audio-only mode (--audio)
- [ ] Add playlist support
- [ ] Add progress percentage to output filename
- [ ] Web UI wrapper

## History

- **v1.0** - Initial POC with ytdl-core (JS)
- **v2.0** - Switched to yt-dlp-wrap for reliability
- **v2.1** - Added self-healing binary download
- **v2.2** - Build-only CI (YouTube blocks Actions IPs)

---

*Created by Kingdom 29 🏰*
