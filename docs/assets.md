# Website visual assets

Prepared on 2026-10-24 for airaptovideo. All people are fictional adults. The images were generated with the built-in `image_gen` tool, then visually checked. No external stock photos, movie frames, celebrity photos, or logos were used.

| Public URL | File | Format | Purpose |
| --- | --- | --- | --- |
| `/images/crowd-scene.png` | `public/images/crowd-scene.png` | 1536 × 1024 PNG | A diptych: the left half shows a woman on a balcony; the right half shows a man in the crowd. Each half is suitable for a separate portrait upload placeholder. |
| `/images/crowd-scene.jpg` | `public/images/crowd-scene.jpg` | 1536 × 1024 JPEG | Smaller browser-ready version of the same hero diptych. |
| `/images/style-rap.jpg` | `public/images/style-rap.jpg` | 1536 × 1024 JPEG | Rap / recording studio style card. |
| `/images/style-dance.jpg` | `public/images/style-dance.jpg` | 1536 × 1024 JPEG | Dance / neon studio style card. |
| `/images/style-cinematic.jpg` | `public/images/style-cinematic.jpg` | 1536 × 1024 JPEG | Cinematic / rainy city portrait style card. |
| `/samples/crowd-preview.mp4` | `public/samples/crowd-preview.mp4` | H.264 MP4, 768 × 512, 5 seconds, 24 fps, silent | An animated-still style preview made from the hero diptych. This is a sample animation, not a real generation-service result. The clip itself carries “STYLE PREVIEW · Animated still · No audio.” |

The JPEG files are format conversions of the generated PNGs made using macOS `sips`; their composition was not altered. The original generated files remain in the Codex generated-images directory. The MP4 was assembled locally with FFmpeg (the official `imageio-ffmpeg` wheel, installed only in `/private/tmp/airaptovideo-media`) using a slow 4.5% zoom and a clear sample label; no video-generation provider was involved. The site should keep an “animated style preview” caption near this sample and must not present it as evidence of actual provider output.

## Main image prompt

> Use case: photorealistic-natural. Asset type: original hero still for an AI video effects website, one wide cinematic diptych split exactly into two equal vertical halves. Primary request: a cinematic 'I found you in the crowd' encounter across a city night. LEFT HALF: a young adult woman, 25 years old, dark wavy hair, black evening outfit, leaning on an ornate stone balcony rail and turning her head toward the crowd below. RIGHT HALF: a young adult man, 25 years old, dark hair, white shirt under a dark jacket, standing still in a busy outdoor night party crowd and looking upward with a quiet surprised expression, a warm spotlight finding his face. Subjects are entirely fictional adults, no known actors or films. Each half must work as an independent portrait crop with the face and shoulders roughly centered in that half. Style/medium: realistic 35mm film photography, delicate film grain, genuine skin texture, cinematic shallow depth of field, premium editorial still. Color palette: violet-blue night shadows, warm amber light on skin, natural colors. Composition: landscape 3:2 canvas, full-bleed photographic imagery, left/right boundary straight down the exact center. Moody but luminous, faces clearly visible at thumbnail scale. Text: none. Avoid illustration, cartoon, mockup UI, collage borders, split outlines, typography, logos, watermark, film references, celebrity likeness, excessive darkness.

## Rap style prompt

> Use case: photorealistic-natural. Asset type: landscape editorial photo for an AI rap video generator style card. Primary request: an adult Black male rap artist aged 28, wearing a black hoodie and subtle silver chain, performing in a professional recording studio beside a large condenser microphone and round pop shield. Camera framing waist up with expressive hands and authentic confident energy. Style/medium: realistic cinematic photography, rich true skin texture, shallow depth of field, fine 35mm film grain. Lighting/mood: violet studio LEDs, soft warm skin light, immersive dark purple and indigo environment with visible soundproof panels. Composition: landscape 3:2 crop, subject and microphone centered, well exposed for a small website thumbnail. Constraints: fully fictional adult person, no celebrity resemblance; no text, typography, logos, watermarks or UI; realistic photo, no cartoon.

## Dance style prompt

> Use case: photorealistic-natural. Asset type: landscape editorial photo for an AI dance video style card. Primary request: one adult female street dancer aged 25 in a lilac cropped sports top and loose black cargo pants, caught in a strong, elegant dynamic dance pose in a dark studio with purple neon tubes and a glossy floor. Style/medium: realistic fashion dance photography, genuine skin texture, subtle film grain. Lighting/mood: saturated violet and electric blue rim lighting with a clear face, confident energetic mood. Composition: landscape 3:2 frame, wide enough to show most of the dancer, balanced center placement so the photo remains legible as a small website card. Constraints: fully fictional adult; one person only; no text, typography, logos, watermarks or UI; realistic photo, no cartoon.

## Cinematic style prompt

> Use case: photorealistic-natural. Asset type: landscape editorial photo for a cinematic AI video style card. Primary request: close portrait of an adult Asian woman aged 28 in an elegant black coat, turning gently toward the camera in a rainy neon city street at night. Style/medium: realistic cinematic 35mm film photography, natural skin texture, shallow depth of field, moody colorful bokeh and subtle grain. Lighting/mood: violet-blue shadows, warm amber light from a nearby shop crossing her face, wistful confident expression. Composition: landscape 3:2 frame, subject centered and clearly visible at thumbnail scale. Constraints: fully fictional adult; no celebrity resemblance; no text, typography, logos, watermarks or UI; realistic photo, no cartoon.

## Validation

The MP4 was decoded completely with FFmpeg: 120 frames, exactly 5.00 seconds, H.264 video in `yuv420p`, no audio stream. A frame at 2 seconds was extracted and visually checked for orientation, composition, and the sample label. The file uses `faststart` for browser playback.
