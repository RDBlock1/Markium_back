'use client';
import React from 'react';


export default function PolymarketDemoClient() {
const [data, setData] = React.useState<any>(null);
const [loading, setLoading] = React.useState(false);
React.useEffect(() => {
setLoading(true);
// Fetch the proxied route — since this runs from the browser, it can still be very fast
// because the API route itself is an edge function returning cached content.
fetch('/api/polymarket')
.then((r) => r.json())
.then((d) => setData(d))
.catch((e) => console.error(e))
.finally(() => setLoading(false));
}, []);


return (
<div style={{padding:20}}>
<h2>Polymarket quick preview</h2>
{loading && <div>Loading…</div>}
{data ? <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(data, null, 2)}</pre> : !loading && <div>No data</div>}
</div>
);
}