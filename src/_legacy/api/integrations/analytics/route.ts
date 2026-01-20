// Analytics Integration API
import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/api-gateway';

const analyticsService = new AnalyticsService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, provider = 'google-analytics' } = body;

    let response;

    switch (action) {
      case 'get_website_analytics':
        const websiteQuery = {
          reportRequests: [{
            viewId: data.viewId,
            dateRanges: [{ startDate: data.startDate, endDate: data.endDate }],
            metrics: [
              { expression: 'ga:sessions' },
              { expression: 'ga:users' },
              { expression: 'ga:pageviews' },
              { expression: 'ga:bounceRate' }
            ],
            dimensions: [{ name: 'ga:date' }]
          }]
        };
        response = await analyticsService.getAnalytics(websiteQuery, provider);
        break;

      case 'track_event':
        const eventData = {
          name: data.eventName,
          parameters: {
            event_category: data.category,
            event_label: data.label,
            value: data.value,
            custom_parameters: data.customParameters || {}
          }
        };
        response = await analyticsService.getAnalytics(eventData, provider);
        break;

      case 'get_conversion_funnel':
        const funnelQuery = {
          steps: data.steps,
          dateRange: data.dateRange,
          segmentation: data.segmentation || {},
          breakdown: data.breakdown || []
        };
        response = await analyticsService.getAnalytics(funnelQuery, provider);
        break;

      case 'get_user_behavior':
        const behaviorQuery = {
          metrics: ['sessions', 'bounceRate', 'sessionDuration'],
          dimensions: ['source', 'medium', 'deviceCategory'],
          dateRange: data.dateRange,
          filters: data.filters || []
        };
        response = await analyticsService.getAnalytics(behaviorQuery, provider);
        break;

      case 'create_custom_report':
        const customReport = {
          name: data.reportName,
          metrics: data.metrics,
          dimensions: data.dimensions,
          dateRange: data.dateRange,
          filters: data.filters || [],
          segments: data.segments || [],
          schedule: data.schedule || null
        };
        response = await analyticsService.getAnalytics(customReport, provider);
        break;

      case 'track_ecommerce':
        const ecommerceData = {
          transaction_id: data.transactionId,
          value: data.value,
          currency: data.currency || 'BRL',
          items: data.items.map((item: any) => ({
            item_id: item.id,
            item_name: item.name,
            category: item.category,
            quantity: item.quantity,
            price: item.price
          }))
        };
        response = await analyticsService.getAnalytics(ecommerceData, provider);
        break;

      case 'get_real_time_analytics':
        const realTimeQuery = {
          metrics: ['rt:activeUsers', 'rt:pageviews'],
          dimensions: ['rt:country', 'rt:deviceCategory'],
          maxResults: data.maxResults || 100
        };
        response = await analyticsService.getAnalytics(realTimeQuery, provider);
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Ação não reconhecida'
        }, { status: 400 });
    }

    return NextResponse.json(response);

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    availableActions: [
      'get_website_analytics',
      'track_event',
      'get_conversion_funnel',
      'get_user_behavior',
      'create_custom_report',
      'track_ecommerce',
      'get_real_time_analytics'
    ],
    supportedProviders: ['google-analytics', 'mixpanel', 'facebook-analytics'],
    standardMetrics: [
      'sessions', 'users', 'pageviews', 'bounceRate', 'sessionDuration',
      'conversions', 'revenue', 'transactionRate'
    ],
    standardDimensions: [
      'date', 'source', 'medium', 'campaign', 'deviceCategory', 
      'browser', 'country', 'city', 'userType'
    ]
  });
}