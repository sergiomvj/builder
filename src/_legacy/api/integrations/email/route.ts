// Email Marketing Integration API
import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/api-gateway';

const emailService = new EmailService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, provider = 'sendgrid' } = body;

    let response;

    switch (action) {
      case 'send_campaign':
        const campaign = {
          personalizations: [{
            to: data.recipients,
            subject: data.subject
          }],
          from: {
            email: data.from || process.env.SENDGRID_FROM_EMAIL,
            name: data.fromName || 'VCM System'
          },
          content: [{
            type: 'text/html',
            value: data.htmlContent
          }]
        };
        response = await emailService.sendCampaign(campaign, provider);
        break;

      case 'create_template':
        const template = {
          name: data.name,
          subject: data.subject,
          html_content: data.htmlContent,
          plain_content: data.textContent || '',
          generation: 'dynamic'
        };
        response = await emailService.sendCampaign(template, provider);
        break;

      case 'send_transactional':
        const transactional = {
          to: [{ email: data.to }],
          from: { 
            email: data.from || process.env.SENDGRID_FROM_EMAIL,
            name: data.fromName || 'VCM System'
          },
          subject: data.subject,
          html: data.htmlContent,
          text: data.textContent
        };
        response = await emailService.sendCampaign(transactional, provider);
        break;

      case 'create_automation':
        const automation = {
          type: 'automation',
          settings: {
            title: data.title,
            from_name: data.fromName,
            reply_to: data.replyTo
          },
          recipients: {
            list_id: data.listId
          },
          trigger_settings: data.triggerSettings
        };
        response = await emailService.sendCampaign(automation, provider);
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
      'send_campaign',
      'create_template',
      'send_transactional', 
      'create_automation'
    ],
    supportedProviders: ['sendgrid', 'mailchimp']
  });
}