// Estado da aplicação, agora persistido no localStorage
let state = {
    products: [],
    finances: []
};

// Carrega o estado do localStorage ao iniciar
function loadState() {
    const savedState = localStorage.getItem('adminState');
    if (savedState) {
        // Apenas as finanças são carregadas do localStorage agora
        state.finances = JSON.parse(savedState).finances || [];
    }
}

// Salva o estado no localStorage
function saveState() {
    // Apenas as finanças são salvas no localStorage agora
    localStorage.setItem('adminState', JSON.stringify({ finances: state.finances }));
}

// Navegação
function navigate(e){
    const el = e.currentTarget;
    const page = el.getAttribute('data-page');
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    el.classList.add('active');
    showPage(page);
}

function showPage(page){
    document.getElementById('pageTitle').innerText = page.charAt(0).toUpperCase() + page.slice(1);
    document.querySelectorAll('.page').forEach(p=>p.style.display='none');
    const el = document.getElementById(page);
    if(el) el.style.display='block';
    
    document.querySelectorAll('.nav-item').forEach(n=>{
      n.classList.toggle('active', n.getAttribute('data-page') === page)
    })
    refreshUI();
}

function showReport(){ alert('Funcionalidade de Relatórios em desenvolvimento.'); }
function showSettings(){ alert('Funcionalidade de Configurações em desenvolvimento.'); }

// Produtos
function openAddProduct(){ 
    document.getElementById('productModal').style.display='block'; 
    document.getElementById('pNome').focus(); 
}
function closeAddProduct(){ 
    document.getElementById('productModal').style.display='none'; 
    document.getElementById('prodForm').reset(); // Limpa o formulário
}

async function addProduct(e){
    e.preventDefault();
    const nome = document.getElementById('pNome').value.trim();
    const cat_id = document.getElementById('pCategoria').value;
    const preco = parseFloat(document.getElementById('pPreco').value || 0);
    const estoque = parseInt(document.getElementById('pEstoque').value || 0, 10);
    const desc = document.getElementById('pDescricao').value.trim();

    // Validação simples
    if (!nome || !preco || !cat_id) {
        alert('Por favor, preencha nome, categoria e preço do produto.');
        return;
    }

    const newProduct = {
        name: nome,
        category_id: cat_id,
        price: preco,
        stock: estoque,
        description: desc
    };

    const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select();

    if (error) {
        console.error('Erro ao adicionar produto:', error);
        alert('Falha ao adicionar o produto. Verifique o console para mais detalhes.');
        return false;
    }
    
    closeAddProduct();
    fetchAndRenderProducts(); // Atualiza a lista de produtos da UI
    showPage('produtos');
    return false;
}

// Financeiro
function toggleFinForm(){ const f=document.getElementById('finForm'); f.style.display = (f.style.display === 'none' || f.style.display === '') ? 'block' : 'none'; }
function addFinance(e){
    e.preventDefault();
    const tipo = document.getElementById('fTipo').value;
    const valor = parseFloat(document.getElementById('fValor').value || 0);
    const cat = document.getElementById('fCategoria').value.trim();
    const desc = document.getElementById('fDescricao').value.trim();
    const id = Date.now();
    state.finances.unshift({id,tipo,valor,cat,desc,date:new Date().toISOString()});
    saveState(); // Salva o estado
    document.getElementById('fValor').value='';
    document.getElementById('fCategoria').value='';
    document.getElementById('fDescricao').value='';
    toggleFinForm();
    refreshUI();
    showPage('financeiro');
    return false;
}

// Atualização da UI
function refreshUI(){
    // summary cards
    document.getElementById('totalProdutos').innerText = state.products.length;
    const receita = state.finances.filter(f=>f.tipo==='receita').reduce((s,i)=>s+i.valor,0);
    const despesas = state.finances.filter(f=>f.tipo==='despesa').reduce((s,i)=>s+i.valor,0);
    document.getElementById('totalReceita').innerText = formatMoney(receita);
    document.getElementById('totalDespesas').innerText = formatMoney(despesas);
    document.getElementById('rReceita').innerText = formatMoney(receita);
    document.getElementById('rDespesas').innerText = formatMoney(despesas);
    document.getElementById('rLucro').innerText = formatMoney(receita - despesas);

    // Tabela de produtos
    const prodBody = document.getElementById('prodBody');
    const stockBody = document.getElementById('stockBody');
    prodBody.innerHTML = '';
    stockBody.innerHTML = '';

    if(state.products.length === 0){
      document.getElementById('prodEmpty').style.display='flex';
      document.getElementById('prodTable').style.display='none';
      document.getElementById('stockEmpty').style.display='flex';
    } else {
      document.getElementById('prodEmpty').style.display='none';
      document.getElementById('prodTable').style.display='table';
      document.getElementById('stockEmpty').style.display='none';
    }

    state.products.forEach(prod=>{
      const status = prod.stock === 0 ? 'Sem estoque' : (prod.stock <= 3 ? 'Estoque baixo' : 'Em estoque');
      const tr = document.createElement('tr');
      // Ajustado para usar os nomes de coluna do Supabase: name, category, price, stock
      // A consulta agora traz o nome da categoria de 'categories.name'
      const categoryName = prod.categories ? prod.categories.name : 'Sem Categoria';
      tr.innerHTML = `<td>${escapeHtml(prod.name)}</td><td>${escapeHtml(categoryName)}</td><td>R$ ${Number(prod.price).toFixed(2)}</td><td>${prod.stock}</td><td>${status}</td>`;
      prodBody.appendChild(tr);

      const tr2 = tr.cloneNode(true);
      stockBody.appendChild(tr2);
    });

    // Financeiro
    const finBody = document.getElementById('finBody');
    finBody.innerHTML = '';
    if(state.finances.length === 0){
      document.getElementById('finEmpty').style.display='flex';
    } else {
      document.getElementById('finEmpty').style.display='none';
    }
    state.finances.forEach(fn=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${fn.tipo === 'receita' ? 'Receita' : 'Despesa'}</td><td>R$ ${fn.valor.toFixed(2)}</td><td>${escapeHtml(fn.cat)}</td><td>${escapeHtml(fn.desc)}</td>`;
      finBody.appendChild(tr);
    });

    // Contagem de estoque
    const em = state.products.filter(p=>p.stock>3).length;
    const baixo = state.products.filter(p=>p.stock>0 && p.stock<=3).length;
    const zero = state.products.filter(p=>p.stock===0).length;
    document.getElementById('estoqueEm').innerText = em;
    document.getElementById('estoqueBaixo').innerText = baixo;
    document.getElementById('estoqueZero').innerText = zero;
    document.getElementById('itensFalta').innerText = baixo + zero;
}

async function fetchAndRenderProducts() {
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            categories ( name )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao buscar produtos:', error);
        alert('Não foi possível carregar os produtos. Verifique o console para mais detalhes.');
        return;
    }
    
    state.products = data;
    refreshUI();
}

async function fetchAndPopulateCategories() {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

    if (error) {
        console.error('Erro ao buscar categorias:', error);
        return;
    }

    const select = document.getElementById('pCategoria');
    select.innerHTML = '<option value="">Selecione uma categoria</option>'; // Opção padrão
    data.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        select.appendChild(option);
    });
}

async function addNewCategory() {
    const categoryName = prompt('Digite o nome da nova categoria:');
    if (!categoryName || categoryName.trim() === '') {
        return; // Usuário cancelou ou não digitou nada
    }

    const { data, error } = await supabase
        .from('categories')
        .insert([{ name: categoryName.trim() }])
        .select();

    if (error) {
        console.error('Erro ao adicionar categoria:', error);
        alert('Não foi possível adicionar a nova categoria. Verifique se ela já existe.');
        return;
    }

    alert('Categoria adicionada com sucesso!');
    fetchAndPopulateCategories(); // Atualiza o dropdown
}


function init(){
    loadState(); // Carrega o estado salvo (apenas finanças)
    refreshUI();
    showPage('panel');
    fetchAndRenderProducts(); // Busca e renderiza os produtos do Supabase
    fetchAndPopulateCategories(); // Busca e preenche as categorias no modal
    document.getElementById('btnNovaCategoria').addEventListener('click', addNewCategory);
}

// Helpers
function formatMoney(v){ return 'R$' + Number(v).toFixed(2); }
function escapeHtml(s){ return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Inicializa a aplicação
init();

// Função de logout
document.getElementById('btnLogout').onclick = async function() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Erro ao fazer logout:', error);
        return;
    }
    // Limpa qualquer estado antigo, se necessário
    localStorage.removeItem('isAdmin'); 
    localStorage.removeItem('adminState'); 
    window.location.href = 'login.html';
};
