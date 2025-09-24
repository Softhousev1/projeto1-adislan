// Configuração do Supabase
const supabaseUrl = 'https://hylttfhaedvytykjpeze.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bHR0ZmhhZWR2eXR5a2pwZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MTE1MDgsImV4cCI6MjA3NDI4NzUwOH0.e0BmMYbBC9QBI6TNsKgWUckFqCPnjPGEAq6-7h1W18A';
// O global da CDN é 'supabase' (minúsculo). Criamos nosso cliente a partir dele.
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Função para buscar e renderizar os produtos na página inicial
async function loadHomePageProducts() {
  const productListContainer = document.getElementById('product-list');
  if (!productListContainer) return;

  // Adiciona uma mensagem de carregamento
  productListContainer.innerHTML = '<p>Carregando produtos...</p>';

  const { data: products, error } = await supabaseClient
    .from('products')
    .select('*')
    .order('created_at', { ascending: false }) // Pega os mais recentes
    .limit(8); // Limita a 8 produtos na página inicial

  if (error) {
    console.error('Erro ao buscar produtos:', error);
    productListContainer.innerHTML = '<p>Não foi possível carregar os produtos.</p>';
    return;
  }
  
  if (products.length === 0) {
    productListContainer.innerHTML = '<p>Nenhum produto cadastrado ainda.</p>';
    return;
  }

  // Limpa a mensagem de carregamento e cria o HTML para cada produto
  productListContainer.innerHTML = '';
  products.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'produto';
    
    productCard.innerHTML = `
        <a href="produto.html?id=${product.id}" class="product-link">
            <img src="${product.image_url || 'img/placeholder.png'}" alt="${escapeHtml(product.name)}">
            <h3>${escapeHtml(product.name)}</h3>
            <p>R$ ${Number(product.price).toFixed(2)}</p>
        </a>
        <button class="btn-comprar" onclick="location.href='produto.html?id=${product.id}'">Ver Detalhes</button>
    `;
    productListContainer.appendChild(productCard);
  });
}

function escapeHtml(s) {
    return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Inicia o carregamento quando a página estiver pronta
document.addEventListener('DOMContentLoaded', loadHomePageProducts);
