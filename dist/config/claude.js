"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.anthropic = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const env_js_1 = require("./env.js");
if (!env_js_1.ENV.ANTHROPIC_API_KEY) {
    console.warn('⚠️ [Claude] ANTHROPIC_API_KEY missing in .env');
}
exports.anthropic = new sdk_1.default({
    apiKey: env_js_1.ENV.ANTHROPIC_API_KEY || 'placeholder-api-key',
});
