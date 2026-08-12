# Background video asset

Drop the ambient background clip here as:

- `atlantis-bg.mp4` (required — H.264/AAC, widest browser support)
- `atlantis-bg.webm` (optional — VP9, smaller file size, used first when supported)

`assets/js/background-video.js` looks for exactly these two filenames and fails
over to a static gradient (see `.bg-video-fallback` in
`assets/css/background-video.css`) if neither loads.

## Guidance for the source clip

- Keep it short and seamlessly loopable (5-15s) — it plays on `loop`, so a
  visible seam is more noticeable than the video being short.
- No audio track needed; playback is always `muted`.
- 1080p is plenty since the video is stretched full-bleed behind heavily
  darkened/blurred UI (see the overlay in `background-video.js`) — it will
  never be looked at directly, so further downscaling to 720p is usually fine
  and shrinks the file a lot.
- Target under ~5-8MB for a GitHub Pages-hosted site with no CDN in front of
  it. If your source file is >10MB, compress it first, e.g.:
  ```bash
  ffmpeg -i source.mov -vf scale=1920:-2 -c:v libx264 -crf 28 -preset slow -an assets/videos/atlantis-bg.mp4
  ffmpeg -i source.mov -vf scale=1920:-2 -c:v libvpx-vp9 -crf 32 -b:v 0 -an assets/videos/atlantis-bg.webm
  ```
- Optional poster frame: add `assets/images/atlantis-bg-poster.jpg` (a single
  still frame) to avoid a flash of black before the video's first frame
  decodes.

This directory is intentionally empty in git otherwise — the clip itself
should be added in the commit that follows this scaffolding.
