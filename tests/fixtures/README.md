# Test fixtures

`synthetic.heic` is an original, synthetic 32 × 32 RGB image (color `#b4d75a`),
encoded with macOS `sips` as HEVC/HEIC. It contains no photo or personal data.
The 640-byte file has the `ftypheic` brand and is decoded by the actual
`heic-convert` / `heic-decode` pipeline in the HTTP integration test.

Regenerate on macOS with the project's installed Sharp dependency:

```sh
node -e 'require("sharp")({create:{width:32,height:32,channels:3,background:{r:180,g:215,b:90}}}).png().toFile("/tmp/airap-heic-fixture.png")'
sips -s format heic /tmp/airap-heic-fixture.png --out tests/fixtures/synthetic.heic
```

Source: created in this repository for these tests, October 24, 2026.
License: CC0-1.0 (public-domain dedication). You may copy, modify, and distribute
this fixture without restriction. See https://creativecommons.org/publicdomain/zero/1.0/.

Other JPEG, PNG, and WebP inputs are generated in memory by Sharp at test time.
Tests never download fixtures or contact an external video or payment service.
