// Automation Integration API
import { NextRequest, NextResponse } from 'next/server';
import { AutomationService } from '@/lib/api-gateway';

const automationService = new AutomationService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, provider = 'zapier' } = body;

    let response;

    switch (action) {
      case 'create_workflow':
        const workflow = {
          title: data.title,
          description: data.description,
          steps: data.steps,
          trigger: {
            type: data.trigger.type,
            app: data.trigger.app,
            event: data.trigger.event,
            config: data.trigger.config
          },
          actions: data.actions.map((action: any) => ({
            app: action.app,
            action: action.action,
            config: action.config,
            mapping: action.mapping
          }))
        };
        response = await automationService.createWorkflow(workflow, provider);
        break;

      case 'execute_workflow':
        const execution = {
          workflow_id: data.workflowId,
          input_data: data.inputData,
          context: data.context || {}
        };
        response = await automationService.createWorkflow(execution, provider);
        break;

      case 'create_webhook':
        const webhook = {
          name: data.name,
          url: data.url,
          events: data.events,
          secret: data.secret,
          active: true
        };
        response = await automationService.createWorkflow(webhook, provider);
        break;

      case 'schedule_task':
        const scheduledTask = {
          name: data.name,
          schedule: data.schedule, // cron expression
          action: data.action,
          parameters: data.parameters,
          timezone: data.timezone || 'America/Sao_Paulo'
        };
        response = await automationService.createWorkflow(scheduledTask, provider);
        break;

      case 'create_n8n_workflow':
        // Específico para N8N
        const n8nWorkflow = {
          name: data.name,
          nodes: data.nodes,
          connections: data.connections,
          settings: data.settings || {},
          staticData: data.staticData || {},
          active: data.active !== false
        };
        response = await automationService.createWorkflow(n8nWorkflow, 'make'); // Using make endpoint
        break;

      case 'bulk_automation':
        const bulkAutomation = {
          type: 'bulk',
          operations: data.operations,
          batch_size: data.batchSize || 100,
          delay_between_batches: data.delay || 1000
        };
        response = await automationService.createWorkflow(bulkAutomation, provider);
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
      'create_workflow',
      'execute_workflow',
      'create_webhook',
      'schedule_task',
      'create_n8n_workflow',
      'bulk_automation'
    ],
    supportedProviders: ['zapier', 'make', 'n8n'],
    triggerTypes: ['webhook', 'schedule', 'database_change', 'email_received', 'form_submission'],
    commonActions: ['send_email', 'create_record', 'update_record', 'send_notification', 'call_api']
  });
}