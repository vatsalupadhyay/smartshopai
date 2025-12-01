#!/usr/bin/env node
import puppeteer from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteerExtra.use(StealthPlugin());

const url = process.argv[2] || 'https://www.amazon.com/dp/B07XG5BNC5';

async function scrape(url, limit = 20) {
  // use puppeteer-extra (stealth) to reduce bot detection
  const browser = await puppeteerExtra.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);

  // Set a realistic user agent and headers to reduce bot detection
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });
  await page.setExtraHTTPHeaders({ 'accept-language': 'en-US,en;q=0.9' });
  await page.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });

  console.log('Launching browser and navigating to:', url);
  // If the URL is a product detail (contains /dp/ASIN), prefer opening the reviews page directly
  const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/product\/([A-Z0-9]{10})/i);
  let targetUrl = url;
  if (asinMatch) {
    const asin = asinMatch[1] || asinMatch[2];
    targetUrl = `https://www.amazon.com/product-reviews/${asin}/?pageNumber=1&sortBy=recent`;
    console.log('Detected ASIN, navigating to reviews page:', targetUrl);
  }

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

  // Try to open the reviews page (click "See all reviews" if present)
  try {
    const allReviewsLink = await page.$('a[data-hook="see-all-reviews-link-foot"], a[data-hook="see-all-reviews-link"]');
    if (allReviewsLink) {
      console.log('Clicking "See all reviews" link to open reviews page');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
        allReviewsLink.click().catch(() => {}),
      ]);
    } else {
      // sometimes reviews are on same page; scroll a bit
      await page.evaluate(() => window.scrollBy(0, 800));
      await page.waitForTimeout(1000);
    }
  } catch (e) {
    console.warn('Could not click see-all-reviews link:', e.message || e);
  }

  // Wait for review containers
  try {
    await page.waitForSelector('[data-hook="review"], #cm_cr-review_list, .review', { timeout: 10000 });
  } catch (e) {
    // fallback to other selectors
    console.warn('Primary selector not found, trying alternative selectors');
  }

  // Scroll and load more reviews if possible
  let previousHeight = 0;
  for (let i = 0; i < 6; i++) {
    try {
      const height = await page.evaluate('document.body.scrollHeight');
      if (height === previousHeight) break;
      previousHeight = height;
      await page.evaluate('window.scrollBy(0, window.innerHeight)');
      await page.waitForTimeout(1000 + Math.random() * 1000);
    } catch (e) {
      break;
    }
  }

  const html = await page.content();
  console.log('\n✅ Page HTML length:', html.length);
  console.log('\n--- HTML preview (first 1200 chars) ---\n', html.substring(0, 1200));

  // Extract reviews
  const reviews = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('[data-hook="review"]'));
    const out = [];
    for (const node of nodes) {
      const body = node.querySelector('[data-hook="review-body"] span') || node.querySelector('.review-text, .a-size-base.review-text');
      if (body) {
        const t = (body.textContent || '').replace(/\s+/g, ' ').trim();
        if (t.length > 20) out.push(t);
      }
    }
    // fallback: try other common elements
    if (out.length === 0) {
      const alt = Array.from(document.querySelectorAll('.review-text, .review-text-content, #cm_cr-review_list .a-section'));
      for (const n of alt) {
        const t = (n.textContent || '').replace(/\s+/g, ' ').trim();
        if (t.length > 20) out.push(t);
      }
    }
    return out;
  });

  // If DOM-based extraction failed, try extracting from visible page text (heuristic)
  if (!reviews || reviews.length === 0) {
    const pageText = await page.evaluate(() => document.body.innerText || '');
    const found = [];
    const marker = 'Reviewed in the United States on';
    let idx = 0;
    while (found.length < limit) {
      const pos = pageText.indexOf(marker, idx);
      if (pos === -1) break;
      // take a block after the marker (skip marker and grab next 400-600 chars)
      const start = pos + marker.length;
      const block = pageText.slice(start, start + 800).trim();
      // Heuristic: remove 'Verified Purchase' if present at end
      const cleaned = block.replace(/Verified Purchase/g, '').replace(/Helpful/g, '').replace(/Report/g, '').trim();
      if (cleaned.length > 30) found.push(cleaned);
      idx = start + 800;
    }
    if (found.length > 0) {
      // close browser and print found
      await browser.close();
      console.log('\n🎯 Heuristic extracted reviews count from page text:', found.length);
      found.slice(0, limit).forEach((r, i) => console.log(`\n--- Heuristic Review ${i+1} ---\n${r}\n`));
      return;
    }
  }

  await browser.close();

  // Deduplicate and limit
  const seen = new Set();
  const unique = [];
  for (const r of reviews) {
    const key = r.slice(0, 200);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(r);
      if (unique.length >= limit) break;
    }
  }

  console.log('\n🎯 Extracted reviews count:', unique.length);
  unique.forEach((r, i) => {
    console.log('\n--- Review', i + 1, '---\n' + r + '\n');
  });

  if (unique.length === 0) console.log('\nNo reviews found — page may block access or require interaction.');
}

(async () => {
  try {
    await scrape(url, 20);
  } catch (e) {
    console.error('Scraper error:', e);
  }
})();
