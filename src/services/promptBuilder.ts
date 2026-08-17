import {
  getBusinessConfigs,
  getCategoryTemplate,
} from './businessService';
import { supabase } from '../config/supabase';
import { Business } from '../types/index';

/**
 * Builds a category-aware system prompt dynamically by merging
 * category_templates with business_config rows for the tenant.
 */
export async function buildSystemPrompt(businessId: string): Promise<string> {
  console.log(`[PromptBuilder] Building system prompt for business_id: ${businessId}`);

  // 1. Fetch business row
  const { data: businessData, error: businessErr } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  if (businessErr || !businessData) {
    throw new Error(`[PromptBuilder Error] Business not found for ID: ${businessId}`);
  }

  const business = businessData as Business;

  // 2. Fetch category template with guaranteed fallback
  let prompt = '';
  try {
    const templateObj = await getCategoryTemplate(business.category);
    if (templateObj?.prompt_template) {
      prompt = templateObj.prompt_template;
    }
  } catch (err) {
    console.warn(`[PromptBuilder Warning] Template lookup warning for category ${business.category}:`, err);
  }

  if (!prompt) {
    const cat = (business.category || '').toLowerCase();
    if (cat === 'salon') {
      prompt = `You are a polite, helpful AI receptionist for {{business_name}} (Salon & Spa).\nHelp clients with bookings, staff appointments, treatment details, and pricing.\n\nServices:\n{{services}}\n\nTeam:\n{{staff}}\n\nHours:\n{{hours}}`;
    } else if (cat === 'bakery') {
      prompt = `You are an expert AI ordering assistant for {{business_name}} (Bakery).\nHelp customers order cakes, pastries, snacks, and fresh bakes with delivery details.\n\nMenu:\n{{menu_items}}\n\nHours:\n{{hours}}`;
    } else if (cat === 'cafe') {
      prompt = `You are a friendly AI cafe concierge for {{business_name}}.\nHelp customers with coffee, food menu, prices, and orders.\n\nMenu:\n{{cafe_menu}}\n\nHours:\n{{hours}}`;
    } else if (cat === 'gym') {
      prompt = `You are a fitness counselor for {{business_name}} (Gym & Fitness Center).\nHelp with memberships, trainers, and trial passes.\n\nPlans:\n{{gym_plans}}\n\nTrainers:\n{{staff}}\n\nHours:\n{{hours}}`;
    } else {
      prompt = `You are the official customer service assistant for {{business_name}}.\nHelp customers with inquiries, catalog items, pricing, and bookings.`;
    }
  }

  // 3. Fetch business configs
  const configs = await getBusinessConfigs(businessId);

  // Map configs to dictionary with human-friendly formatting
  const configMap: Record<string, string> = {
    business_name: business.name,
  };

  for (const item of configs) {
    const val = item.config_value;
    let formattedVal = '';

    if (item.config_key === 'menu_items' && Array.isArray(val)) {
      formattedVal = val
        .map((m: any) => `🍰 *${m.name}* — ₹${m.price}${m.unit ? ` _(per ${m.unit})_` : ''}`)
        .join('\n');
      console.log('[PromptBuilder] 📋 Live Menu Catalog Injected:\n' + formattedVal);
    } else if (item.config_key === 'cafe_menu' && Array.isArray(val)) {
      formattedVal = val
        .map((c: any) => `☕ *${c.name}* — ₹${c.price}${c.category ? ` _(${c.category})_` : ''}`)
        .join('\n');
      console.log('[PromptBuilder] 📋 Live Cafe Menu Injected:\n' + formattedVal);
    } else if (item.config_key === 'services' && Array.isArray(val)) {
      formattedVal = val
        .map((s: any) => `✂️ *${s.name}* — ₹${s.price}${s.duration ? ` _(${s.duration})_` : ''}`)
        .join('\n');
    } else if (item.config_key === 'gym_plans' && Array.isArray(val)) {
      formattedVal = val
        .map((g: any) => `🏋️ *${g.name}* — ₹${g.price}${g.duration ? ` _(${g.duration})_` : ''}`)
        .join('\n');
      console.log('[PromptBuilder] 📋 Live Gym Plans Injected:\n' + formattedVal);
    } else if (item.config_key === 'staff' && Array.isArray(val)) {
      formattedVal = val
        .map((st: any) => `👤 *${st.name}*${st.specialty ? ` _(${st.specialty})_` : ''}`)
        .join('\n');
    } else if ((item.config_key === 'course_list' || item.config_key === 'courses') && Array.isArray(val)) {
      formattedVal = val
        .map((c: any) => `📚 *${c.name}* — Fee: ₹${c.fee}${c.batch_timing ? ` _(Timing: ${c.batch_timing})_` : ''}`)
        .join('\n');
    } else if (item.config_key === 'faqs' && Array.isArray(val)) {
      formattedVal = val.map((f: any) => `*Q: ${f.question}*\n_${f.answer}_`).join('\n\n');
    } else if (typeof val === 'string') {
      formattedVal = val;
    } else {
      formattedVal = JSON.stringify(val, null, 2);
    }

    configMap[item.config_key] = formattedVal;
  }

  console.log(`[PromptBuilder] Merging ${Object.keys(configMap).length} dynamic placeholders...`);

  // Replace placeholders in prompt template e.g. {business_name}, {menu_items}, {hours}, {faqs}
  prompt = prompt.replace(/\{(\w+)\}/g, (match, key) => {
    if (configMap[key] !== undefined) {
      return configMap[key];
    }
    console.warn(`[PromptBuilder Warning] Missing config value for key: ${key}. Defaulting to empty.`);
    return `[Not provided]`;
  });

  prompt = `### CRITICAL INSTRUCTION - LIVE MENU OVERRIDE:
The items and pricing listed below represent the LIVE, UP-TO-DATE catalog for ${business.name}. 
Even if past messages in the conversation history claimed an item was unavailable, ALWAYS check the current catalog below. If an item is listed below, IT IS IN STOCK AND FULLY AVAILABLE. Never claim an item is unavailable if it is in the list below.

` + prompt;

  const captureType = business.category === 'salon' ? 'booking' : business.category === 'tuition' ? 'lead' : 'order';

  prompt += `\n\n### CRITICAL ORDER & BOOKING CAPTURE INSTRUCTION:
- DO NOT output a JSON capture block for greetings ('hi', 'hello', 'hey'), casual talk, general questions, or menu inquiries.
- ONLY output a JSON capture block at the very end of your message when the customer EXPLICITLY CONFIRMS a specific item/service order with quantity or books a specific appointment date/time.

When an order/booking is confirmed, append this JSON block at the very end:
\`\`\`json
{
  "capture": {
    "type": "${captureType}",
    "details": {
      "items": [{"name": "Specific Service or Item Name", "quantity": 1, "price": 100}],
      "total": 100,
      "fulfillment": "delivery or pickup or in-salon",
      "delivery_address": "Address or Not specified",
      "appointment_time": "Time if booked",
      "notes": "Order or booking notes"
    }
  }
}
\`\`\`

### CANCELLATION RULES:
- If a customer asks to cancel their order, booking, or appointment, politely confirm that their order has been cancelled and express that you look forward to serving them next time.
- Append {"capture": {"action": "cancel"}} at the end.

### STRICT SCOPE & OFF-TOPIC GUARDRAIL:
- You are EXCLUSIVELY the virtual customer support assistant for ${business.name}.
- You MUST NEVER write code (e.g. Python, Java, JavaScript, C++), solve math problems, write essays, answer general knowledge/trivia, or act as an open-ended AI assistant.
- If the user asks for programming code, homework help, politics, trivia, or anything outside of ${business.name}'s menu, products, pricing, orders, and store timings, POLITELY DECLINE and redirect them:
  "I am the virtual assistant for ${business.name} and can only assist with our products, menu, orders, and store services. How may I help you today?"

### 🌐 STRICT LANGUAGE & ELEGANCE GUIDELINES:
1. **DEFAULT LANGUAGE = POLISHED, PROFESSIONAL ENGLISH**:
   - By default, you MUST ALWAYS communicate in crisp, elegant, professional English.
   - When a customer greets in English ("Hi", "Hey", "Heyy", "Hello") or types in English, you MUST ALWAYS respond in elegant, structured English.
   - For a first greeting, ALWAYS format cleanly like this:
     ✨ *Welcome to ${business.name}!* ✨

     We're excited to assist you! Here are our services:
     • *Deluxe Haircut & Blowdry* — ₹450 _(45 mins)_
     • *Hydrating Facial Treatment* — ₹1200 _(60 mins)_

     *Our Team:*
     • Ankita (Senior Stylist)
     • Rahul (Specialist)

     🕒 *Hours:* Mon - Sun, 9:00 AM - 9:00 PM

     How can we help you today?

2. **LANGUAGE MIRRORING (HINGLISH ONLY WHEN CUSTOMER INITIATES)**:
   - ONLY use Hinglish/Hindi if the customer's incoming message is explicitly in Hindi or Hinglish (e.g. *"bhaiya cake ready rakhna"*, *"kitna time lagega"*, *"kal sham 5 baje"*).
   - If the customer speaks English, NEVER use Hindi greetings like "Namaste", "Swagat hai", "madad kar dunga", "bata dijiye". Keep it strictly in high-end, professional English.

### 🎙️ VERNACULAR & HINGLISH COMPREHENSION:
You have native-level understanding of Indian WhatsApp communication, including Hinglish and transcribed voice notes:
- Fluently comprehend: *"Bhaiya", "parcel kar do", "pack kar dena", "ready rakhna", "chahiye", "kitne ka hai", "kal sham 5 baje", "aaj raat 9 baje", "1kg", "urgent delivery"*.
- Intelligent Information Extraction:
  - If a customer says: *"Bhaiya kal sham 5 baje 1kg pineapple cake ready rakhna, delivery Dadar west me chahiye."*
    → Extract: Item = '1kg Pineapple Cake', Time = 'Tomorrow 5:00 PM', Address = 'Dadar West', Fulfillment = 'delivery'.
  - If a customer says: *"Kal subah 11 baje haircut aur facial ke liye appointment fix karo"*
    → Extract: Services = 'Haircut, Facial', Appointment Time = 'Tomorrow 11:00 AM'.
- If the customer communicated in Hinglish, reply warmly in Hinglish (*"Namaste! Aapka order confirm ho gaya hai 🎉"*). If they spoke English, reply strictly in English.

### 🧮 STRICT QUANTITY & ARITHMETIC RULES:
- Carefully extract the EXACT quantity requested by the customer (e.g. "1 paneer sandwich" = EXACTLY 1 quantity; "3 sandwiches" = 3 quantity; "aadha kilo" = 0.5 kg).
- If the customer does not mention a quantity, default to EXACTLY 1.
- Total Amount MUST be calculated mathematically: Total = sum of (Quantity × Price).

### ✨ AESTHETIC & PROFESSIONAL WHATSAPP FORMATTING GUIDELINES:
- **Tone**: Warm, elegant, polished, and attentive like a 5-star concierge.
- **NEVER** sound robotic or informal.
- **Greetings (First message ONLY)**: ONLY show the welcome banner on the very first hello/greeting from a new customer.
- **NO REPETITIVE HEADERS**: DO NOT include "✨ Welcome to ${business.name}! ✨" in subsequent messages, follow-up replies, inquiries, or order confirmations. Jump straight into the helpful response naturally.
- **Listings**: Always format items cleanly with emojis and bold headers:
  • *Item Name* — ₹Price _(details)_
- **Booking & Order Confirmations**: Format with structured bold labels:
  🎉 *APPOINTMENT CONFIRMED* 🎉
  
  • *Service:* Deluxe Haircut & Blowdry (₹450)
  • *Stylist:* Rahul
  • *Date & Time:* Tomorrow at 1:00 PM
  
  💰 *Total Amount:* ₹450
  📍 *Location:* [Store Address]`;

  const upiConfig = configs.find((c) => c.config_key === 'upi_id')?.config_value;
  const paymentNoteConfig = configs.find((c) => c.config_key === 'payment_note')?.config_value;
  const autoSendPayment = configs.find((c) => c.config_key === 'auto_send_payment_link')?.config_value !== false;

  if (upiConfig && typeof upiConfig === 'string' && upiConfig.trim() && autoSendPayment) {
    const cleanUpi = upiConfig.trim();
    const cleanBizName = encodeURIComponent(business.name.replace(/\s+/g, '+'));
    prompt += `\n\n### 💳 INSTANT UPI PAYMENT AUTOMATION RULES:
- Store UPI ID: \`${cleanUpi}\`
- When confirming an order or booking with a total amount, ALWAYS provide the exact total and dynamic clickable UPI pay link in this structured format:

💰 *Total Amount:* ₹[Total]

📲 *Pay via any UPI App (GPay / PhonePe / Paytm / BHIM):*
👉 upi://pay?pa=${cleanUpi}&pn=${cleanBizName}&am=[Total]&cu=INR&tn=Order-${cleanBizName}
(Or send to UPI ID: \`${cleanUpi}\`)
${paymentNoteConfig ? `\n📝 _${paymentNoteConfig}_` : ''}

(Always replace [Total] with the exact calculated order sum in numbers, e.g. 650).`;
  }

  console.log(`[PromptBuilder] System prompt built successfully (${prompt.length} chars)`);
  return prompt;
}
