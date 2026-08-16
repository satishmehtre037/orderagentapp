import { generateInvoicePdfBuffer, InvoiceData } from '../services/invoiceService.js';
import fs from 'fs';
import path from 'path';

async function testPdf() {
  console.log('🧪 Testing PDF Invoice Generation...');
  const sampleData: InvoiceData = {
    orderId: '5d7fc163-9cc7-4cc4-ab8c-8f33be9b9e70',
    businessName: 'CafeDay Artisan Coffee & Bakery',
    businessCategory: 'cafe',
    businessPhone: '+91 8108313063',
    gstNumber: '27AAAAA0000A1Z5',
    storeAddress: 'Shop 4, Station Road, Thane West, Mumbai - 400601',
    upiId: 'cafeday@okhdfcbank',
    customerNumber: '+919876543210',
    createdAt: new Date().toISOString(),
    type: 'order',
    status: 'confirmed',
    paymentStatus: 'paid',
    paidAt: new Date().toISOString(),
    items: [
      { name: 'Paneer Tikka Sandwich', quantity: 2, price: 120 },
      { name: 'Cold Brew Artisan Coffee', quantity: 1, price: 150 },
    ],
    totalAmount: 390,
    fulfillment: 'Delivery',
    deliveryAddress: 'Lokmanya Nagar, Thane West',
    notes: 'Please pack napkins and cutlery.',
  };

  const buffer = await generateInvoicePdfBuffer(sampleData);
  console.log(`✅ PDF Generated Successfully! Buffer size: ${buffer.byteLength} bytes.`);

  const outputPath = path.join(process.cwd(), 'sample_invoice.pdf');
  fs.writeFileSync(outputPath, buffer);
  console.log(`📄 Saved test invoice to: ${outputPath}`);
}

testPdf();
