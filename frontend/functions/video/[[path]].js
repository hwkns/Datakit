export async function onRequest(context) {
  const url = new URL(context.request.url);
  const videoPath = url.pathname.replace('/video/', '');
  
  console.log('Video function called for:', videoPath);
  
  try {
    // Fetch from your R2 domain
    const response = await fetch(`https://assets.datakit.page/${videoPath}`);
    
    if (!response.ok) {
      return new Response('Video not found', { status: 404 });
    }
    
    // Clone headers and add CORP
    const headers = new Headers(response.headers);
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    headers.set('Access-Control-Allow-Origin', '*');
    
    console.log('Video proxy successful for:', videoPath);
    
    return new Response(response.body, {
      status: response.status,
      headers: headers,
    });
  } catch (error) {
    console.error('Video proxy error:', error);
    return new Response('Proxy error', { status: 500 });
  }
}