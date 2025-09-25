// Configuração do Supabase (substitua com suas chaves se necessário, mas idealmente use variáveis de ambiente)
const supabaseUrl = 'https://hylttfhaedvytykjpeze.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bHR0ZmhhZWR2eXR5a2pwZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MTE1MDgsImV4cCI6MjA3NDI4NzUwOH0.e0BmMYbBC9QBI6TNsKgWUckFqCPnjPGEAq6-7h1W18A';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let currentProduct = null; // Variável global para guardar os dados do produto atual

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
  const { data: product, error } = await supabaseClient
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
  
  // 3. Armazena os dados do produto e atualiza o título
  currentProduct = product;
  document.title = product.name;

  // 4. Construir o HTML com os detalhes do produto
  productContainer.innerHTML = `
    <div class="product-image-gallery">
      <img src="${product.image_url || 'img/placeholder.png'}" alt="${escapeHtml(product.name)}">
    </div>
    <div class="product-details">
      <span class="category">${product.categories ? escapeHtml(product.categories.name) : 'Sem Categoria'}</span>
      <h1>${escapeHtml(product.name)}</h1>
      <p class="price">R$ ${Number(product.price).toFixed(2)}</p>
      <p class="description">${escapeHtml(product.description || 'Nenhuma descrição disponível.')}</p>
      <button id="addToCartBtn" class="add-to-cart-btn">Adicionar ao Carrinho</button>
    </div>
  `;

  // 5. Adicionar o event listener ao botão
  document.getElementById('addToCartBtn').addEventListener('click', addToCart);
}

// Atualiza o contador do carrinho na tela
function atualizarContador() {
  const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
  const contador = document.getElementById('carrinho-contador');
  if (contador) {
      contador.textContent = carrinho.length;
  }
}

// Adiciona o produto atual ao carrinho no localStorage
function addToCart() {
  if (!currentProduct) {
    alert('Erro: Dados do produto não carregados.');
    return;
  }

  // Obter dados do produto
  const produtoParaAdicionar = {
    id: currentProduct.id,
    nome: currentProduct.name,
    preco: currentProduct.price,
    img: currentProduct.image_url
  };
  
  // Adicionar ao carrinho
  let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
  carrinho.push(produtoParaAdicionar);
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  
  // Atualiza o contador e dá um feedback ao usuário
  atualizarContador();
  alert('Produto adicionado ao carrinho!');
}

function escapeHtml(s) {
    return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Inicia o carregamento quando a página estiver pronta
document.addEventListener('DOMContentLoaded', () => {
    loadProductDetails();
    atualizarContador(); // Garante que o contador esteja correto ao carregar a página
});
