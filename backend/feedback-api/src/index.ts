import { Resend } from 'resend';

// Headers to enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env, ctx) {
    // Get the request URL and path
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Only process requests to /api/feedback
    if (path !== '/api/feedback') {
      return new Response('Not found', { 
        status: 404,
        headers: corsHeaders
      });
    }

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // Only allow POST for actual requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders,
      });
    }

    try {
      // Parse request body as JSON
      const body = await request.json();
      const { message, email, context } = body;

      // Validate input
      if (!message || typeof message !== 'string') {
        return new Response(JSON.stringify({ error: 'Message is required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      // Initialize Resend with API key from environment
      const resend = new Resend(env.RESEND_API_KEY);
      
      // Get user info
      const userEmail = email && typeof email === 'string' ? email : 'Anonymous user';
      const contextInfo = context || 'No context provided';
      const timestamp = new Date().toISOString();

      // Send email
      const { data, error } = await resend.emails.send({
        from: 'DataKit Feedback <feedback@datakit.page>',
        to: ['amin@datakit.page', 'luke@datakit.page'],
        subject: 'New DataKit Feedback',
        html: `
          <h2>New Feedback from DataKit</h2>
          <p><strong>From:</strong> ${userEmail}</p>
          <p><strong>Time:</strong> ${timestamp}</p>
          <p><strong>Context:</strong> ${contextInfo}</p>
          <hr />
          <h3>Feedback:</h3>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
      });

      if (error) {
        console.error('Resend API error:', error);
        return new Response(JSON.stringify({ error: 'Failed to send email' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      // Return success response
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    } catch (err) {
      console.error('Error processing request:', err);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
  },
};