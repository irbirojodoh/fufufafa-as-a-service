/**
 * FUaaS - Cloudflare Worker (JavaScript version for local development)
 * 
 * This is a JavaScript implementation of the API for quick local testing.
 * For production, use the Rust implementation in src/
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        try {
            // GET /api/wisdom/ - Random quote
            if (path === '/api/wisdom/' || path === '/api/wisdom') {
                const quote = await getRandomQuote(env.DB);
                if (!quote) {
                    return jsonResponse({ error: 'No quotes found' }, 404, corsHeaders);
                }
                return jsonResponse(formatQuote(quote), 200, corsHeaders);
            }

            // GET /api/wisdom/:id - Quote by ID
            const quoteMatch = path.match(/^\/api\/wisdom\/(\d+)$/);
            if (quoteMatch) {
                const id = parseInt(quoteMatch[1]);
                const quote = await getQuoteById(env.DB, id);
                if (!quote) {
                    return jsonResponse({ error: 'Quote not found' }, 404, corsHeaders);
                }
                return jsonResponse(formatQuote(quote), 200, corsHeaders);
            }

            // GET /api/wisdom/img - Random image
            if (path === '/api/wisdom/img' || path === '/api/wisdom/img/') {
                const id = await getRandomImageId(env.DB);
                if (!id) {
                    return jsonResponse({ error: 'No images available' }, 404, corsHeaders);
                }
                return await serveImage(env.IMAGES, id, corsHeaders);
            }

            // GET /api/wisdom/img/:id - Image by ID
            const imgMatch = path.match(/^\/api\/wisdom\/img\/(\d+)$/);
            if (imgMatch) {
                const id = parseInt(imgMatch[1]);
                const hasImg = await hasImage(env.DB, id);
                if (!hasImg) {
                    return jsonResponse({ error: 'Image not found' }, 404, corsHeaders);
                }
                return await serveImage(env.IMAGES, id, corsHeaders);
            }

            // GET /health
            if (path === '/health') {
                return new Response('OK', { headers: corsHeaders });
            }

            // 404 for unknown routes
            return jsonResponse({ error: 'Not found' }, 404, corsHeaders);

        } catch (error) {
            console.error('Error:', error);
            return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
        }
    }
};

// Helper functions

function jsonResponse(data, status, headers) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    });
}

function formatQuote(quote) {
    return {
        quote: quote.quote,
        source_url: quote.source_url,
    };
}

async function getRandomQuote(db) {
    const countResult = await db.prepare('SELECT COUNT(*) as count FROM quotes').first();
    const count = countResult?.count || 0;
    if (count === 0) return null;

    const randomId = Math.floor(Math.random() * count) + 1;
    return await getQuoteById(db, randomId);
}

async function getQuoteById(db, id) {
    return await db.prepare('SELECT id, quote, source_url, has_image FROM quotes WHERE id = ?')
        .bind(id)
        .first();
}

async function hasImage(db, id) {
    const result = await db.prepare('SELECT has_image FROM quotes WHERE id = ?')
        .bind(id)
        .first();
    return result?.has_image === 1;
}

async function getRandomImageId(db) {
    const result = await db.prepare('SELECT id FROM quotes WHERE has_image = 1 ORDER BY RANDOM() LIMIT 1')
        .first();
    return result?.id || null;
}

async function serveImage(bucket, id, corsHeaders) {
    const key = `${id}.png`;
    const object = await bucket.get(key);

    if (!object) {
        return jsonResponse({ error: 'Image file not found' }, 404, corsHeaders);
    }

    const body = await object.arrayBuffer();
    return new Response(body, {
        headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=86400',
            ...corsHeaders,
        },
    });
}
