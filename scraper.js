const puppeteer = require('puppeteer');
const axios = require('axios');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36');
  

  await page.goto('https://www.reddit.com/r/anime/search/?q=top+10+anime+"Anime+Corner"&type=posts&sort=new', {
    waitUntil: 'networkidle2'
  });

  // Click the 3rd post
  const postSelector = '[data-testid="search-sdui-post"]:nth-child(3) [data-testid="post-title"]';
  await page.waitForSelector(postSelector);
  await page.click(postSelector);

  await new Promise(resolve => setTimeout(resolve, 200));
  await page.evaluate(() => {
    window.scrollBy(0, window.innerHeight);
  });
  await new Promise(resolve => setTimeout(resolve, 200));
  await page.screenshot({ path: 'debug.png', fullPage: true });
  
  // Extract image src
  const imageUrl = await page.$eval('img#post-image', img => img.src);

  await browser.close();

  // Send to Discord
  if (imageUrl) {
    await axios.post(process.env.DISCORD_WEBHOOK, {
      username: "Anime",
      avatar_url: "https://styles.redditmedia.com/t5_2qh22/styles/communityIcon_18jg89hnk9ae1.png",
      content: imageUrl
    });
  } else {
    console.error("No image found.");
  }
})();
