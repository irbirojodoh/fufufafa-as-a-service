const fs = require('fs');
const path = require('path');

// Configuration
const RAW_DIR = path.join(__dirname, '../fufufafa-memorable-quotes/raw');
const OUTPUT_FILE = path.join(__dirname, './quotes.json');

// Files to process in order (IDs will be sequential across all files)
const FILES = ['list.txt', 'list-2.txt', 'list-3.txt'];

/**
 * Parse a line from list.txt (uses multiple spaces as delimiter)
 * Format: quote (space-padded) url
 */
function parseListTxt(line) {
  // Trim the line and find the URL (starts with http)
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Find the URL by looking for http
  const urlMatch = trimmed.match(/(https?:\/\/\S+)/);
  if (!urlMatch) return null;

  const url = urlMatch[1];
  const quote = trimmed.substring(0, trimmed.indexOf(url)).trim();

  if (!quote) return null;

  return { quote, source_url: url };
}

/**
 * Parse a line from list-2.txt and list-3.txt (uses | as delimiter)
 * Format: quote | url
 */
function parseListPipe(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Split by | delimiter
  const parts = trimmed.split('|');
  if (parts.length < 2) return null;

  const quote = parts[0].trim();
  const url = parts.slice(1).join('|').trim(); // Handle URLs that might contain |

  if (!quote || !url) return null;

  return { quote, source_url: url };
}

/**
 * Read and parse a file
 */
function parseFile(filename) {
  const filepath = path.join(RAW_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');

  // Split into lines and remove empty lines
  const lines = content.split(/\r?\n/).filter(line => line.trim());

  const parser = filename === 'list.txt' ? parseListTxt : parseListPipe;
  const entries = [];

  for (const line of lines) {
    const parsed = parser(line);
    if (parsed) {
      entries.push(parsed);
    }
  }

  return entries;
}

/**
 * Main function to generate JSON
 */
function generateJson() {
  const allQuotes = [];
  let currentId = 1;

  for (const file of FILES) {
    console.log(`Processing ${file}...`);
    const entries = parseFile(file);

    for (const entry of entries) {
      allQuotes.push({
        id: currentId,
        quote: entry.quote,
        source_url: entry.source_url,
        semantic_analysis: null,
        image: null
      });
      currentId++;
    }

    console.log(`  - Found ${entries.length} quotes from ${file}`);
  }

  // Write to JSON file
  const output = {
    total_quotes: allQuotes.length,
    generated_at: new Date().toISOString(),
    quotes: allQuotes
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\nGenerated ${OUTPUT_FILE}`);
  console.log(`Total quotes: ${allQuotes.length}`);
}

// Run the script
generateJson();
