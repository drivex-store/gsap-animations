import { NextResponse } from 'next/server';

const PPP_RATES = {
  MM: { discount: 0.5, currency: 'USD', symbol: '$' },
  IN: { discount: 0.4, currency: 'USD', symbol: '$' },
  GB: { discount: 0.1, currency: 'GBP', symbol: '£' },
  EU: { discount: 0.1, currency: 'EUR', symbol: '€' },
  US: { discount: 0.0, currency: 'USD', symbol: '$' },
};

export async function GET(request) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '';

    let country = request.headers.get('x-vercel-ip-country') || 'US';

    if (clientIp === '127.0.0.1' || clientIp === '::1') {
      country = 'US';
    }

    const pppData = PPP_RATES[country] || { discount: 0.0, currency: 'USD', symbol: '$' };

    return NextResponse.json(
      {
        success: true,
        country,
        ip: clientIp || 'unknown',
        ...pppData,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        country: 'US',
        discount: 0.0,
        currency: 'USD',
        symbol: '$',
      },
      { status: 200 },
    );
  }
}
