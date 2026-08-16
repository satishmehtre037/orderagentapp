import { jsPDF } from 'jspdf';

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
 * Runs 100% in-memory with jsPDF (no filesystem .afm font dependencies on Vercel / serverless).
 */
export async function generateInvoicePdfBuffer(data: InvoiceData): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 35;
  const contentWidth = pageWidth - margin * 2;

  // Teal Palette & Fonts
  const tealPrimary = [15, 118, 110]; // #0f766e
  const tealLight = [240, 253, 250]; // #f0fdfa
  const tealBorder = [153, 246, 228]; // #99f6e4
  const darkInk = [31, 41, 55]; // #1f2937
  const mutedGray = [107, 114, 128]; // #6b7280
  const lightGrayBg = [249, 250, 251]; // #f9fafb

  // --- HEADER BANNER ---
  doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
  doc.roundedRect(margin, 30, contentWidth, 75, 4, 4, 'F');

  // Business Name & Subtitle
  doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(data.businessName || 'Business Store', margin + 15, 56);

  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`${(data.businessCategory || 'Store').toUpperCase()} • VERIFIED WHATSAPP COMMERCE`, margin + 15, 72);

  if (data.gstNumber) {
    doc.text(`GSTIN / Tax ID: ${data.gstNumber}`, margin + 15, 86);
  }

  // Top Right: Invoice Meta
  const invoiceCode = `INV-${new Date(data.createdAt).getFullYear()}-${data.orderId.slice(0, 6).toUpperCase()}`;
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TAX INVOICE / RECEIPT', pageWidth - margin - 15, 52, { align: 'right' });

  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Bill No: ${invoiceCode}`, pageWidth - margin - 15, 66, { align: 'right' });
  doc.text(
    `Date: ${new Date(data.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    pageWidth - margin - 15,
    78,
    { align: 'right' }
  );
  doc.text(
    `Time: ${new Date(data.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
    pageWidth - margin - 15,
    90,
    { align: 'right' }
  );

  // --- 2 COLUMNS: CUSTOMER & PAYMENT DETAILS ---
  const boxY = 120;
  const boxWidth = (contentWidth - 15) / 2;
  const boxHeight = 80;

  // Left Box: Customer Info
  doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
  doc.roundedRect(margin, boxY, boxWidth, boxHeight, 3, 3, 'F');

  doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('BILLED TO (CUSTOMER):', margin + 10, boxY + 16);

  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Phone: ${data.customerNumber || 'N/A'}`, margin + 10, boxY + 30);
  doc.text(`Fulfillment: ${data.fulfillment || 'Delivery / Pickup'}`, margin + 10, boxY + 44);

  const addressText = data.deliveryAddress ? `Address: ${data.deliveryAddress}` : 'Address: Store Counter / Walk-in';
  const splitAddress = doc.splitTextToSize(addressText, boxWidth - 20);
  doc.text(splitAddress, margin + 10, boxY + 58);

  // Right Box: Payment & Store Details
  const rightBoxX = margin + boxWidth + 15;
  doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
  doc.roundedRect(rightBoxX, boxY, boxWidth, boxHeight, 3, 3, 'F');

  doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PAYMENT & STORE INFO:', rightBoxX + 10, boxY + 16);

  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Store Contact: ${data.businessPhone || 'Via WhatsApp'}`, rightBoxX + 10, boxY + 30);
  doc.text(`UPI VPA: ${data.upiId || 'Counter / Cash'}`, rightBoxX + 10, boxY + 44);

  const isPaid = data.paymentStatus === 'paid';
  if (isPaid) {
    doc.setTextColor(5, 150, 105); // emerald
    doc.setFont('helvetica', 'bold');
    doc.text('Status: PAID VIA UPI [VERIFIED]', rightBoxX + 10, boxY + 58);
  } else {
    doc.setTextColor(217, 119, 6); // amber
    doc.setFont('helvetica', 'bold');
    doc.text('Status: PAYMENT PENDING', rightBoxX + 10, boxY + 58);
  }

  // --- ITEMIZATION TABLE ---
  let tableY = 220;
  const tableHeaderHeight = 22;

  // Header Row
  doc.setFillColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.rect(margin, tableY, contentWidth, tableHeaderHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('#', margin + 10, tableY + 14);
  doc.text('ITEM / SERVICE DESCRIPTION', margin + 35, tableY + 14);
  doc.text('QTY', margin + 310, tableY + 14, { align: 'center' });
  doc.text('RATE (INR)', margin + 390, tableY + 14, { align: 'right' });
  doc.text('TOTAL (INR)', margin + contentWidth - 12, tableY + 14, { align: 'right' });

  tableY += tableHeaderHeight;

  // Table Body Rows
  const items = data.items && data.items.length > 0 ? data.items : [{ name: data.notes || 'Order / Booking Item', quantity: 1, price: data.totalAmount }];

  items.forEach((item, index) => {
    const rowHeight = 20;
    const isEven = index % 2 === 0;
    if (!isEven) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, tableY, contentWidth, rowHeight, 'F');
    }

    doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    const itemTotal = (item.price || 0) * (item.quantity || 1);
    doc.text(String(index + 1), margin + 10, tableY + 13);
    doc.text(item.name || 'Store Item', margin + 35, tableY + 13);
    doc.text(String(item.quantity || 1), margin + 310, tableY + 13, { align: 'center' });
    doc.text(`Rs. ${item.price || 0}`, margin + 390, tableY + 13, { align: 'right' });
    doc.text(`Rs. ${itemTotal}`, margin + contentWidth - 12, tableY + 13, { align: 'right' });

    tableY += rowHeight;
  });

  // Table Bottom Divider
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(1);
  doc.line(margin, tableY, margin + contentWidth, tableY);

  tableY += 15;

  // --- SUMMARY / TOTALS BOX ---
  const calcBoxWidth = 200;
  const calcBoxX = margin + contentWidth - calcBoxWidth;
  const calcBoxY = tableY;

  // Paid Stamp on Left of Summary Box
  if (isPaid) {
    doc.setFillColor(236, 253, 245); // emerald light
    doc.setDrawColor(167, 243, 208); // emerald border
    doc.roundedRect(margin, calcBoxY, 160, 54, 3, 3, 'FD');

    doc.setTextColor(5, 150, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('PAYMENT VERIFIED', margin + 12, calcBoxY + 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(4, 120, 87);
    doc.text('Received & settled via UPI', margin + 12, calcBoxY + 36);
    if (data.paidAt) {
      doc.text(`On: ${new Date(data.paidAt).toLocaleDateString('en-IN')}`, margin + 12, calcBoxY + 46);
    }
  }

  doc.setFillColor(tealLight[0], tealLight[1], tealLight[2]);
  doc.setDrawColor(tealBorder[0], tealBorder[1], tealBorder[2]);
  doc.roundedRect(calcBoxX, calcBoxY, calcBoxWidth, 54, 3, 3, 'FD');

  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Subtotal:', calcBoxX + 12, calcBoxY + 18);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text(`Rs. ${data.totalAmount}`, calcBoxX + calcBoxWidth - 12, calcBoxY + 18, { align: 'right' });

  doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('GRAND TOTAL:', calcBoxX + 12, calcBoxY + 40);
  doc.setFontSize(12);
  doc.text(`Rs. ${data.totalAmount}`, calcBoxX + calcBoxWidth - 12, calcBoxY + 40, { align: 'right' });

  // --- FOOTER & SIGN-OFF ---
  const footerY = 760;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(1);
  doc.line(margin, footerY, margin + contentWidth, footerY);

  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    'This is a computer-generated tax invoice issued via WhatsApp Business AI.',
    pageWidth / 2,
    footerY + 14,
    { align: 'center' }
  );
  doc.text(
    `Thank you for doing business with ${data.businessName}! For questions, contact ${data.businessPhone || 'support'}.`,
    pageWidth / 2,
    footerY + 26,
    { align: 'center' }
  );
  doc.text(
    'Powered by BizBot OS • WhatsApp Commerce Cloud',
    pageWidth / 2,
    footerY + 38,
    { align: 'center' }
  );

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
