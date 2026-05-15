import { NextResponse } from 'next/server';

function forwardedProtocol(request: Request): string {
  return request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'http';
}

function forwardedHost(request: Request): string | null {
  return request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() || request.headers.get('host');
}

export function requireSameOrigin(request: Request): NextResponse | null {
  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite === 'cross-site') {
    return NextResponse.json({ error: 'Недопустимый источник запроса' }, { status: 403 });
  }

  const origin = request.headers.get('origin');
  if (!origin) return null;

  const host = forwardedHost(request);
  if (!host) {
    return NextResponse.json({ error: 'Не удалось проверить источник запроса' }, { status: 400 });
  }

  const expected = `${forwardedProtocol(request)}://${host}`;
  if (origin !== expected) {
    return NextResponse.json({ error: 'Недопустимый источник запроса' }, { status: 403 });
  }

  return null;
}

export function requireWebhookToken(request: Request): NextResponse | null {
  const expected = process.env.HIKVISION_WEBHOOK_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: 'Webhook token is not configured' }, { status: 503 });
  }

  const received = request.headers.get('x-caravan-webhook-token');
  if (received !== expected) {
    return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 });
  }

  return null;
}
