// Payment Integration API
import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/api-gateway';

const paymentService = new PaymentService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, provider = 'stripe' } = body;

    let response;

    switch (action) {
      case 'create_payment_intent':
        const paymentIntent = {
          amount: Math.round(data.amount * 100), // Convert to cents
          currency: data.currency || 'brl',
          metadata: {
            customer_id: data.customerId,
            order_id: data.orderId
          },
          automatic_payment_methods: {
            enabled: true
          }
        };
        response = await paymentService.createPayment(paymentIntent, provider);
        break;

      case 'create_subscription':
        const subscription = {
          customer: data.customerId,
          items: [{
            price: data.priceId,
            quantity: data.quantity || 1
          }],
          metadata: data.metadata || {}
        };
        response = await paymentService.createPayment(subscription, provider);
        break;

      case 'process_refund':
        const refund = {
          payment_intent: data.paymentIntentId,
          amount: data.amount ? Math.round(data.amount * 100) : undefined,
          reason: data.reason || 'requested_by_customer'
        };
        response = await paymentService.createPayment(refund, provider);
        break;

      case 'create_customer':
        const customer = {
          email: data.email,
          name: data.name,
          phone: data.phone,
          address: data.address,
          metadata: data.metadata || {}
        };
        response = await paymentService.createPayment(customer, provider);
        break;

      case 'create_pix_payment':
        // Specifically for Brazilian PIX payments (Mercado Pago)
        const pixPayment = {
          transaction_amount: data.amount,
          description: data.description,
          payment_method_id: 'pix',
          payer: {
            email: data.payerEmail,
            first_name: data.payerFirstName,
            last_name: data.payerLastName,
            identification: {
              type: data.identificationType || 'CPF',
              number: data.identificationNumber
            }
          }
        };
        response = await paymentService.createPayment(pixPayment, 'mercadopago');
        break;

      case 'create_boleto':
        // Brazilian Boleto payment
        const boleto = {
          transaction_amount: data.amount,
          description: data.description,
          payment_method_id: 'bolbradesco',
          payer: {
            email: data.payerEmail,
            first_name: data.payerFirstName,
            last_name: data.payerLastName,
            identification: {
              type: data.identificationType || 'CPF',
              number: data.identificationNumber
            }
          },
          date_of_expiration: data.expirationDate
        };
        response = await paymentService.createPayment(boleto, 'mercadopago');
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
      'create_payment_intent',
      'create_subscription',
      'process_refund',
      'create_customer',
      'create_pix_payment',
      'create_boleto'
    ],
    supportedProviders: ['stripe', 'paypal', 'mercadopago'],
    paymentMethods: {
      stripe: ['card', 'bank_transfer', 'wallet'],
      mercadopago: ['pix', 'boleto', 'card', 'bank_transfer'],
      paypal: ['paypal', 'card']
    }
  });
}