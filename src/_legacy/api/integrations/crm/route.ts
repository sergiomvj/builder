// CRM and Communication Integration API
import { NextRequest, NextResponse } from 'next/server';
import { CRMService } from '@/lib/api-gateway';

const crmService = new CRMService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, provider = 'hubspot' } = body;

    let response;

    switch (action) {
      case 'create_contact':
        const contact = {
          properties: {
            email: data.email,
            firstname: data.firstName,
            lastname: data.lastName,
            company: data.company,
            phone: data.phone,
            website: data.website,
            lifecyclestage: data.stage || 'lead'
          }
        };
        response = await crmService.createContact(contact, provider);
        break;

      case 'create_deal':
        const deal = {
          properties: {
            dealname: data.dealName,
            amount: data.amount,
            pipeline: data.pipeline || 'default',
            dealstage: data.stage || 'initial',
            closedate: data.closeDate
          },
          associations: data.contactId ? [{
            to: { id: data.contactId },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }]
          }] : []
        };
        response = await crmService.createContact(deal, provider);
        break;

      case 'send_whatsapp':
        const whatsappMessage = {
          messaging_product: 'whatsapp',
          to: data.to,
          type: data.type || 'text',
          text: data.type === 'text' ? { body: data.message } : undefined,
          template: data.type === 'template' ? {
            name: data.templateName,
            language: { code: data.language || 'pt_BR' },
            components: data.components
          } : undefined
        };
        response = await crmService.sendWhatsApp(whatsappMessage);
        break;

      case 'send_sms':
        // Integração com Twilio para SMS
        const smsData = {
          Body: data.message,
          From: process.env.TWILIO_PHONE_NUMBER,
          To: data.to
        };
        response = await crmService.createContact(smsData, 'salesforce'); // Usando endpoint genérico
        break;

      case 'create_task':
        const task = {
          properties: {
            hs_task_subject: data.subject,
            hs_task_body: data.description,
            hs_task_status: 'NOT_STARTED',
            hs_task_priority: data.priority || 'MEDIUM',
            hs_task_type: data.type || 'TODO'
          }
        };
        response = await crmService.createContact(task, provider);
        break;

      case 'update_contact':
        const updateData = {
          properties: data.properties
        };
        response = await crmService.createContact(updateData, provider);
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
      'create_contact',
      'create_deal',
      'send_whatsapp',
      'send_sms',
      'create_task',
      'update_contact'
    ],
    supportedProviders: ['hubspot', 'salesforce'],
    communicationChannels: ['whatsapp', 'sms', 'email']
  });
}