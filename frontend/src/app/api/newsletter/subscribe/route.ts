import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/newsletter/subscribe
 * Subscribes an email to Mailchimp (if configured) or stores locally as fallback.
 *
 * Environment variables (set in .env):
 *   MAILCHIMP_API_KEY   — your Mailchimp API key (e.g. "abcd1234-us12")
 *   MAILCHIMP_LIST_ID   — the audience/list ID to subscribe to
 *   MAILCHIMP_DC        — data center, e.g. "us12" (derived from API key suffix if not set)
 *
 * If Mailchimp is not configured, the email is stored in the local DB
 * (site_settings table with key "subscriber:<email>") as a fallback.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const apiKey = process.env.MAILCHIMP_API_KEY;
    const listId = process.env.MAILCHIMP_LIST_ID;

    // If Mailchimp is configured, subscribe via API
    if (apiKey && listId) {
      const dc = process.env.MAILCHIMP_DC || apiKey.split('-').pop();
      const res = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
        },
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed',
          tags: ['website-signup'],
        }),
      });

      if (res.status === 400) {
        const data = await res.json();
        if (data?.title?.includes('Already')) {
          return NextResponse.json({ success: true, message: 'You\'re already subscribed!' });
        }
        return NextResponse.json({ error: data?.detail || 'Subscription failed' }, { status: 400 });
      }
      if (!res.ok) {
        return NextResponse.json({ error: 'Mailchimp error' }, { status: 502 });
      }
      return NextResponse.json({ success: true, message: 'Subscribed to Mailchimp!' });
    }

    // Fallback: store locally in the DB
    try {
      const { db } = await import('@/lib/db');
      const key = `subscriber:${email.toLowerCase()}`;
      await db.siteSetting.upsert({
        where: { key },
        update: {},
        create: { key, value: new Date().toISOString() },
      });
      return NextResponse.json({ success: true, message: 'Subscribed! (connect Mailchimp in .env for email campaigns)' });
    } catch {
      return NextResponse.json({ success: true, message: 'Subscribed!' });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
