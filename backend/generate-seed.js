const fs = require('fs');
const path = require('path');

// Configuration
const QUOTES_FILE = path.join(__dirname, '../data-extraction/quotes.json');
const IMG_DIR = path.join(__dirname, '../fufufafa-memorable-quotes/img');
const OUTPUT_FILE = path.join(__dirname, './seed.sql');

/**
 * Get list of available image IDs
 */
function getImageIds() {
    const files = fs.readdirSync(IMG_DIR);
    const imageIds = new Set();

    for (const file of files) {
        const match = file.match(/^(\d+)\.png$/);
        if (match) {
            imageIds.add(parseInt(match[1], 10));
        }
    }

    return imageIds;
}

/**
 * Escape SQL string
 */
function escapeSQL(str) {
    if (str === null || str === undefined) return 'NULL';
    return "'" + str.replace(/'/g, "''") + "'";
}

/**
 * Generate seed.sql from quotes.json
 */
function generateSeedSQL() {
    // Read quotes
    const quotesData = JSON.parse(fs.readFileSync(QUOTES_FILE, 'utf-8'));
    const quotes = quotesData.quotes;

    // Get image IDs
    const imageIds = getImageIds();
    console.log(`Found ${imageIds.size} images`);

    // Generate SQL
    let sql = '-- FUaaS Seed Data\n';
    sql += '-- Generated: ' + new Date().toISOString() + '\n\n';
    sql += 'BEGIN TRANSACTION;\n\n';

    for (const quote of quotes) {
        const hasImage = imageIds.has(quote.id) ? 1 : 0;
        sql += `INSERT INTO quotes (id, quote, source_url, has_image) VALUES (${quote.id}, ${escapeSQL(quote.quote)}, ${escapeSQL(quote.source_url)}, ${hasImage});\n`;
    }

    sql += '\nCOMMIT;\n';

    // Write to file
    fs.writeFileSync(OUTPUT_FILE, sql, 'utf-8');
    console.log(`Generated ${OUTPUT_FILE}`);
    console.log(`Total quotes: ${quotes.length}`);

    // Count quotes with images
    const withImages = quotes.filter(q => imageIds.has(q.id)).length;
    console.log(`Quotes with images: ${withImages}`);
}

// Run
generateSeedSQL();
