/**
 * Renders scene.html frame by frame and encodes the hero video.
 * Requires: Node + Playwright (Chromium), ffmpeg.
 *
 *   node tools/hero-video/render.js
 *
 * Output: assets/video/hero.mp4, assets/video/hero.webm, assets/img/hero-poster.jpg
 */
const { chromium } = require("playwright");
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const FPS = 30;
const SECONDS = 12;
const ROOT = path.resolve(__dirname, "../..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hero-frames-"));

(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "localhost" } : undefined;
  const browser = await chromium.launch(proxy ? { proxy } : {});
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, ignoreHTTPSErrors: true });
  await page.goto("file://" + path.join(__dirname, "scene.html") + "?render", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const total = FPS * SECONDS;
  for (let i = 0; i < total; i++) {
    await page.evaluate((t) => window.draw(t), i / FPS);
    await page.screenshot({ path: path.join(tmp, `f${String(i).padStart(4, "0")}.png`) });
    if (i % 60 === 0) console.log(`frame ${i}/${total}`);
  }
  await page.evaluate(() => window.draw(7.4));
  await page.screenshot({ path: path.join(tmp, "poster.png") });
  await browser.close();

  const input = ["-y", "-framerate", String(FPS), "-i", path.join(tmp, "f%04d.png")];
  execFileSync("ffmpeg", [...input, "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", path.join(ROOT, "assets/video/hero.mp4")], { stdio: "inherit" });
  execFileSync("ffmpeg", [...input, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "40", "-row-mt", "1", "-pix_fmt", "yuv420p", "-an", path.join(ROOT, "assets/video/hero.webm")], { stdio: "inherit" });
  execFileSync("ffmpeg", ["-y", "-i", path.join(tmp, "poster.png"), "-q:v", "4", path.join(ROOT, "assets/img/hero-poster.jpg")], { stdio: "inherit" });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("done");
})();
