// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://zrjjiuxbedqkbulcyynn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyamppdXhiZWRxa2J1bGN5eW5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5MDM3NjAsImV4cCI6MjA1MjQ3OTc2MH0.hQY_eu52r7IuWoLzhLM-UlRbTD3koFIKviT3cf-ZNGk";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);