import React, { useState, useEffect, useRef } from 'react';
import { FileText, CheckCircle2, Clock, Plus, Search, Filter, RefreshCw, Send, ExternalLink, XCircle, Trash2, ChevronDown, Check, Sparkles } from 'lucide-react';
import type { CADocumentTracker, CADocStatus } from '@/types';

interface CADocumentsTabProps {
  businessId?: string;
  businessName?: string;
}

export default function CADocumentsTab({ businessId, businessName }: CADocumentsTabProps) {
  const [documents, setDocuments] = useState<CADocumentTracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Comprehensive Statutory CA Compliance Document Presets Dictionary
  const COMPLIANCE_DOC_PRESETS: Record<string, string[]> = {
    // 🧾 GST Returns & Compliance
    'GST-3B': [
      'Sales Register / Outward Tax Invoices for the Month',
      'Purchase Register & Input Tax Credit (ITC) Bills',
      'Bank Statements for the Tax Period',
      'Tax Payment Challans / Cash Ledger Summary',
    ],
    'GSTR-1': [
      'B2B Sales Invoices with GSTIN & HSN Codes',
      'B2C Summary Invoices (State-wise Breakup)',
      'Credit & Debit Notes Issued',
      'Export Invoices / SEZ Supply Documents (with/without payment)',
    ],
    'GSTR-9': [
      'Audited Financial Statements (Balance Sheet & P&L)',
      'Monthly GSTR-1 vs GSTR-3B vs Books Reconciliation Statement',
      'GSTR-2B Input Tax Credit (ITC) Annual Summary',
      'Form 9C Reconciliation Statement & Auditor Certification',
    ],
    'GST-Registration': [
      'PAN & Aadhaar Card of Promoters / Partners / Directors',
      'Electricity Bill / Property Tax Receipt of Principal Business Place',
      'Rent Agreement & NOC from Property Owner',
      'Bank Account Proof (Cancelled Cheque / Front Page Statement)',
      'Certificate of Incorporation / Partnership Deed / MOA & AOA',
    ],
    'GST-LUT': [
      'GST Registration Certificate & Previous LUT Details',
      'KYC (PAN & Aadhaar) of Authorized Signatory & 2 Witnesses',
      'IEC (Import Export Code) Copy',
    ],
    'GST-Notice': [
      'Copy of GST Notice received (Form DRC-01 / ASMT-10 / SCN)',
      'Relevant Invoices, E-Way Bills & Delivery Challans in Dispute',
      'GSTR-2B vs GSTR-3B ITC Reconciliation for the Period',
      'Written Submissions / Factual Justification Note',
    ],

    // 📊 Income Tax & ITR Filings
    'ITR-1': [
      'Form 16 (Part A & Part B) from all Employers for the FY',
      'Form 26AS & Annual Information Statement (AIS/TIS)',
      'Bank Account Statements (All Savings / Current accounts for full FY)',
      'Chapter VI-A Deductions Proofs (80C LIC/PPF, 80D Mediclaim, 80E, 80G)',
      'Housing Loan Interest Certificate (for Self-Occupied property)',
    ],
    'ITR-2': [
      'Capital Gains Statement from Mutual Funds / Stock Brokers (CAMS/Zerodha)',
      'Property Purchase & Sale Deeds with Stamp Duty Valuations',
      'Form 16, Form 26AS, AIS/TIS and Foreign Asset/Income disclosures',
      'Bank Statements (All accounts active during the FY)',
    ],
    'ITR-3': [
      'Balance Sheet & Profit & Loss Statement of Proprietary Business / Profession',
      'Form 26AS & AIS / TIS Summary',
      'Bank Statements for Business and Personal Accounts for full FY',
      'Advance Tax & Self-Assessment Tax Challan Receipts',
      'Depreciation & Capital Expenditure Bills',
    ],
    'ITR-4': [
      'Bank Statements (Last 12 Months for FY)',
      'Gross Receipts / Total Turnover Calculation (under Sec 44AD / 44ADA)',
      'Form 26AS & AIS / TIS Summary',
      'Advance Tax & Self-Assessment Tax Payment Challans',
    ],
    'ITR-5': [
      'Audited / Final Balance Sheet & P&L of Partnership Firm / LLP',
      'Partnership Deed / LLP Agreement with Partner Profit Sharing & Remuneration Ratio',
      'Form 26AS, AIS/TIS & TDS Certificates (Form 16A)',
      'Partner Capital Account Ledgers and Drawings Statements',
    ],
    'ITR-6': [
      'Audited Balance Sheet & Profit & Loss Statement with All Schedules',
      'Tax Audit Report (Form 3CA/3CB-3CD)',
      'Corporate Form 26AS & AIS Reconciliation Report',
      'Advance Tax Payment Receipts / Challans (Q1 to Q4)',
      'Depreciation Schedule & Fixed Asset Addition / Deletion Invoices',
      'Details of Shareholders owning > 10% voting power',
    ],
    'ITR-7': [
      'Audited Financial Statements & Audit Report under Section 10B/10BB',
      'Trust Deed / Registration Certificate under Section 12A/12AB / 80G',
      'FCRA Registration & Bank Statements (if foreign contributions received)',
      'Details of Accumulation of Income (Form 9A / Form 10)',
    ],
    'Advance-Tax-Q1': [
      'Estimated Profit & Loss Summary for Q1 (April - June)',
      'GST Sales & Purchase Registers for Q1',
      'TDS Deducted by Clients / Form 26AS Q1 Summary',
    ],
    'Advance-Tax-Q2': [
      'Cumulative Financials & Estimated Turnover for H1 (April - Sept)',
      'Form 26AS TDS Credit Verified',
      'Prior Q1 Advance Tax Paid Challan',
    ],
    'Advance-Tax-Q3': [
      'Cumulative Financials for 9 Months (April - Dec)',
      'Form 26AS TDS Reconciliation',
      'Prior Q1 & Q2 Advance Tax Paid Challans',
    ],
    'Advance-Tax-Q4': [
      'Estimated Full Year Financial Figures (April - March)',
      'Form 26AS TDS Complete Reconciliation',
      'Prior Advance Tax Paid Challans (Q1, Q2, Q3)',
    ],
    'IT-Notice': [
      'Copy of Income Tax Notice received (Sec 143(1), 143(2), 148, or 139(9))',
      'Original ITR Acknowledgement & Computation of Total Income for the AY',
      'Bank Statements, Asset Invoices, and Source of Investment Explanations',
      'Draft Written Reply / Reconciliation Note',
    ],

    // 💸 TDS & Withholding Tax
    'TDS-26Q': [
      'Vendor Payment Register with TDS Deducted (Sec 194C, 194J, 194I, 194H)',
      'TDS Payment Challans (BSR Code, Challan No., CIN, Amount)',
      'PAN of all Vendor Deductees with Concessional 197 Certificates (if any)',
    ],
    'TDS-24Q': [
      'Monthly Salary Register & TDS Deducted from Employees',
      'Salary TDS Challan Payment Receipts',
      'Investment Proofs & Declarations submitted by Employees (Form 12BB)',
      'PAN of all Employees',
    ],
    'TDS-27Q': [
      'Foreign Remittance / Non-Resident Invoices & Form 15CA/CB',
      'TDS Challans for Remittance to Foreign Vendors / NRIs',
      'Tax Residency Certificate (TRC) and Form 10F (for DTAA benefits)',
    ],
    'TCS-27EQ': [
      'Sales Ledger with TCS Collected (Sec 206C / 206C(1H) / Scrap / LRS)',
      'TCS Payment Challan Receipts',
      'PAN / Aadhaar of all Buyers / Collectees',
    ],

    // 🏛️ MCA / ROC & Corporate Secretarial
    'ROC-AOC4': [
      'Audited Balance Sheet, Profit & Loss Account & Cash Flow Statement',
      'Notes to Accounts & Significant Accounting Policies',
      'Auditor’s Report with Annexure (CARO if applicable)',
      'Directors’ Report with Disclosures & Secretarial Audit (if applicable)',
      'Notice & Minutes of Annual General Meeting (AGM)',
    ],
    'ROC-MGT7': [
      'List of Shareholders and Debenture Holders as on FY End',
      'Details of Share Transfers, Allotments, and Buyback during FY',
      'Details of Board Meetings and General Meetings held with attendance',
      'Remuneration details of Directors & Key Managerial Personnel (KMP)',
    ],
    'ROC-Filing': [
      'Audited Financial Statements (Balance Sheet & P&L)',
      'Directors’ Report & Board Resolutions for AGM',
      'Shareholding Pattern & List of Transfers (Form MGT-7)',
      'Auditor’s Report with Notes to Accounts (Form AOC-4)',
      'Active DSC (Digital Signature Certificate) of Directors',
    ],
    'Company-Incorporation': [
      'PAN & Aadhaar Card of all Proposed Directors & Subscribers',
      'Identity Proof (Passport / Voter ID / Driving License) of Directors',
      'Residential Address Proof (Bank Statement / Utility Bill < 2 Months old)',
      'Registered Office Proof (Electricity Bill + NOC + Rent Agreement)',
      'Proposed Company Names (in order of preference) & Main Object Clause',
      'Passport Size Photographs & Specimen Signatures',
    ],
    'LLP-Incorporation': [
      'PAN & Aadhaar Card of Designated Partners',
      'Address Proof of Partners (Bank Statement < 2 Months old)',
      'Registered Office Address Proof (Utility Bill + NOC + Rent Deed)',
      'Proposed LLP Name & Business Objectives',
      'Draft LLP Agreement specifying contribution & profit-sharing ratios',
    ],
    'DIR-3-KYC': [
      'PAN Card of Director (with matching DOB & Name)',
      'Aadhaar Card of Director (linked with active mobile for OTP)',
      'Personal Mobile Number & Personal Email Address',
      'Passport (mandatory if Director is Foreign National or holds Passport)',
    ],
    'DPT-3': [
      'Audited Balance Sheet & Outstanding Loan / Deposit Ledgers',
      'Auditor’s Certificate on Deposits & Exempted Loans',
      'List of Secured / Unsecured Loans received from Directors / Entities',
    ],
    'MSME-Form-1': [
      'List of MSME Vendors with Dues Outstanding > 45 Days as on half-year end',
      'Vendor Invoices, Delivery Challans, and Reasons for Delay in Payment',
    ],
    'ROC-Change': [
      'Board Resolution approving Director Appointment / Resignation / Office Shift',
      'Consent Form DIR-2 & Declaration in Form DIR-8 from New Director',
      'Resignation Letter from Outgoing Director',
      'New Registered Office Utility Bill + NOC + Rent Agreement (for INC-22)',
    ],

    // 💼 Audit & Assurance
    'Tax-Audit': [
      'Final Trial Balance & General Ledgers with Grouping',
      'Closing Stock Valuation Report & Physical Inventory Summary',
      'Depreciation Schedule & Fixed Asset Purchase Invoices',
      'Form 26AS & TDS 26Q Reconciliation Sheet',
      'List of Loans / Deposits Accepted & Repaid > ₹20,000 (Sec 269SS & 269T)',
      'Quantitative Details of Raw Materials & Finished Goods',
    ],
    'Statutory-Audit': [
      'Draft Financial Statements & Trial Balance',
      'Bank Reconciliation Statements (BRS) for all Bank Accounts as of March 31',
      'Debtors & Creditors Confirmation Letters / Ledgers',
      'Statutory Dues Payment Receipts (GST, TDS, EPF, ESIC, PT)',
      'Internal Control & Fixed Asset Physical Verification Reports',
    ],
    'Internal-Audit': [
      'Standard Operating Procedures (SOPs) for Sales, Purchase, and HR',
      'Internal Delegation of Financial Powers & Approval Matrix',
      'Sample Invoices, Purchase Orders (PO), and Goods Receipt Notes (GRN)',
      'Inventory Stock Registers & Variance Analysis Reports',
    ],
    'Stock-Audit': [
      'Stock Ledger / Inventory Register as on Audit Date',
      'Physical Inventory Count Sheets with Warehouse Manager Sign-off',
      'Ageing Analysis of Slow-moving and Obsolete Stock',
      'Stock Insurance Policy Copy with Adequate Bank Hypothecation Clause',
    ],

    // 🚀 Startup, Licensing & Advisory
    'Startup-India': [
      'Certificate of Incorporation / LLP Registration',
      'Pitch Deck / Video Link demonstrating Innovation & Scalability',
      'Patent / Trademark Applications (if filed)',
      'Letter of Recommendation / Note on Job Creation & Wealth Generation',
    ],
    'MSME-Udyam': [
      'Aadhaar Card of Business Proprietor / Director / Partner',
      'PAN Card of Business Enterprise',
      'Bank Account Details (IFSC Code & Account Number)',
      'Previous Financial Year Turnover & Investment in Plant & Machinery',
    ],
    'IEC-License': [
      'PAN Card of Individual / Entity',
      'Cancelled Cheque with Entity Name / Bank Certificate',
      'Address Proof of Business Premise',
    ],
    'FSSAI-License': [
      'PAN & Aadhaar of Food Business Operator (FBO)',
      'Premises Proof (Electricity Bill + Rent Agreement + NOC)',
      'Food Safety Management System (FSMS) Plan & Food Category List',
      'Water Testing Analysis Report (for Manufacturing Units)',
    ],
    'Trademark': [
      'Logo / Brand Name Specimen Image (.jpg/.png)',
      'Date of First Use in India (with User Affidavit if prior used)',
      'Identity & Address Proof of Applicant',
      'Power of Attorney in Form TM-48',
    ],
    'Virtual-CFO': [
      'Monthly Tally / Zoho Books Backup or Cloud Access',
      'Debtor & Creditor Ageing Reports',
      'Cash Flow Projections & Budget vs Actual Variances',
      'Monthly Statutory Compliance Tracker',
    ],
  };

  // Structured Compliance Groups
  const COMPLIANCE_GROUPS = [
    {
      group: '🧾 GST Returns & Compliance',
      items: [
        { id: 'GST-3B', label: 'GST-3B Monthly Return & ITC' },
        { id: 'GSTR-1', label: 'GSTR-1 Outward Supplies' },
        { id: 'GSTR-9', label: 'GSTR-9 Annual Return & 9C Audit' },
        { id: 'GST-Registration', label: 'New GST Registration' },
        { id: 'GST-LUT', label: 'GST LUT (Export Undertaking)' },
        { id: 'GST-Notice', label: 'GST Notice Reply (DRC-01 / ASMT-10)' },
      ],
    },
    {
      group: '📊 Income Tax & ITR Filings',
      items: [
        { id: 'ITR-1', label: 'ITR-1 Sahaj (Salaried Individual)' },
        { id: 'ITR-2', label: 'ITR-2 (Capital Gains & Multi-House)' },
        { id: 'ITR-3', label: 'ITR-3 (Business & Profession Individual/HUF)' },
        { id: 'ITR-4', label: 'ITR-4 Sugam (Presumptive 44AD/ADA)' },
        { id: 'ITR-5', label: 'ITR-5 (Partnership Firms & LLPs)' },
        { id: 'ITR-6', label: 'ITR-6 (Corporate / Companies)' },
        { id: 'ITR-7', label: 'ITR-7 (Trusts, NGOs & Sec 8)' },
        { id: 'Advance-Tax-Q1', label: 'Advance Tax Q1 (June 15)' },
        { id: 'Advance-Tax-Q2', label: 'Advance Tax Q2 (Sept 15)' },
        { id: 'Advance-Tax-Q3', label: 'Advance Tax Q3 (Dec 15)' },
        { id: 'Advance-Tax-Q4', label: 'Advance Tax Q4 (March 15)' },
        { id: 'IT-Notice', label: 'Income Tax Notice Reply (143/148)' },
      ],
    },
    {
      group: '💸 TDS & Withholding Tax',
      items: [
        { id: 'TDS-26Q', label: 'TDS Form 26Q (Vendor Payments & Contracts)' },
        { id: 'TDS-24Q', label: 'TDS Form 24Q (Salary & Form 16)' },
        { id: 'TDS-27Q', label: 'TDS Form 27Q (Foreign / NRI Payments)' },
        { id: 'TCS-27EQ', label: 'TCS Form 27EQ (Tax Collected at Source)' },
      ],
    },
    {
      group: '🏛️ MCA / ROC & Corporate Secretarial',
      items: [
        { id: 'ROC-AOC4', label: 'ROC AOC-4 (Financial Statements Filing)' },
        { id: 'ROC-MGT7', label: 'ROC MGT-7 (Annual Return of Company)' },
        { id: 'ROC-Filing', label: 'ROC Annual Filing (Full Compliance)' },
        { id: 'Company-Incorporation', label: 'Private Limited / OPC Incorporation (SPICe+)' },
        { id: 'LLP-Incorporation', label: 'LLP Incorporation & Annual Filing (Form 11/8)' },
        { id: 'DIR-3-KYC', label: 'Annual Director KYC (DIR-3 KYC)' },
        { id: 'DPT-3', label: 'DPT-3 (Return of Deposits / Loans)' },
        { id: 'MSME-Form-1', label: 'MSME Form 1 (Outstanding Dues)' },
        { id: 'ROC-Change', label: 'Director / Registered Office Change (DIR-12/INC-22)' },
      ],
    },
    {
      group: '💼 Audit & Assurance',
      items: [
        { id: 'Tax-Audit', label: 'Tax Audit under Section 44AB (Form 3CD)' },
        { id: 'Statutory-Audit', label: 'Statutory Company Audit' },
        { id: 'Internal-Audit', label: 'Internal Audit & SOP Review' },
        { id: 'Stock-Audit', label: 'Stock Audit & Inventory Verification' },
      ],
    },
    {
      group: '🚀 Startup, Licensing & Advisory',
      items: [
        { id: 'Startup-India', label: 'Startup India (DPIIT) Recognition & 80-IAC' },
        { id: 'MSME-Udyam', label: 'MSME / Udyam Registration' },
        { id: 'IEC-License', label: 'Import Export Code (IEC) License' },
        { id: 'FSSAI-License', label: 'FSSAI Food License' },
        { id: 'Trademark', label: 'Trademark & IP Filing' },
        { id: 'Virtual-CFO', label: 'Virtual CFO & Monthly Financial MIS' },
      ],
    },
  ];

  // Form State for Requesting Documents
  const [formClientId, setFormClientId] = useState('');
  const [manualClientName, setManualClientName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [formComplianceType, setFormComplianceType] = useState('GST-3B');
  const [docListInputs, setDocListInputs] = useState<string[]>(COMPLIANCE_DOC_PRESETS['GST-3B']);
  const [clients, setClients] = useState<Array<{ id: string; client_name: string; phone: string; entity_type?: string; requirement?: string }>>([]);
  const [isComplianceDropdownOpen, setIsComplianceDropdownOpen] = useState(false);
  const [autoCategorizedReason, setAutoCategorizedReason] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-categorization algorithm based on Client Requirement / Inquiry
  const detectComplianceCategory = (reqText = '', entityType = ''): { category: string; reason: string } => {
    const text = (reqText + ' ' + entityType).toLowerCase();

    // 1. ROC / MCA & Secretarial
    if (text.includes('roc') || text.includes('aoc-4') || text.includes('aoc4') || text.includes('mgt-7') || text.includes('annual filing') || text.includes('mca') || text.includes('agm')) {
      return { category: 'ROC-Filing', reason: 'ROC Annual Compliance & Financials' };
    }
    if (text.includes('incorporat') || text.includes('pvt ltd') || text.includes('private limited') || text.includes('company formation') || text.includes('opc') || text.includes('start company') || text.includes('register company')) {
      return { category: 'Company-Incorporation', reason: 'Company / Pvt Ltd Incorporation' };
    }
    if (text.includes('llp') || text.includes('limited liability')) {
      return { category: 'LLP-Incorporation', reason: 'LLP Incorporation & Annual Filing' };
    }
    if (text.includes('dir-3') || text.includes('dir3') || text.includes('director kyc')) {
      return { category: 'DIR-3-KYC', reason: 'Annual Director KYC' };
    }
    if (text.includes('dpt-3') || text.includes('dpt3') || text.includes('deposit')) {
      return { category: 'DPT-3', reason: 'Return of Deposits' };
    }

    // 2. GST Suite
    if (text.includes('gst reg') || text.includes('new gst') || text.includes('apply gst') || text.includes('gst number')) {
      return { category: 'GST-Registration', reason: 'New GST Registration' };
    }
    if (text.includes('gstr-9') || text.includes('gstr9') || text.includes('9c') || text.includes('gst audit')) {
      return { category: 'GSTR-9', reason: 'GSTR-9 Annual Return & 9C Audit' };
    }
    if (text.includes('gstr-1') || text.includes('gstr1') || text.includes('outward')) {
      return { category: 'GSTR-1', reason: 'GSTR-1 Outward Supplies' };
    }
    if (text.includes('lut') || text.includes('export')) {
      return { category: 'GST-LUT', reason: 'GST LUT for Export' };
    }
    if (text.includes('gst notice') || text.includes('drc-01') || text.includes('asmt')) {
      return { category: 'GST-Notice', reason: 'GST Department Notice Reply' };
    }
    if (text.includes('gst') || text.includes('3b') || text.includes('monthly return')) {
      return { category: 'GST-3B', reason: 'Monthly GST-3B Return & ITC' };
    }

    // 3. Tax Audit & Statutory Audits
    if (text.includes('tax audit') || text.includes('44ab') || text.includes('3cd') || text.includes('3ca')) {
      return { category: 'Tax-Audit', reason: 'Tax Audit (Section 44AB)' };
    }
    if (text.includes('statutory audit') || text.includes('company audit')) {
      return { category: 'Statutory-Audit', reason: 'Statutory Company Audit' };
    }
    if (text.includes('internal audit') || text.includes('sop')) {
      return { category: 'Internal-Audit', reason: 'Internal SOP & Process Audit' };
    }
    if (text.includes('stock audit') || text.includes('inventory audit')) {
      return { category: 'Stock-Audit', reason: 'Physical Stock Audit' };
    }

    // 4. TDS / TCS
    if (text.includes('tds 24q') || text.includes('salary tds') || text.includes('payroll') || text.includes('form 16')) {
      return { category: 'TDS-24Q', reason: 'Payroll TDS Form 24Q' };
    }
    if (text.includes('tds 27q') || text.includes('nri') || text.includes('foreign remittance') || text.includes('15ca')) {
      return { category: 'TDS-27Q', reason: 'Foreign Remittance TDS (27Q)' };
    }
    if (text.includes('tcs') || text.includes('27eq')) {
      return { category: 'TCS-27EQ', reason: 'TCS Form 27EQ' };
    }
    if (text.includes('tds') || text.includes('26q') || text.includes('contractor') || text.includes('vendor')) {
      return { category: 'TDS-26Q', reason: 'Vendor TDS Form 26Q' };
    }

    // 5. Income Tax & ITR
    if (text.includes('itr-6') || text.includes('corporate tax') || text.includes('company itr')) {
      return { category: 'ITR-6', reason: 'Corporate Income Tax (ITR-6)' };
    }
    if (text.includes('itr-5') || text.includes('firm itr') || text.includes('partnership tax')) {
      return { category: 'ITR-5', reason: 'Partnership / LLP Tax (ITR-5)' };
    }
    if (text.includes('itr-4') || text.includes('44ad') || text.includes('44ada') || text.includes('presumptive') || text.includes('sugam')) {
      return { category: 'ITR-4', reason: 'Presumptive Business Tax (ITR-4)' };
    }
    if (text.includes('itr-3') || text.includes('proprietor tax') || text.includes('business itr')) {
      return { category: 'ITR-3', reason: 'Individual Business Tax (ITR-3)' };
    }
    if (text.includes('itr-2') || text.includes('capital gain') || text.includes('crypto') || text.includes('stock market')) {
      return { category: 'ITR-2', reason: 'Capital Gains & House Property (ITR-2)' };
    }
    if (text.includes('itr-7') || text.includes('trust') || text.includes('ngo') || text.includes('12a') || text.includes('80g')) {
      return { category: 'ITR-7', reason: 'Trust & NGO Tax (ITR-7)' };
    }
    if (text.includes('advance tax q1')) return { category: 'Advance-Tax-Q1', reason: 'Advance Tax Q1' };
    if (text.includes('advance tax q2')) return { category: 'Advance-Tax-Q2', reason: 'Advance Tax Q2' };
    if (text.includes('advance tax q3')) return { category: 'Advance-Tax-Q3', reason: 'Advance Tax Q3' };
    if (text.includes('advance tax q4') || text.includes('advance tax')) return { category: 'Advance-Tax-Q4', reason: 'Advance Tax Q4' };
    if (text.includes('income tax notice') || text.includes('143') || text.includes('148') || text.includes('defective return')) {
      return { category: 'IT-Notice', reason: 'Income Tax Notice Reply' };
    }
    if (text.includes('itr') || text.includes('income tax') || text.includes('salary') || text.includes('sahaj')) {
      return { category: 'ITR-1', reason: 'Salaried Individual Tax (ITR-1)' };
    }

    // 6. Startup & Licensing
    if (text.includes('startup') || text.includes('dpiit') || text.includes('80iac') || text.includes('seed')) {
      return { category: 'Startup-India', reason: 'Startup India DPIIT Recognition' };
    }
    if (text.includes('msme') || text.includes('udyam')) {
      return { category: 'MSME-Udyam', reason: 'MSME Udyam Registration' };
    }
    if (text.includes('iec') || text.includes('import export')) {
      return { category: 'IEC-License', reason: 'Import Export Code (IEC)' };
    }
    if (text.includes('fssai') || text.includes('food')) {
      return { category: 'FSSAI-License', reason: 'FSSAI Food License' };
    }
    if (text.includes('trademark') || text.includes('brand') || text.includes('tm')) {
      return { category: 'Trademark', reason: 'Trademark & IP Filing' };
    }
    if (text.includes('cfo') || text.includes('mis') || text.includes('accounting') || text.includes('bookkeeping')) {
      return { category: 'Virtual-CFO', reason: 'Virtual CFO Advisory' };
    }

    return { category: 'GST-3B', reason: 'Standard GST-3B Filing' };
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsComplianceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleComplianceTypeChange = (newType: string) => {
    setFormComplianceType(newType);
    setIsComplianceDropdownOpen(false);
    setAutoCategorizedReason(null);
    if (COMPLIANCE_DOC_PRESETS[newType]) {
      setDocListInputs([...COMPLIANCE_DOC_PRESETS[newType]]);
    }
  };

  const getSelectedComplianceLabel = () => {
    for (const group of COMPLIANCE_GROUPS) {
      const found = group.items.find((it) => it.id === formComplianceType);
      if (found) return found.label;
    }
    return formComplianceType;
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ca/documents');
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/ca/clients');
      const data = await res.json();
      if (data.clients) {
        setClients(data.clients);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchClients();
  }, []);

  const handleAddDocInput = () => {
    setDocListInputs([...docListInputs, '']);
  };

  const handleRemoveDocInput = (idx: number) => {
    setDocListInputs(docListInputs.filter((_, i) => i !== idx));
  };

  const handleDocInputChange = (idx: number, val: string) => {
    const next = [...docListInputs];
    next[idx] = val;
    setDocListInputs(next);
  };

  const handleSendDocRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = manualClientName.trim();
    const finalPhone = manualPhone.trim();

    if (!finalName || !finalPhone) return;
    const validDocs = docListInputs.filter((d) => d.trim().length > 0);
    if (validDocs.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/ca/request-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          clientId: formClientId || undefined,
          clientName: finalName,
          phone: finalPhone,
          complianceType: formComplianceType,
          documentsList: validDocs,
        }),
      });

      if (res.ok) {
        setActionMessage(`🚀 WhatsApp document checklist sent to ${finalName}!`);
        setTimeout(() => setActionMessage(null), 5000);
        setIsRequestModalOpen(false);
        setManualClientName('');
        setManualPhone('');
        setFormClientId('');
        fetchDocuments();
        fetchClients();
      }
    } catch (err) {
      console.error('Error sending doc request:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const [rejectionModalDoc, setRejectionModalDoc] = useState<CADocumentTracker | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Unclear scan or missing pages. Please re-upload a clear copy.');

  const handleUpdateStatus = async (docId: string, newStatus: CADocStatus, reason?: string) => {
    try {
      const res = await fetch('/api/ca/documents/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_id: docId,
          status: newStatus,
          reason,
          firm_name: businessName,
        }),
      });

      if (res.ok) {
        if (newStatus === 'Verified') {
          setActionMessage(`✅ Document marked as Verified & WhatsApp confirmation sent to client!`);
        } else if (newStatus === 'Rejected') {
          setActionMessage(`⚠️ Document marked as Rejected & WhatsApp re-upload prompt dispatched!`);
        } else {
          setActionMessage(`✅ Document marked as ${newStatus}!`);
        }
        setTimeout(() => setActionMessage(null), 5000);
        fetchDocuments();
      }
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionModalDoc) return;
    await handleUpdateStatus(rejectionModalDoc.id, 'Rejected', rejectionReason);
    setRejectionModalDoc(null);
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document tracker record?')) return;
    try {
      const res = await fetch(`/api/ca/documents?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setActionMessage('🗑️ Document tracker record deleted.');
        setTimeout(() => setActionMessage(null), 4000);
        fetchDocuments();
      }
    } catch (err) {
      console.error('Delete doc error:', err);
    }
  };

  const getStatusBadge = (status: CADocStatus) => {
    if (status === 'Verified') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
          <CheckCircle2 className="w-3 h-3" /> Verified
        </span>
      );
    } else if (status === 'Received') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 animate-pulse">
          <FileText className="w-3 h-3" /> Received (Need Review)
        </span>
      );
    } else if (status === 'Rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
          <XCircle className="w-3 h-3" /> Rejected
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
          <Clock className="w-3 h-3" /> Requested (Pending)
        </span>
      );
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.compliance_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.phone.includes(searchQuery);

    const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = documents.filter((d) => d.status === 'Pending').length;
  const receivedCount = documents.filter((d) => d.status === 'Received').length;
  const verifiedCount = documents.filter((d) => d.status === 'Verified').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-indigo-950/80 dark:to-slate-950 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" /> Client Document Automation & Review
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Document Chasing Tracker</h2>
          <p className="text-slate-300 text-sm mt-0.5">
            Auto-dispatches tailored WhatsApp checklists and matches incoming client attachments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDocuments}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => {
              fetchClients();
              setIsRequestModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" /> Request Documents
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-medium rounded-xl flex items-center justify-between shadow-sm">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-600 dark:text-emerald-400 hover:underline text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Awaiting Client Upload</p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/60">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Received (Need Review)</p>
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{receivedCount}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/60">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Verified Documents</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{verifiedCount}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 transition-colors">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search client, document, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending (Requested)</option>
          <option value="Received">Received (Need Review)</option>
          <option value="Verified">Verified</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Document List Table */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
            <p className="text-sm">Loading document tracker...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-700 dark:text-slate-200">No document records found</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              Request documents from clients to track pending uploads and auto-chasing reminders.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4">Document Requested</th>
                  <th className="py-3.5 px-4">Compliance Area</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Requested / Received</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm text-slate-700 dark:text-slate-200">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                      <div>{doc.client_name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-normal">{doc.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        {doc.document_name}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
                        {doc.compliance_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                      <div>Req: {new Date(doc.requested_date).toLocaleDateString('en-IN')}</div>
                      {doc.received_date && (
                        <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          Rec: {new Date(doc.received_date).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {doc.storage_url && (
                          <a
                            href={doc.storage_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition"
                            title="View / Download Document"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}

                        {doc.status === 'Received' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(doc.id, 'Verified')}
                              className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 rounded-lg transition"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => {
                                setRejectionModalDoc(doc);
                                setRejectionReason('Unclear scan or missing pages. Please re-upload a clear copy.');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 rounded-lg transition"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {doc.status === 'Pending' && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                            {doc.followup_count || 0} nudges
                          </span>
                        )}

                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          title="Delete this document record"
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Documents Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Request Client Documents</h3>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendDocRequest} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Select Client {clients.length > 0 ? `(${clients.length} available)` : ''}
                </label>
                <select
                  value={formClientId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    setFormClientId(selId);
                    const found = clients.find((c) => c.id === selId);
                    if (found) {
                      setManualClientName(found.client_name);
                      setManualPhone(found.phone);

                      // Intelligent auto-categorization
                      const detected = detectComplianceCategory(found.requirement, found.entity_type);
                      setFormComplianceType(detected.category);
                      if (COMPLIANCE_DOC_PRESETS[detected.category]) {
                        setDocListInputs([...COMPLIANCE_DOC_PRESETS[detected.category]]);
                      }
                      setAutoCategorizedReason(`⚡ Auto-categorized: ${detected.reason}`);
                    } else {
                      setManualClientName('');
                      setManualPhone('');
                      setAutoCategorizedReason(null);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2 text-xs font-medium"
                >
                  <option value="">-- Choose from Registered Clients & Leads --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      👤 {c.client_name} ({c.phone}) {c.entity_type ? `• ${c.entity_type}` : ''}
                    </option>
                  ))}
                </select>

                {autoCategorizedReason && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 rounded-xl text-indigo-700 dark:text-indigo-300 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{autoCategorizedReason}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Enterprises"
                    value={manualClientName}
                    onChange={(e) => setManualClientName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">WhatsApp Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="919876543210"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Compliance Area * <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">(Auto-loads official document checklist)</span>
                </label>
                
                {/* Trigger Button with Smooth Rounded Edges */}
                <button
                  type="button"
                  onClick={() => setIsComplianceDropdownOpen(!isComplianceDropdownOpen)}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/90 border ${
                    isComplianceDropdownOpen
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  } text-slate-900 dark:text-slate-100 rounded-2xl flex items-center justify-between transition-all duration-200 shadow-sm text-xs font-medium text-left`}
                >
                  <span className="truncate pr-2">{getSelectedComplianceLabel()}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${
                      isComplianceDropdownOpen ? 'rotate-180 text-indigo-500' : ''
                    }`}
                  />
                </button>

                {/* Smooth Rounded Dropdown Popover */}
                {isComplianceDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto p-2 space-y-2.5 transition-all animate-in fade-in zoom-in-95 duration-150 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                    {COMPLIANCE_GROUPS.map((grp) => (
                      <div key={grp.group} className="space-y-1">
                        <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {grp.group}
                        </div>
                        <div className="space-y-0.5">
                          {grp.items.map((item) => {
                            const isSelected = formComplianceType === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleComplianceTypeChange(item.id)}
                                className={`w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors text-left ${
                                  isSelected
                                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-semibold'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                                }`}
                              >
                                <span>{item.label}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Document Checklist Items *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddDocInput}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {docListInputs.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={doc}
                        onChange={(e) => handleDocInputChange(idx, e.target.value)}
                        placeholder="e.g. Bank Statement (6 Months)"
                        className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      />
                      {docListInputs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDocInput(idx)}
                          className="p-2 text-slate-400 hover:text-rose-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-xs text-indigo-800 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60">
                💡 <b>AI Automation:</b> Submitting this will automatically draft a polite WhatsApp checklist message and send it directly to the client&apos;s phone.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Dispatching...' : 'Dispatch Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectionModalDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Reject & Request Re-upload</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {rejectionModalDoc.client_name} • {rejectionModalDoc.document_name}
                </p>
              </div>
              <button
                onClick={() => setRejectionModalDoc(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Select or Enter Rejection Reason:
                </label>
                <div className="space-y-2 mb-3">
                  {[
                    'Unclear scan or blurry photo. Please re-upload a clear copy.',
                    'Missing pages / partial bank statement. Please upload complete statement.',
                    'Wrong financial year / quarter document attached.',
                    'Password-protected PDF without password provided.',
                  ].map((presetReason, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectionReason(presetReason)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs border transition ${
                        rejectionReason === presetReason
                          ? 'border-rose-300 dark:border-rose-700 bg-rose-50/60 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 font-medium'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {presetReason}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Custom rejection reason..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-xs text-rose-800 dark:text-rose-300 border border-rose-100 dark:border-rose-800/60">
                📲 <b>WhatsApp Alert:</b> Submitting will automatically send a prompt to the client explaining why the document was rejected and asking them to reply directly with a replacement file.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectionModalDoc(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5 text-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  Confirm Reject & Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
