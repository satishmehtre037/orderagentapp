"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const env_js_1 = require("./env.js");
if (!env_js_1.ENV.SUPABASE_URL || !env_js_1.ENV.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️ [Supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env');
}
exports.supabase = (0, supabase_js_1.createClient)(env_js_1.ENV.SUPABASE_URL || 'https://placeholder.supabase.co', env_js_1.ENV.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key', {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});
