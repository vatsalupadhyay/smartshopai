#!/usr/bin/env node
import fs from 'fs';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { load } from 'cheerio';

dotenv.config();

const SCRAPEDO_TOKEN = process.env.SCRAPEDO_API_TOKEN;
if (!SCRAPEDO_TOKEN) {
  console.error('SCRAPEDO_API_TOKEN not set in .env');
  process.exit(1);
}

const url = process.argv[2] || 'https://www.amazon.com/dp/B07XG5BNC5';
console.log('Fetching (scrape.do) URL:', url);

async function run() {
  try {
      // Try a simple GET with token & encoded url
      const sbUrl = `https://api.scrape.do/?token=${encodeURIComponent(String(SCRAPEDO_TOKEN))}&url=${encodeURIComponent(url)}`;
      const res = await fetch(sbUrl, { method: 'GET' });

    if (!res.ok) {
      console.error('scrape.do returned status', res.status);
      const txt = await res.text();
      console.error('response:', txt.substring(0, 2000));
      process.exit(1);
    }

    const html = await res.text();
    console.log('✅ scrape.do fetch successful — HTML length:', html.length);
    console.log('--- HTML preview (first 1000 chars) ---\n', html.substring(0, 1000));

  const $ = load(html);

    // Try Amazon selectors first
    const selectors = [
      '[data-hook="review"] [data-hook="review-body"]',
      '[data-hook="review"] .review-text',
      '.review-text',
      '.review',
      '[id*=review]'
    ];

    const found = new Set();
    for (const sel of selectors) {
      $(sel).each((i, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (text.length > 30) found.add(text.slice(0, 2000));
      });
      if (found.size >= 20) break;
    }

    // Fallback regex blocks
    if (found.size < 10) {
      const matches = html.match(/>\s*([^<>]{60,1200})\s*</g) || [];
      for (const m of matches) {
        const t = m.replace(/^>\s*/, '').replace(/\s*</, '').trim();
        if (t.length > 40) found.add(t);
        if (found.size >= 20) break;
      }
    }

    console.log('\n🎯 Extracted reviews count:', found.size);
    let idx = 1;
    for (const rev of Array.from(found).slice(0, 20)) {
      console.log(`\n--- Review ${idx} ---\n${rev}\n`);
      idx++;
    }

    if (found.size === 0) console.log('\nNo reviews extracted — page may block scraping or reviews are loaded dynamically after interactions.');
  } catch (e) {
    console.error('Error during scrape:', e);
  }
}

run();
