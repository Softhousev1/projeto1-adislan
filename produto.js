// Configuração do Supabase (substitua com suas chaves se necessário, mas idealmente use variáveis de ambiente)
const supabaseUrl = 'https://hylttfhaedvytykjpeze.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bHR0ZmhhZWR2eXR5a2pwZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MTE1MDgsImV4cCI6MjA3NDI4NzUwOH0.e0BmMYbBC9QBI6TNsKgWUckFqCPnjPGEAq6-7h1W18A';
const supabase = window.supabase ? window.supabase : Supabase.createClient(supabaseUrl, supabaseKey);

// Função para buscar e renderizar os detalhes do produto
async function loadProductDetails() {
  const productContainer = document.getElementById('product-container');
  const loader = document.getElementById('loader');
  
  // 1. Pegar o ID do produto da URL
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    productContainer.innerHTML = '<p>Produto não encontrado. ID inválido.</p>';
    return;
  }

  // 2. Buscar os dados do produto no Supabase
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      categories ( name )
    `)
    .eq('id', productId)
    .single(); // .single() para pegar apenas um resultado

  // Esconde o loader
  loader.style.display = 'none';

  if (error || !product) {
    console.error('Erro ao buscar produto:', error);
    productContainer.innerHTML = '<p>Não foi possível carregar os detalhes do produto.</p>';
    return;
  }
  
  // 3. Atualizar o título da página
  document.title = product.name;

  // 4. Construir o HTML com os detalhes do produto
  productContainer.innerHTML = `
    <div class="product-image-gallery">
      <img src="${product.image_url || 'img/placeholder.png'}" alt="${escapeHtml(product.name)}">
    </div>
    <div class="product-details">
      <span class="category">${escapeHtml(product.categories.name)}</span>
      <h1>${escapeHtml(product.name)}</h1>
      <p class="price">R$ ${Number(product.price).toFixed(2)}</p>
      <p class="description">${escapeHtml(product.description || 'Nenhuma descrição disponível.')}</p>
      <button class="add-to-cart-btn">Adicionar ao Carrinho</button>
    </div>
  `;
}

function escapeHtml(s) {
    return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}


// Inicia o carregamento quando a página estiver pronta
document.addEventListener('DOMContentLoaded', loadProductDetails);
