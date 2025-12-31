export const runtime = 'edge';


import type { NextRequest } from 'next/server';


const POLY_URL = 'https://polymarket.com/_next/data/U5wKHwCBPszSnF1QqbZuu/event/fed-decision-in-september.json?slug=fed-decision-in-september';


export async function GET(req: NextRequest) {
// Build upstream headers that mimic a browser so Vercel/edge gives us a cache HIT
const upstream = new Headers();
upstream.set('Accept', 'application/json, text/plain, */*');
upstream.set('Accept-Encoding', 'br, gzip, deflate');
upstream.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36');
upstream.set('Referer', 'https://polymarket.com/event/fed-decision-in-september');


// Forward conditional ETag from client when present (helps return 304s)
const clientIfNone = req.headers.get('if-none-match');
if (clientIfNone) upstream.set('If-None-Match', clientIfNone);


// Fetch upstream. This runs at the Vercel Edge when deployed there,
// so network/TLS is fast from the edge to the origin and responses can be cached.
const upstreamRes = await fetch(POLY_URL, {
method: 'GET',
headers: upstream,
// We rely on the edge to cache; don't force-cache here — we'll set caching on the response
// Note: keep the request small & fast; we don't send cookies or extra baggage.
});


// If origin returns 304, proxy that back (very small response)
if (upstreamRes.status === 304) {
return new Response(null, {
status: 304,
headers: {
'Cache-Control': 'public, max-age=10, s-maxage=60, stale-while-revalidate=120'
}
});
}


// Read body as ArrayBuffer (safe for binary) and build response
const buf = await upstreamRes.arrayBuffer();


// Copy useful headers but remove those unsuitable for proxying
const outHeaders = new Headers(upstreamRes.headers);
outHeaders.delete('set-cookie');
outHeaders.set('Cache-Control', 'public, max-age=10, s-maxage=60, stale-while-revalidate=120');
// Optional: expose that this came from our proxy
outHeaders.set('X-Proxy-By', 'your-app-polymarket-proxy');


return new Response(buf, { status: upstreamRes.status, headers: outHeaders });
}

