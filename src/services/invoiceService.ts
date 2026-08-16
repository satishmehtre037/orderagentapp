import PDFDocument from 'pdfkit';

export interface InvoiceData {
  orderId: string;
  businessName: string;
  businessCategory: string;
  businessPhone: string;
  gstNumber?: string;
  storeAddress?: string;
  upiId?: string;
  customerNumber: string;
  createdAt: string;
  type: string;
  status: string;
  paymentStatus: 'paid' | 'pending' | string;
  paidAt?: string;
  items: Array<{ name: string; quantity: number; price?: number }>;
  totalAmount: number;
  fulfillment: string;
  deliveryAddress?: string;
  notes?: string;
}

/**
 * Generates a high-quality, professional, vector-styled PDF invoice/booking slip buffer
 */
export async function generateInvoicePdfBuffer(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Invoice - ${data.orderId.slice(0, 8).toUpperCase()}`,
          Author: data.businessName,
          Subject: 'Official Purchase Invoice / Booking Slip',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#0f766e'; // Teal
      const darkColor = '#1f2937';
      const grayColor = '#6b7280';
      const lightBg = '#f3f4f6';

      // --- HEADER SECTION ---
      doc.rect(40, 40, 515, 75).fill('#f8fafc');

      doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold').text(data.businessName, 55, 55);
      doc.fillColor(grayColor).fontSize(9).font('Helvetica')
        .text(`${data.businessCategory.toUpperCase()} • BIZBOT OS VERIFIED STORE`, 55, 80);

      if (data.gstNumber) {
        doc.text(`GSTIN: ${data.gstNumber}`, 55, 93);
      }

      // Top Right Invoice Meta
      const invoiceCode = `INV-${new Date(data.createdAt).getFullYear()}-${data.orderId.slice(0, 6).toUpperCase()}`;
      doc.fillColor(darkColor).fontSize(12).font('Helvetica-Bold').text('OFFICIAL INVOICE', 380, 55, { align: 'right' });
      doc.fillColor(grayColor).fontSize(9).font('Helvetica')
        .text(`Bill No: ${invoiceCode}`, 380, 72, { align: 'right' })
        .text(`Date: ${new Date(data.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 380, 85, { align: 'right' })
        .text(`Time: ${new Date(data.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, 380, 98, { align: 'right' });

      doc.moveDown(3);

      // --- BILL TO & STORE DETAILS ---
      const billToY = 135;
      doc.rect(40, billToY, 250, 75).fill(lightBg);
      doc.rect(305, billToY, 250, 75).fill(lightBg);

      // Left Box: Customer Details
      doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold').text('BILLED TO (CUSTOMER):', 50, billToY + 10);
      doc.fillColor(darkColor).fontSize(9).font('Helvetica')
        .text(`Phone: ${data.customerNumber}`, 50, billToY + 25)
        .text(`Fulfillment: ${data.fulfillment || 'In-store / Delivery'}`, 50, billToY + 38)
        .text(`Address: ${data.deliveryAddress || 'Store Pickup / Counter'}`, 50, billToY + 51, { width: 230 });

      // Right Box: Payment & Store Status
      doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold').text('PAYMENT & STORE DETAILS:', 315, billToY + 10);
      doc.fillColor(darkColor).fontSize(9).font('Helvetica')
        .text(`Store Contact: ${data.businessPhone || 'Via WhatsApp'}`, 315, billToY + 25)
        .text(`UPI VPA: ${data.upiId || 'Counter / Cash'}`, 315, billToY + 38);

      const isPaid = data.paymentStatus === 'paid';
      doc.fillColor(isPaid ? '#059669' : '#d97706').font('Helvetica-Bold')
        .text(`Status: ${isPaid ? 'PAID VIA UPI ✅' : 'PAYMENT PENDING ⏳'}`, 315, billToY + 51);

      // --- ITEMIZATION TABLE ---
      let tableY = 230;
      doc.rect(40, tableY, 515, 24).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
      doc.text('#', 50, tableY + 7);
      doc.text('ITEM / SERVICE DESCRIPTION', 80, tableY + 7);
      doc.text('QTY', 360, tableY + 7, { align: 'center' });
      doc.text('PRICE (INR)', 420, tableY + 7, { align: 'right' });
      doc.text('TOTAL (INR)', 485, tableY + 7, { align: 'right' });

      tableY += 24;

      if (data.items && data.items.length > 0) {
        data.items.forEach((item, index) => {
          const itemTotal = (item.price || 0) * (item.quantity || 1);
          const rowBg = index % 2 === 0 ? '#ffffff' : '#f9fafb';
          doc.rect(40, tableY, 515, 22).fill(rowBg);

          doc.fillColor(darkColor).fontSize(9).font('Helvetica');
          doc.text(String(index + 1), 50, tableY + 6);
          doc.text(item.name || 'Store Item', 80, tableY + 6, { width: 270 });
          doc.text(String(item.quantity || 1), 360, tableY + 6, { align: 'center' });
          doc.text(`₹${item.price || 0}`, 420, tableY + 6, { align: 'right' });
          doc.text(`₹${itemTotal}`, 485, tableY + 6, { align: 'right' });

          tableY += 22;
        });
      } else {
        // Fallback row for single service / notes
        doc.rect(40, tableY, 515, 22).fill('#ffffff');
        doc.fillColor(darkColor).fontSize(9).font('Helvetica');
        doc.text('1', 50, tableY + 6);
        doc.text(data.notes || 'Custom Order / Booking', 80, tableY + 6);
        doc.text('1', 360, tableY + 6, { align: 'center' });
        doc.text(`₹${data.totalAmount}`, 420, tableY + 6, { align: 'right' });
        doc.text(`₹${data.totalAmount}`, 485, tableY + 6, { align: 'right' });
        tableY += 22;
      }

      // Divider Line
      doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(40, tableY).lineTo(555, tableY).stroke();
      tableY += 15;

      // --- TOTALS CALCULATION BOX ---
      const totalBoxY = tableY;
      doc.rect(340, totalBoxY, 215, 60).fill('#f0fdfa');
      doc.rect(340, totalBoxY, 215, 60).strokeColor('#99f6e4').stroke();

      doc.fillColor(grayColor).fontSize(9).font('Helvetica').text('Subtotal:', 355, totalBoxY + 12);
      doc.fillColor(darkColor).text(`₹${data.totalAmount}`, 485, totalBoxY + 12, { align: 'right' });

      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('GRAND TOTAL:', 355, totalBoxY + 34);
      doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text(`₹${data.totalAmount}`, 465, totalBoxY + 32, { align: 'right' });

      // --- FOOTER & SIGN-OFF ---
      const footerY = 700;
      doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(40, footerY).lineTo(555, footerY).stroke();

      doc.fillColor(grayColor).fontSize(8).font('Helvetica')
        .text('This is a computer-generated tax invoice issued via WhatsApp Business AI.', 40, footerY + 10, { align: 'center' })
        .text(`Thank you for doing business with ${data.businessName}! For queries, contact ${data.businessPhone || 'support'}.`, 40, footerY + 22, { align: 'center' })
        .text('Powered by BizBot OS • WhatsApp Commerce Cloud', 40, footerY + 34, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
