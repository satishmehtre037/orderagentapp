"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
exports.validateEnv = validateEnv;
const dotenv_1 = __importDefault(require("dotenv"));
// Load .env file
dotenv_1.default.config();
exports.ENV = {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
    WHATSAPP_CLOUD_API_TOKEN: process.env.WHATSAPP_CLOUD_API_TOKEN || '',
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || '',
    PORT: parseInt(process.env.PORT || '3001', 10),
};
function validateEnv() {
    const required = [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'ANTHROPIC_API_KEY',
    ];
    const missing = required.filter((key) => !exports.ENV[key]);
    if (missing.length > 0) {
        console.warn(`⚠️ [Config Warning] Missing environment variables: ${missing.join(', ')}. Set them in .env before running live calls.`);
    }
}
