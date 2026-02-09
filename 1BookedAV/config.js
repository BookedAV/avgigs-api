/* ============================================
   CONFIG — Replace these with your real values
   ============================================ */

// Supabase — get these from: Project Settings → API
const SUPABASE_URL   = 'https://kkzgxutyqqrcklijhymi.supabase.co';
const SUPABASE_ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtremd4dXR5cXFyY2tsaWpoeW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTY4NjIsImV4cCI6MjA4NjE3Mjg2Mn0.pzlKq7eqHjjTGlOCRgkMzSf6bNmS9_eLK7MrmGEzWwk';

// Stripe — publishable key (safe for frontend)
// Get from: https://dashboard.stripe.com/apikeys
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SykMpGyVClIRruF1cGNMWUUAryVejqmd0yIxscYcRygdILiRQYT2yuIPf3R1cZzIoU0Y0zvnBLPVBHhIbkGVQkl00ErKVVeuo';

// Your deployed serverless function base URL
// Examples:
//   Vercel:  'https://av-gig-api.vercel.app'
//   Netlify: 'https://av-gig-api.netlify.app/.netlify/functions'
const SERVERLESS_BASE_URL = 'https://avgigs-api-l3io.vercel.app/';

// Init Supabase client (used globally)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
