const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Configuration
const QUOTES_FILE = path.join(__dirname, './quotes.json');
const OUTPUT_DIR = path.join(__dirname, './scraped-images');

// How many quotes to process (set to null for all)
const LIMIT = process.argv[2] ? parseInt(process.argv[2]) : null;
// Start from specific ID
const START_FROM = process.argv[3] ? parseInt(process.argv[3]) : 1;

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Find and screenshot fufufafa's post on the page
 */
async function screenshotFufufafaPost(page, url, outputPath) {
    try {
        console.log(`  Loading page...`);
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Wait for posts to load
        await page.waitForSelector('[class*="w-full md:rounded"]', { timeout: 10000 });

        // Remove overlay elements that appear during page load
        await page.evaluate(() => {
            // Remove the main backdrop overlay (new class name)
            document.querySelectorAll('.overlay_overlay__CvnmQ, [class*="overlay_overlay"]').forEach(el => el.remove());

            // Remove app promotion modal (z-100)
            document.querySelectorAll('div.fixed.bottom-0.left-0.z-100').forEach(el => el.remove());

            // Remove app promotion background bar (z-90)  
            document.querySelectorAll('div.fixed.bottom-0.left-0.right-0.z-90').forEach(el => el.remove());

            // Remove cookie consent banner
            document.querySelectorAll('div.fixed.bottom-0[class*="z-20"]').forEach(el => el.remove());

            // Remove all fixed elements with high z-index that could be overlays
            document.querySelectorAll('.fixed').forEach(el => {
                const style = window.getComputedStyle(el);
                const zIndex = parseInt(style.zIndex) || 0;
                if (zIndex >= 20) {
                    el.remove();
                }
            });

            // Remove preact shadow hosts
            document.querySelectorAll('#preact-border-shadow-host').forEach(el => el.remove());
        });

        // Wait a bit more for images to load
        await new Promise(r => setTimeout(r, 1500));

        // Find fufufafa's post and clean it up (remove comments)
        const result = await page.evaluate(() => {
            // Find all posts on the page
            const posts = document.querySelectorAll('[class*="w-full md:rounded bg-surface"]');

            for (let i = 0; i < posts.length; i++) {
                const post = posts[i];
                // Look for the username element
                const usernameEl = post.querySelector('.htmlContentRenderer_html-content__ePjqJ.font-medium');

                if (usernameEl && usernameEl.textContent.trim().toLowerCase() === 'fufufafa') {
                    // Found it! Now clean up the post by removing comments section

                    // Find the main action bar (with vote buttons, Kutip, Balas)
                    // It's the first div with class "flex w-full justify-between pb-2 px-4" 
                    // that contains the fa-arrow-alt-up icon
                    const actionBars = post.querySelectorAll('div.flex.w-full.justify-between.pb-2.px-4');
                    let mainActionBar = null;

                    for (const bar of actionBars) {
                        if (bar.querySelector('.fa-arrow-alt-up') && bar.querySelector('.fa-share-nodes')) {
                            mainActionBar = bar;
                            break;
                        }
                    }

                    if (mainActionBar) {
                        // Remove everything after the action bar (comments, "Tutup" section, etc.)
                        let sibling = mainActionBar.nextElementSibling;
                        while (sibling) {
                            const toRemove = sibling;
                            sibling = sibling.nextElementSibling;
                            toRemove.remove();
                        }

                        // Also remove the reputation section (avatars with "xxx dan yyy lainnya memberi reputasi")
                        const repSection = post.querySelector('div.my-2.flex.cursor-pointer.px-4');
                        if (repSection) {
                            repSection.remove();
                        }
                    }

                    // Return the bounding rect
                    const rect = post.getBoundingClientRect();
                    return {
                        found: true,
                        index: i,
                        x: rect.x,
                        y: rect.y,
                        width: rect.width,
                        height: rect.height
                    };
                }
            }

            return { found: false };
        });

        if (!result.found) {
            console.log(`  ✗ Could not find fufufafa's post on page`);
            return false;
        }

        console.log(`  Found post, taking screenshot...`);

        // Get the post element and screenshot it
        const posts = await page.$$('[class*="w-full md:rounded bg-surface"]');
        if (posts[result.index]) {
            await posts[result.index].screenshot({
                path: outputPath,
                type: 'png'
            });
            return true;
        }

        return false;
    } catch (error) {
        console.error(`  ✗ Error: ${error.message}`);
        return false;
    }
}

/**
 * Main scraping function
 */
async function main() {
    // Read quotes
    const quotesData = JSON.parse(fs.readFileSync(QUOTES_FILE, 'utf-8'));
    let quotes = quotesData.quotes;

    // Apply start filter
    quotes = quotes.filter(q => q.id >= START_FROM);

    // Apply limit
    if (LIMIT) {
        quotes = quotes.slice(0, LIMIT);
    }

    console.log(`Processing ${quotes.length} quotes (starting from ID ${START_FROM})`);
    console.log(`Output directory: ${OUTPUT_DIR}\n`);

    // Launch browser
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });

    const page = await browser.newPage();

    // Set viewport to reasonable size
    await page.setViewport({ width: 800, height: 1200 });

    // Set user agent to look like a real browser
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let processed = 0;
    let success = 0;
    let failed = 0;
    let skipped = 0;

    // Process each quote
    for (const quote of quotes) {
        const outputPath = path.join(OUTPUT_DIR, `${quote.id}.png`);

        // Skip if already exists
        if (fs.existsSync(outputPath)) {
            console.log(`[${quote.id}] Already exists, skipping`);
            skipped++;
            continue;
        }

        console.log(`[${quote.id}/${quotesData.quotes.length}] ${quote.source_url.substring(0, 70)}...`);

        const result = await screenshotFufufafaPost(page, quote.source_url, outputPath);

        if (result) {
            console.log(`  ✓ Saved: ${quote.id}.png`);
            success++;
        } else {
            failed++;
        }

        processed++;

        // Rate limiting - wait between requests
        await new Promise(r => setTimeout(r, 2000));
    }

    await browser.close();

    console.log('\n=== Summary ===');
    console.log(`Processed: ${processed}`);
    console.log(`Success: ${success}`);
    console.log(`Failed: ${failed}`);
    console.log(`Skipped (already existed): ${skipped}`);
}

// Run
main().catch(console.error);
