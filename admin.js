// Estado da aplicação, agora persistido no localStorage
let state = {
    products: [],
    finances: [],
    orders: []
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
    // Limpa o formulário e os atributos de edição
    const form = document.getElementById('prodForm');
    form.reset();
    form.removeAttribute('data-editing-id');
    form.removeAttribute('data-editing-image');
    
    // Restaura o título e o botão para o modo de adição
    document.querySelector('#productModal h2').textContent = 'Adicionar Novo Produto';
    document.querySelector('#prodForm button.green').textContent = 'Adicionar Produto';

    document.getElementById('productModal').style.display='block'; 
    document.getElementById('pNome').focus(); 
}
function closeAddProduct(){ 
    document.getElementById('productModal').style.display='none'; 
    document.getElementById('prodForm').reset(); // Limpa o formulário
}

async function saveProduct(e){
    e.preventDefault();

    const form = document.getElementById('prodForm');
    const editingId = form.getAttribute('data-editing-id');

    // Desabilita o botão para evitar cliques duplos
    const submitButton = e.target.querySelector('button.green');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Salvando...';

    const nome = document.getElementById('pNome').value.trim();
    const cat_id = document.getElementById('pCategoria').value;
    const preco = parseFloat(document.getElementById('pPreco').value || 0);
    const estoque = parseInt(document.getElementById('pEstoque').value || 0, 10);
    const desc = document.getElementById('pDescricao').value.trim();
    const imagemFile = document.getElementById('pImagem').files[0];

    let imageUrl = form.getAttribute('data-editing-image') || null;

    if (!nome || !preco || !cat_id) {
        alert('Por favor, preencha nome, categoria e preço do produto.');
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        return;
    }

    if (imagemFile) {
        // Se uma nova imagem for enviada durante a edição, remove a antiga primeiro.
        const oldImageUrl = form.getAttribute('data-editing-image');
        if (editingId && oldImageUrl) {
            const oldImageName = oldImageUrl.split('/').pop();
            await supabase.storage.from('product_images').remove([oldImageName]);
        }
        
        const fileName = `${Date.now()}_${imagemFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('product_images').upload(fileName, imagemFile);

        if (uploadError) {
            console.error('Erro no upload da imagem:', uploadError);
            alert('Falha ao enviar a imagem.');
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            return;
        }
        
        imageUrl = supabase.storage.from('product_images').getPublicUrl(uploadData.path).data.publicUrl;
    }

    const productData = {
        name: nome,
        category_id: cat_id,
        price: preco,
        stock: estoque,
        description: desc,
        image_url: imageUrl
    };

    let error;
    if (editingId) {
        // Modo Edição: faz o UPDATE
        const { error: updateError } = await supabase.from('products').update(productData).eq('id', editingId);
        error = updateError;
    } else {
        // Modo Adição: faz o INSERT
        const { error: insertError } = await supabase.from('products').insert([productData]);
        error = insertError;
    }

    if (error) {
        console.error('Erro ao salvar produto:', error);
        alert('Falha ao salvar o produto. Verifique o console para mais detalhes.');
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        return false;
    }
    
    closeAddProduct();
    fetchAndRenderProducts();
    
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;

    return false;
}

function openEditProduct(product) {
    // Adiciona um ID ao formulário para sabermos que estamos editando
    document.getElementById('prodForm').setAttribute('data-editing-id', product.id);
    document.getElementById('prodForm').setAttribute('data-editing-image', product.image_url || '');

    // Popula os campos do modal
    document.getElementById('pNome').value = product.name;
    document.getElementById('pCategoria').value = product.category_id;
    document.getElementById('pPreco').value = product.price;
    document.getElementById('pEstoque').value = product.stock;
    document.getElementById('pDescricao').value = product.description || '';
    
    // Altera o título e o botão
    document.querySelector('#productModal h2').textContent = 'Editar Produto';
    document.querySelector('#prodForm button.green').textContent = 'Salvar Alterações';

    // Limpa o campo de imagem e abre o modal
    document.getElementById('pImagem').value = '';
    document.getElementById('productModal').style.display = 'block';
}


async function deleteProduct(id, imageUrl) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
        return;
    }

    // Excluir do banco de dados
    const { error: dbError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (dbError) {
        console.error('Erro ao excluir produto:', dbError);
        alert('Não foi possível excluir o produto.');
        return;
    }

    // Excluir imagem do storage, se houver
    if (imageUrl) {
        const imageName = imageUrl.split('/').pop();
        const { error: storageError } = await supabase
            .storage
            .from('product_images')
            .remove([imageName]);
        
        if (storageError) {
            console.error('Erro ao excluir imagem do storage:', storageError);
            // Avisa o usuário mas continua, pois o produto já foi deletado
            alert('Produto excluído, mas houve um erro ao remover a imagem do armazenamento.');
        }
    }

    alert('Produto excluído com sucesso!');
    fetchAndRenderProducts();
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
        // (anteriormente aqui havia um preview de finalizados no dashboard; agora é mostrado apenas na visualização em tabela)
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
      // A consulta agora traz o nome da categoria de 'categories.name'
      const categoryName = prod.categories ? prod.categories.name : 'Sem Categoria';
      const imageUrl = prod.image_url ? `<img src="${prod.image_url}" alt="${escapeHtml(prod.name)}" width="40" height="40" style="object-fit: cover; border-radius: 4px;">` : 'Sem Imagem';
      
      tr.innerHTML = `
        <td>${imageUrl}</td>
        <td>${escapeHtml(prod.name)}</td>
        <td>${escapeHtml(categoryName)}</td>
        <td>R$ ${Number(prod.price).toFixed(2)}</td>
        <td>${prod.stock}</td>
        <td>${status}</td>
        <td>
            <button class="btn grey" onclick='openEditProduct(${JSON.stringify(prod)})'>Editar</button>
            <button class="btn red" onclick="deleteProduct(${prod.id}, '${prod.image_url}')">Excluir</button>
        </td>
      `;
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

async function renderCategoriesTable() {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
    
    if (error) {
        console.error('Erro ao buscar categorias para a tabela:', error);
        return;
    }

    const catBody = document.getElementById('catBody');
    const catEmpty = document.getElementById('catEmpty');
    catBody.innerHTML = '';

    if (data.length === 0) {
        catEmpty.style.display = 'flex';
        document.getElementById('catTable').style.display = 'none';
    } else {
        catEmpty.style.display = 'none';
        document.getElementById('catTable').style.display = 'table';
        data.forEach(cat => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(cat.name)}</td>
                <td>
                    <button class="btn grey" onclick="editCategory(${cat.id}, '${escapeHtml(cat.name)}')">Editar</button>
                    <button class="btn red" onclick="deleteCategory(${cat.id})">Excluir</button>
                </td>
            `;
            catBody.appendChild(tr);
        });
    }
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
    renderCategoriesTable(); // Atualiza a tabela de categorias
}

async function editCategory(id, currentName) {
    const newName = prompt('Digite o novo nome para a categoria:', currentName);
    if (!newName || newName.trim() === '' || newName.trim() === currentName) {
        return; // Usuário cancelou ou não alterou o nome
    }

    const { error } = await supabase
        .from('categories')
        .update({ name: newName.trim() })
        .eq('id', id);

    if (error) {
        console.error('Erro ao editar categoria:', error);
        alert('Não foi possível editar a categoria.');
        return;
    }

    alert('Categoria atualizada com sucesso!');
    fetchAndPopulateCategories();
    renderCategoriesTable();
}

async function deleteCategory(id) {
    if (!confirm('Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.')) {
        return;
    }

    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erro ao excluir categoria:', error);
        alert('Não foi possível excluir a categoria. Verifique se ela não está sendo usada por nenhum produto.');
        return;
    }

    alert('Categoria excluída com sucesso!');
    fetchAndPopulateCategories();
    renderCategoriesTable();
}


// Orders: filter state and view
let orderFilter = 'all'; // all | pending | shipped | canceled
let ordersView = 'cards'; // 'cards' or 'table'

function setOrderFilter(f){
    orderFilter = f;
    document.querySelectorAll('[id^="filter"]').forEach(b=>b.classList.remove('active'));
    const el = document.getElementById('filter' + (f==='all' ? 'All' : (f==='pending' ? 'Pending' : (f==='shipped' ? 'Shipped' : 'Canceled'))));
    if(el) el.classList.add('active');
    renderOrdersList();
}

function toggleOrdersView(){
    ordersView = ordersView === 'cards' ? 'table' : 'cards';
    document.getElementById('toggleViewBtn').innerText = ordersView === 'cards' ? 'Alternar visualização' : 'Alternar visualização';
    renderOrdersList();
}

function formatDateShort(iso){
    try{ const d = new Date(iso); return d.toLocaleString(); } catch(e){ return iso; }
}

async function fetchAndRenderOrders(){
    // tenta buscar pedidos do Supabase. Se falhar, usa dados de exemplo para permitir desenvolvimento local.
    try{
        const { data, error } = await supabase
            .from('orders')
            .select(`*, customer ( * )`)
            .order('created_at', { ascending: false });

        if(error){
            console.warn('Erro ao buscar pedidos:', error);
            // fallback para demo
            state.orders = sampleOrders();
        } else {
            // adapta para formato esperado
            state.orders = (data || []).map(o=>({
                id: o.id,
                status: o.status || 'pending',
                total: o.total || 0,
                created_at: o.created_at,
                items: o.items || [],
                customer: o.customer || { name: o.customer_name || 'Sem nome', email: o.customer_email || '', phone: o.customer_phone || '' }
            }));
        }
    } catch(e){
        console.error('Erro inesperado ao buscar pedidos:', e);
        state.orders = sampleOrders();
    }

    renderOrdersList();
}

function sampleOrders(){
    // Gera 15 pedidos fictícios variados para simulação visual
    return Array.from({length: 15}, (_, i) => {
        const statuses = ['pending', 'shipped', 'canceled', 'finalized'];
        const nomes = ['Maria Silva', 'João Souza', 'Ana Pereira', 'Carlos Lima', 'Fernanda Costa', 'Lucas Rocha', 'Patrícia Alves', 'Rafael Torres', 'Juliana Melo', 'Bruno Dias', 'Larissa Ramos', 'Eduardo Martins', 'Camila Freitas', 'Gabriel Pinto', 'Sofia Duarte'];
        const produtos = ['Camisa F', 'Calça M', 'Meia', 'Moletom', 'Sapato', 'Tênis', 'Blusa', 'Jaqueta', 'Saia', 'Short', 'Vestido', 'Sandália', 'Boné', 'Cinto', 'Óculos'];
        const status = statuses[i % statuses.length];
        const nome = nomes[i % nomes.length];
        const produto = produtos[i % produtos.length];
        return {
            id: 1001 + i,
            status,
            total: (Math.random() * 400 + 30).toFixed(2),
            created_at: new Date(Date.now() - i * 3600 * 1000 * 6).toISOString(),
            items: [{name: produto, qty: Math.floor(Math.random()*3)+1}],
            customer: {
                name: nome,
                email: nome.toLowerCase().replace(/ /g, '.') + '@example.com',
                phone: `(1${i%9}) 9${Math.floor(Math.random()*90000)+10000}-${Math.floor(Math.random()*9000)+1000}`
            }
        };
    });
}

function statusBadge(status){
    if(status === 'pending') return '<span class="badge-order badge-pending">Pendente</span>';
    if(status === 'shipped') return '<span class="badge-order badge-shipped">Enviado</span>';
    if(status === 'canceled') return '<span class="badge-order badge-canceled">Cancelado</span>';
    if(!status) status = 'pending';
    status = status.toLowerCase();
    if(status === 'pending') return '<span class="badge-order badge-pending">Pendente</span>';
    if(status === 'shipped') return '<span class="badge-order badge-shipped">Enviado</span>';
    if(status === 'canceled') return '<span class="badge-order badge-canceled">Cancelado</span>';
    if(status === 'finalized' || status === 'finalizado') return '<span class="badge-order badge-finalized">Finalizado</span>';
    return `<span class="badge-order badge-pending">${escapeHtml(status)}</span>`;
}

function renderOrdersList(){
    const container = document.getElementById('ordersList');
    const empty = document.getElementById('ordersEmpty');
    if(!container) return;

    const q = (document.getElementById('ordersSearch')?.value || '').toLowerCase().trim();
    let list = (state.orders || []).slice();
    if(orderFilter !== 'all') list = list.filter(o=>o.status === orderFilter);
    if(q) list = list.filter(o=>{
        const c = o.customer || {};
        return (String(o.id).includes(q) || (c.name||'').toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q) || (c.phone||'').toLowerCase().includes(q));
    });

    if(list.length === 0){ container.innerHTML = ''; empty.style.display = 'flex'; return; }
    empty.style.display = 'none';

    // Função global para alterar status
    window.changeOrderStatus = function(id, selectEl){
        const o = (state.orders||[]).find(x=>String(x.id)===String(id));
        if(!o) return alert('Pedido não encontrado.');
        const statusMap = {
            'pendente': 'pending',
            'enviado': 'shipped',
            'cancelado': 'canceled',
            'finalizado': 'finalized'
        };
        const value = selectEl.value;
        o.status = statusMap[value] || 'pending';
        renderOrdersList();
    };
    window.openOrderStatusModal = function(id){
        const o = (state.orders||[]).find(x=>String(x.id)===String(id));
        if(!o) return alert('Pedido não encontrado.');
        document.getElementById('orderStatusModal').style.display = 'block';
        document.getElementById('statusOrderId').innerText = '#' + o.id;
        const st = (o.status||'pending').toLowerCase();
        const select = document.getElementById('modalStatusSelect');
        select.value = st==='pending'?'pendente':st==='shipped'?'enviado':st==='canceled'?'cancelado':'finalizado';
        select.setAttribute('data-order-id', o.id);
    };
    window.closeOrderStatusModal = function(){
        document.getElementById('orderStatusModal').style.display = 'none';
    };
    window.confirmOrderStatusModal = function(){
        const select = document.getElementById('modalStatusSelect');
        const id = select.getAttribute('data-order-id');
        const o = (state.orders||[]).find(x=>String(x.id)===String(id));
        if(!o) return closeOrderStatusModal();
        const statusMap = {
            'pendente': 'pending',
            'enviado': 'shipped',
            'cancelado': 'canceled',
            'finalizado': 'finalized'
        };
        o.status = statusMap[select.value] || 'pending';
        closeOrderStatusModal();
        renderOrdersList();
    };
    if(ordersView === 'cards'){
        const html = list.map(o=>{
            const st = (o.status||'pending').toLowerCase();
            return `
                <div class="order-card status-${st}" onclick="showOrderDetailsById(${o.id})" style="cursor:pointer">
                    <div class="order-row">
                        <div><strong>Pedido #${o.id}</strong></div>
                        <div>${statusBadge(o.status)}</div>
                    </div>
                    <div class="order-meta">Cliente: ${escapeHtml(o.customer?.name || '')} — ${escapeHtml(o.customer?.email || '')} — ${escapeHtml(o.customer?.phone || '')}</div>
                    <div class="order-row">
                        <div class="order-meta">Itens: ${o.items?.length || 0}</div>
                        <div class="order-meta">Total: R$ ${Number(o.total||0).toFixed(2)}</div>
                    </div>
                    <div class="order-meta">Criado em: ${formatDateShort(o.created_at)}</div>
                    <div style="margin-top:10px;">
                        <button class="btn orange" onclick="openOrderStatusModal(${o.id});event.stopPropagation();">Alterar Status</button>
                    </div>
                </div>
            `;}).join('');
        container.innerHTML = '';
        const wrapper = document.createElement('div'); wrapper.className = 'orders-list'; wrapper.innerHTML = html;
        container.appendChild(wrapper);
        const previewEl = document.getElementById('finalizedPreview'); if(previewEl){ previewEl.style.display = 'none'; previewEl.innerText = ''; }
    } else {
        // table view
        const htmlRows = list.map(o=>{
            const st = (o.status||'pending').toLowerCase();
            return `
                <tr class="status-${st}" onclick="showOrderDetailsById(${o.id})" style="cursor:pointer">
                    <td>#${o.id}</td>
                    <td>${escapeHtml(o.customer?.name || '')}<br><small class="text-muted">${escapeHtml(o.customer?.email || '')} • ${escapeHtml(o.customer?.phone || '')}</small></td>
                    <td>
                        <button class="btn orange" onclick="openOrderStatusModal(${o.id});event.stopPropagation();">Alterar Status</button>
                    </td>
                    <td>R$ ${Number(o.total||0).toFixed(2)}</td>
                    <td>${formatDateShort(o.created_at)}</td>
                    <td></td>
                </tr>
            `;
        }).join('');
        container.innerHTML = `
            <div class="table-responsive">
              <table class="table table-hover">
                <thead><tr><th>Pedido</th><th>Solicitante</th><th>Status</th><th>Total</th><th>Criado em</th><th></th></tr></thead>
                <tbody>${htmlRows}</tbody>
              </table>
            </div>
        `;
        // preencher preview de finalizados apenas na visualização em tabela
        const finalizedCount = (list || []).filter(o=> (o.status||'').toString().toLowerCase() === 'finalized' || (o.status||'').toString().toLowerCase() === 'finalizado').length;
        const previewEl = document.getElementById('finalizedPreview');
        if(previewEl){
            if(finalizedCount > 0){
                const sampleProduct = (state.products && state.products.length>0) ? state.products[0] : null;
                if(sampleProduct){
                    const img = sampleProduct.image_url ? `<img src="${sampleProduct.image_url}" alt="${escapeHtml(sampleProduct.name)}" style="width:28px;height:28px;object-fit:cover;border-radius:6px;margin-right:8px;vertical-align:middle">` : '';
                    previewEl.innerHTML = `${img}<span style="vertical-align:middle">${finalizedCount} pedido(s) finalizado(s) — <strong>${escapeHtml(sampleProduct.name)}</strong> • R$ ${Number(sampleProduct.price||0).toFixed(2)}</span>`;
                } else {
                    previewEl.innerText = `${finalizedCount} pedido(s) finalizado(s)`;
                }
                previewEl.style.display = 'block';
            } else {
                previewEl.style.display = 'none';
                previewEl.innerText = '';
            }
        }
    }
}

// Order details modal
function showOrderDetails(order){
    const o = typeof order === 'string' ? JSON.parse(order) : order;
    document.getElementById('detailOrderId').innerText = `#${o.id}`;
    document.getElementById('detailStatus').innerHTML = `<strong>Status:</strong> ${statusBadge(o.status)}`;
    document.getElementById('detailCustomer').innerHTML = `<strong>Solicitante:</strong> ${escapeHtml(o.customer?.name||'')}<br>${escapeHtml(o.customer?.email||'')} • ${escapeHtml(o.customer?.phone||'')}`;
    const itemsHtml = (o.items||[]).map(i=>`<div>${escapeHtml(i.name || i.title || '')} x ${i.qty||i.quantity||1} — R$ ${Number(i.price||0).toFixed(2)}</div>`).join('');
    document.getElementById('detailItems').innerHTML = `<strong>Itens:</strong><div style="margin-top:6px">${itemsHtml || '<div>(Nenhum item)</div>'}</div>`;
    document.getElementById('detailTotal').innerHTML = `<strong>Total:</strong> R$ ${Number(o.total||0).toFixed(2)}`;
    document.getElementById('detailCreated').innerHTML = `<strong>Criado em:</strong> ${formatDateShort(o.created_at)}`;
    document.getElementById('orderDetailModal').style.display = 'block';
}

function closeOrderDetails(){
    document.getElementById('orderDetailModal').style.display = 'none';
}

function showOrderDetailsById(id){
    const o = (state.orders || []).find(x=>String(x.id) === String(id));
    if(!o) return alert('Pedido não encontrado.');
    showOrderDetails(o);
}

// Close modals when clicking outside content
window.addEventListener('click', function(e){
    const modal = document.getElementById('orderDetailModal');
    if(modal && e.target === modal){
        modal.style.display = 'none';
    }
    const pModal = document.getElementById('productModal');
    if(pModal && e.target === pModal){
        pModal.style.display = 'none';
    }
});

// integra chamada ao init
function init(){
    loadState(); // Carrega o estado salvo (apenas finanças)
    refreshUI();
    showPage('panel');
    fetchAndRenderProducts(); // Busca e renderiza os produtos do Supabase
    fetchAndPopulateCategories(); // Busca e preenche as categorias no modal
    renderCategoriesTable(); // Busca e renderiza a tabela de categorias
    fetchAndRenderOrders(); // Busca e renderiza pedidos
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
