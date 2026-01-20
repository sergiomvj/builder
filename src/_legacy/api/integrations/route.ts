// API Routes para integração com APIs externas
import { NextRequest, NextResponse } from 'next/server';
import { 
  AIService, 
  EmailService, 
  CRMService, 
  PaymentService, 
  AutomationService, 
  AnalyticsService,
  apiGateway 
} from '@/lib/api-gateway';

const aiService = new AIService();
const emailService = new EmailService();
const crmService = new CRMService();
const paymentService = new PaymentService();
const automationService = new AutomationService();
const analyticsService = new AnalyticsService();

export async function GET() {
  try {
    const status = apiGateway.getAPIStatus();
    
    return NextResponse.json({
      success: true,
      data: {
        totalAPIs: Object.keys(status).length,
        categories: {
          ai: apiGateway.getAPIsByCategory('ai').length,
          email: apiGateway.getAPIsByCategory('email').length,
          crm: apiGateway.getAPIsByCategory('crm').length,
          finance: apiGateway.getAPIsByCategory('finance').length,
          automation: apiGateway.getAPIsByCategory('automation').length,
          analytics: apiGateway.getAPIsByCategory('analytics').length
        },
        apis: status
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}