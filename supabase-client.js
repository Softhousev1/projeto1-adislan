import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// URL e Chave Pública (Anon) do Supabase
const supabaseUrl = 'https://hylttfhaedvytykjpeze.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bHR0ZmhhZWR2eXR5a2pwZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MTE1MDgsImV4cCI6MjA3NDI4NzUwOH0.e0BmMYbBC9QBI6TNsKgWUckFqCPnjPGEAq6-7h1W18A';

// Cria e exporta o cliente Supabase para ser usado em outros módulos
export const supabase = createClient(supabaseUrl, supabaseKey);

// Disponibiliza o cliente globalmente para scripts que não são módulos (como auth-ui.js)
window.supabaseClient = supabase;

console.log('[supabase-client] Cliente Supabase inicializado e disponível globalmente.');