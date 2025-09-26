// Configurações do projeto
module.exports = {
  // Chave secreta do Stripe (use variáveis de ambiente)
  stripe_secret_key: process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
  // Chave de serviço do Supabase (use variáveis de ambiente)
  supabase_service_key: process.env.SUPABASE_SERVICE_KEY || 'supabase_placeholder',
  
  // URL do frontend para redirecionamentos do Stripe
  frontend_url: process.env.FRONTEND_URL || 'http://127.0.0.1:5500',
  
  // Porta do servidor backend
  port: process.env.PORT || 3000
};
