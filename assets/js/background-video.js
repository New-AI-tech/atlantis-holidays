/* ================================================================
   AMBIENT BACKGROUND VIDEO
   ================================================================
   Injects a fixed, full-viewport, muted/looping video behind the
   page (see assets/css/background-video.css for the "texture, not
   footage" treatment: brightness/saturate filter on the video plus
   a rgba(0,0,0,0.65) scrim on top).

   Load with:
     <link rel="stylesheet" href="assets/css/background-video.css">
     <script src="assets/js/background-video.js" defer></script>

   Video file lives at assets/videos/atlantis-bg.{mp4,webm} — see
   assets/videos/README.md for format/size guidance. If that file is
   ever swapped for something heavier, keep an eye on it: anything
   above ~10MB is worth re-compressing (ffmpeg -crf 28-32) before
   shipping, since GitHub Pages has no CDN/transcoding in front of it.
   ================================================================ */
(function () {
    function init() {
        var prefersReducedMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        var layer = document.createElement('div');
        layer.className = 'bg-video-layer';
        layer.id = 'bgVideoLayer';
        layer.setAttribute('aria-hidden', 'true');

        var video = document.createElement('video');
        video.className = 'bg-video';
        // muted is required for autoplay to be allowed in Chrome/Safari;
        // also set as an attribute (not just the property) so it holds
        // even if a browser inspects markup before script/property runs.
        video.muted = true;
        video.setAttribute('muted', '');
        video.setAttribute('autoplay', '');
        video.setAttribute('loop', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('poster', 'assets/images/atlantis-bg-poster.jpg');
        video.setAttribute('loading', 'lazy');
        video.preload = 'metadata';

        var mp4 = document.createElement('source');
        mp4.src = 'assets/videos/atlantis-bg.mp4';
        mp4.type = 'video/mp4';
        video.appendChild(mp4);

        var webm = document.createElement('source');
        webm.src = 'assets/videos/atlantis-bg.webm';
        webm.type = 'video/webm';
        video.appendChild(webm);

        // Fallback if the file is missing/corrupt/unsupported: drop to
        // the static gradient defined in .bg-video-layer--fallback
        // instead of leaving a broken/black video element on screen.
        video.addEventListener('error', function () {
            layer.classList.add('bg-video-layer--fallback');
        }, true);

        layer.appendChild(video);

        var overlay = document.createElement('div');
        overlay.className = 'bg-video-overlay';
        layer.appendChild(overlay);

        document.body.insertBefore(layer, document.body.firstChild);

        if (prefersReducedMotion) {
            // Keep the ambient texture (poster/first frame) but don't
            // animate it for users who asked for reduced motion.
            video.removeAttribute('autoplay');
            video.pause();
        } else {
            // Autoplay can still be blocked by some browsers/extensions
            // even when muted; fail over to the gradient rather than
            // showing a frozen black rectangle.
            var playPromise = video.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(function () {
                    layer.classList.add('bg-video-layer--fallback');
                });
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
