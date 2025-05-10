const puppeteer = require('puppeteer');
const axios = require('axios');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const page = await browser.newPage();

  // Spoof user agent and other properties
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
  );

  await page.setViewport({ width: 1280, height: 800 });

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  });

  await page.goto(
    'https://www.reddit.com/r/anime/search/?q=top+10+anime+"Anime+Corner"&type=posts&sort=new',
    { waitUntil: 'networkidle2' }
  );

  // Scroll to trigger lazy loading
  await page.evaluate(() => {
    window.scrollBy(0, window.innerHeight * 2);
  });
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await page.screenshot({ path: 'debug1.png', fullPage: true });


  // Click the 3rd post
  const postSelector =
    '[data-testid="search-sdui-post"]:nth-child(3) [data-testid="post-title"]';

  try {
    await page.waitForSelector(postSelector, { timeout: 10000 });
    await page.click(postSelector);
  } catch (err) {
    console.error("Could not find or click the post:", err);
    await page.screenshot({ path: 'debug_fail_click.png', fullPage: true });
    await browser.close();
    return;
  }

  // Wait for post content to load
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug2.png', fullPage: true });

  // Extract image src
  let imageUrl;
  try {
    imageUrl = await page.$eval('img#post-image', (img) => img.src);
  } catch (err) {
    console.error("No image found:", err);
  }

  await browser.close();

  // Send to Discord
  if (imageUrl) {
    await axios.post(process.env.DISCORD_WEBHOOK, {
      username: 'Anime',
      avatar_url:
        'https://styles.redditmedia.com/t5_2qh22/styles/communityIcon_18jg89hnk9ae1.png',
      content: imageUrl,
    });
  } else {
    console.error('No image found to send.');
  }
})();
