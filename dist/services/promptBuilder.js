"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSystemPrompt = buildSystemPrompt;
const businessService_js_1 = require("./businessService.js");
const supabase_js_1 = require("../config/supabase.js");
/**
 * Builds a category-aware system prompt dynamically by merging
 * category_templates with business_config rows for the tenant.
 */
async function buildSystemPrompt(businessId) {
    console.log(`[PromptBuilder] Building system prompt for business_id: ${businessId}`);
    // 1. Fetch business row
    const { data: businessData, error: businessErr } = await supabase_js_1.supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();
    if (businessErr || !businessData) {
        throw new Error(`[PromptBuilder Error] Business not found for ID: ${businessId}`);
    }
    const business = businessData;
    // 2. Fetch category template
    const templateObj = await (0, businessService_js_1.getCategoryTemplate)(business.category);
    if (!templateObj) {
        throw new Error(`[PromptBuilder Error] Template not found for category: ${business.category}`);
    }
    let prompt = templateObj.prompt_template;
    // 3. Fetch business configs
    const configs = await (0, businessService_js_1.getBusinessConfigs)(businessId);
    // Map configs to dictionary
    const configMap = {
        business_name: business.name,
    };
    for (const item of configs) {
        const valueStr = typeof item.config_value === 'string'
            ? item.config_value
            : JSON.stringify(item.config_value, null, 2);
        configMap[item.config_key] = valueStr;
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
    console.log(`[PromptBuilder] System prompt built successfully (${prompt.length} chars)`);
    return prompt;
}
