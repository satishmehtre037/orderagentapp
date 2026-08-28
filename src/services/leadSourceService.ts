import { ENV } from '../config/env';
import { supabase } from '../config/supabase';
import { normalizeIndianPhone } from './optOutService';

/**
 * Real lead sourcing via the Google Places API (New).
 *
 * This module replaces a generator that invented business names from hardcoded
 * suburb lists and synthesised phone numbers arithmetically:
 *
 *     const random8Digits = 10000000 + ((leadCounter * 3847291) % 89999999);
 *     const phoneNumber = `+9198${random8Digits}`;
 *
 * Those numbers belonged to real, uninvolved people, and the pitch addressed
 * them by a business name that did not exist. Nothing here fabricates data:
 * if the API key is absent or the call fails, this throws. An empty result is
 * an empty result.
 */

export interface ScrapedLead {
  id: string;
  business_name: string;
  category: string;
  city: string;
  phone_number: string;
  rating: number | null;
  reviews_count: number | null;
  address: string;
  has_website: boolean;
  website?: string;
  maps_url: string;
  status: 'pending' | 'sent' | 'replied' | 'converted' | 'opted_out' | 'failed';
  source: 'google_places' | 'manual' | 'licensed_import' | 'inbound';
  source_ref?: string;
  consent_status: 'none' | 'opt_in' | 'legitimate_b2b' | 'opted_out';
}

export class LeadSourceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LeadSourceUnavailableError';
  }
}

const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.businessStatus',
  'places.primaryType',
  'places.googleMapsUri',
  'nextPageToken',
].join(',');

interface PlacesTextSearchResponse {
  places?: Array<{
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    websiteUri?: string;
    rating?: number;
    userRatingCount?: number;
    businessStatus?: string;
    primaryType?: string;
    googleMapsUri?: string;
  }>;
  nextPageToken?: string;
  error?: { message?: string; status?: string };
}

/** Google Places caps a single page at 20 results. */
const PAGE_SIZE = 20;

export async function searchRealLeads(params: {
  category: string;
  city: string;
  customQuery?: string;
  count: number;
  noWebsiteOnly?: boolean;
}): Promise<{ leads: ScrapedLead[]; query: string; scanned: number; skipped: { noPhone: number; invalidPhone: number; closed: number; hasWebsite: number } }> {
  const apiKey = ENV.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new LeadSourceUnavailableError(
      'GOOGLE_PLACES_API_KEY is not configured. Lead sourcing is disabled — set the key in .env, ' +
        'or add leads manually via the "Paste numbers" flow. Leads are never generated synthetically.'
    );
  }

  const query = (params.customQuery || `${(params.category || '').replace(/_/g, ' ')} in ${params.city}`).trim();
  const target = Math.min(Math.max(Number(params.count) || 20, 1), 100);

  const collected: ScrapedLead[] = [];
  const skipped = { noPhone: 0, invalidPhone: 0, closed: 0, hasWebsite: 0 };
  let scanned = 0;
  let pageToken: string | undefined;
  let pagesFetched = 0;

  // Places caps pagination; 5 pages * 20 = 100 results, which matches our cap.
  while (collected.length < target && pagesFetched < 5) {
    const res = await fetch(PLACES_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: PAGE_SIZE,
        languageCode: 'en',
        regionCode: 'IN',
        ...(pageToken ? { pageToken } : {}),
      }),
    });

    const json = (await res.json()) as PlacesTextSearchResponse;

    if (!res.ok) {
      throw new LeadSourceUnavailableError(
        `Google Places API returned ${res.status}: ${json?.error?.message || 'unknown error'}`
      );
    }

    const places = json.places || [];
    pagesFetched++;
    scanned += places.length;

    for (const place of places) {
      if (collected.length >= target) break;

      // Skip anything Google no longer considers operational.
      if (place.businessStatus && place.businessStatus !== 'OPERATIONAL') {
        skipped.closed++;
        continue;
      }

      const rawPhone = place.internationalPhoneNumber || place.nationalPhoneNumber || '';
      if (!rawPhone) {
        skipped.noPhone++;
        continue;
      }

      // Only mobile numbers can receive WhatsApp; landlines are dropped rather
      // than "corrected" into something that might reach a stranger.
      const phone = normalizeIndianPhone(rawPhone);
      if (!phone) {
        skipped.invalidPhone++;
        continue;
      }

      const hasWebsite = Boolean(place.websiteUri);
      if (params.noWebsiteOnly && hasWebsite) {
        skipped.hasWebsite++;
        continue;
      }

      collected.push({
        id: place.id || `place_${collected.length}`,
        business_name: place.displayName?.text || 'Unnamed business',
        category: place.primaryType || params.category,
        city: params.city,
        phone_number: phone,
        // Real values or null. Never invented.
        rating: typeof place.rating === 'number' ? place.rating : null,
        reviews_count: typeof place.userRatingCount === 'number' ? place.userRatingCount : null,
        address: place.formattedAddress || '',
        has_website: hasWebsite,
        website: place.websiteUri,
        maps_url: place.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${place.id}`,
        status: 'pending',
        source: 'google_places',
        source_ref: place.id,
        // Sourcing a public listing is not consent. The operator must record a
        // basis before any dispatch — see checkOutreachAllowed().
        consent_status: 'none',
      });
    }

    pageToken = json.nextPageToken;
    if (!pageToken) break;
  }

  return { leads: collected, query, scanned, skipped };
}

/**
 * Persists sourced leads so that consent state, contact history and opt-outs
 * survive a page refresh. Existing rows keep whatever consent they already had.
 */
export async function persistLeads(leads: ScrapedLead[], businessId: string | null): Promise<ScrapedLead[]> {
  if (leads.length === 0) return [];

  const rows = leads.map((lead) => ({
    business_id: businessId,
    business_name: lead.business_name,
    category: lead.category,
    city: lead.city,
    phone_number: lead.phone_number,
    address: lead.address,
    rating: lead.rating,
    reviews_count: lead.reviews_count,
    has_website: lead.has_website,
    website: lead.website || null,
    maps_url: lead.maps_url,
    source: lead.source,
    source_ref: lead.source_ref || null,
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('lead_hunter_leads')
    .upsert(rows, { onConflict: 'phone_number', ignoreDuplicates: false })
    .select('*');

  if (error) {
    console.error('[LeadSource] Failed to persist leads:', error.message);
    // Return the in-memory leads so the UI still works; they just carry no id
    // and therefore cannot pass the consent gate until saved.
    return leads;
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    business_name: row.business_name,
    category: row.category,
    city: row.city,
    phone_number: row.phone_number,
    rating: row.rating,
    reviews_count: row.reviews_count,
    address: row.address,
    has_website: row.has_website,
    website: row.website || undefined,
    maps_url: row.maps_url,
    status: row.status,
    source: row.source,
    source_ref: row.source_ref || undefined,
    consent_status: row.consent_status,
  }));
}

/**
 * Registers operator-supplied numbers (the "paste numbers" flow). The operator
 * is asserting a basis for contact, so it is recorded explicitly rather than
 * assumed — `consentNote` is required and stored.
 */
export async function registerManualLeads(params: {
  entries: Array<{ phone: string; businessName?: string; category?: string; city?: string }>;
  businessId: string | null;
  consentStatus: 'opt_in' | 'legitimate_b2b';
  consentNote: string;
}): Promise<{ saved: ScrapedLead[]; rejected: Array<{ phone: string; reason: string }> }> {
  const rejected: Array<{ phone: string; reason: string }> = [];
  const rows: any[] = [];

  if (!params.consentNote || params.consentNote.trim().length < 3) {
    throw new Error('A consent note is required — record why these numbers may be contacted.');
  }

  for (const entry of params.entries) {
    const phone = normalizeIndianPhone(entry.phone);
    if (!phone) {
      rejected.push({ phone: entry.phone, reason: 'Not a valid Indian mobile number' });
      continue;
    }
    rows.push({
      business_id: params.businessId,
      business_name: entry.businessName?.trim() || 'Manually added lead',
      category: entry.category || 'custom',
      city: entry.city || '',
      phone_number: phone,
      source: 'manual',
      consent_status: params.consentStatus,
      consent_note: params.consentNote.trim(),
      consent_recorded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  if (rows.length === 0) return { saved: [], rejected };

  const { data, error } = await supabase
    .from('lead_hunter_leads')
    .upsert(rows, { onConflict: 'phone_number' })
    .select('*');

  if (error) throw new Error(`Failed to save manual leads: ${error.message}`);

  return {
    saved: (data || []).map((row: any) => ({
      id: row.id,
      business_name: row.business_name,
      category: row.category,
      city: row.city,
      phone_number: row.phone_number,
      rating: row.rating,
      reviews_count: row.reviews_count,
      address: row.address || '',
      has_website: row.has_website,
      website: row.website || undefined,
      maps_url: row.maps_url || '',
      status: row.status,
      source: row.source,
      consent_status: row.consent_status,
    })),
    rejected,
  };
}

/** Looks up the stored consent state for a phone number. */
export async function getLeadByPhone(phone: string): Promise<{ id: string; consent_status: string; business_name: string } | null> {
  const digits = (phone || '').replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) return null;

  const { data } = await supabase
    .from('lead_hunter_leads')
    .select('id, consent_status, business_name')
    .like('phone_number', `%${digits}`)
    .limit(1)
    .maybeSingle();

  return (data as any) || null;
}
