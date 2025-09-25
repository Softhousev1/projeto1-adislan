// Checkout.js - Lógica para gerenciar o carrinho e lista de desejos
document.addEventListener('DOMContentLoaded', function() {
    console.log('[checkout] Inicializando página de checkout');
    
    // Elementos do DOM
    const cartItemsContainer = document.getElementById('cart-items-container');
    const emptyCartMessage = document.getElementById('empty-cart');
    const wishlistContainer = document.getElementById('wishlist-container');
    const emptyWishlistMessage = document.getElementById('empty-wishlist');
    const wishlistLoginPrompt = document.getElementById('wishlist-login-prompt');
    const subtotalElement = document.getElementById('subtotal');
    const shippingElement = document.getElementById('shipping');
    const totalElement = document.getElementById('total');
    const checkoutButton = document.getElementById('btn-checkout');
    
    // Carregar carrinho e lista de desejos
    loadCart();
    loadWishlist();
    
    // Adicionar evento ao botão de checkout
    checkoutButton.addEventListener('click', function() {
        processCheckout();
    });
    
    /**
     * Carrega e exibe os itens do carrinho
     */
    function loadCart() {
        // Obter itens do carrinho do localStorage
        const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
        
        // Verificar se o carrinho está vazio
        if (carrinho.length === 0) {
            cartItemsContainer.innerHTML = '';
            emptyCartMessage.style.display = 'block';
            updateCartSummary(0);
            return;
        }
        
        // Esconder mensagem de carrinho vazio
        emptyCartMessage.style.display = 'none';
        
        // Limpar container
        cartItemsContainer.innerHTML = '';
        
        // Calcular subtotal
        let subtotal = 0;
        
        // Adicionar cada item ao container
        carrinho.forEach((item, index) => {
            // Calcular preço do item
            const itemPrice = parseFloat(item.preco);
            subtotal += itemPrice;
            
            // Criar elemento do item
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <img src="${item.img || './img/placeholder.png'}" alt="${item.nome}" class="cart-item-img">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.nome}</div>
                    <div class="cart-item-price">R$ ${itemPrice.toFixed(2)}</div>
                </div>
                <div class="cart-item-actions">
                    <button class="btn-remove" data-index="${index}">Remover</button>
                </div>
            `;
            
            // Adicionar ao container
            cartItemsContainer.appendChild(itemElement);
            
            // Adicionar evento ao botão de remover
            itemElement.querySelector('.btn-remove').addEventListener('click', function() {
                removeFromCart(index);
            });
        });
        
        // Atualizar resumo do carrinho
        updateCartSummary(subtotal);
    }
    
    /**
     * Carrega e exibe os itens da lista de desejos
     */
    function loadWishlist() {
        // Verificar se o usuário está logado
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        
        if (!loggedInUser) {
            // Usuário não está logado
            wishlistContainer.innerHTML = '';
            wishlistLoginPrompt.style.display = 'block';
            emptyWishlistMessage.style.display = 'none';
            return;
        }
        
        // Usuário está logado, esconder prompt de login
        wishlistLoginPrompt.style.display = 'none';
        
        // Obter lista de desejos do localStorage
        const wishlist = JSON.parse(localStorage.getItem(`wishlist_${loggedInUser.email}`)) || [];
        
        // Verificar se a lista de desejos está vazia
        if (wishlist.length === 0) {
            wishlistContainer.innerHTML = '';
            emptyWishlistMessage.style.display = 'block';
            return;
        }
        
        // Esconder mensagem de lista vazia
        emptyWishlistMessage.style.display = 'none';
        
        // Limpar container
        wishlistContainer.innerHTML = '';
        
        // Adicionar cada item à lista de desejos
        wishlist.forEach((item, index) => {
            // Criar elemento do item
            const itemElement = document.createElement('div');
            itemElement.className = 'wishlist-item';
            itemElement.innerHTML = `
                <img src="${item.img || './img/placeholder.png'}" alt="${item.nome}" class="cart-item-img">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.nome}</div>
                    <div class="cart-item-price">R$ ${parseFloat(item.preco).toFixed(2)}</div>
                </div>
                <div class="cart-item-actions">
                    <button class="btn-checkout" data-index="${index}">Adicionar ao Carrinho</button>
                    <button class="btn-remove" data-index="${index}">Remover</button>
                </div>
            `;
            
            // Adicionar ao container
            wishlistContainer.appendChild(itemElement);
            
            // Adicionar evento ao botão de adicionar ao carrinho
            itemElement.querySelector('.btn-checkout').addEventListener('click', function() {
                moveToCart(index);
            });
            
            // Adicionar evento ao botão de remover
            itemElement.querySelector('.btn-remove').addEventListener('click', function() {
                removeFromWishlist(index);
            });
        });
    }
    
    /**
     * Atualiza o resumo do carrinho com os valores calculados
     */
    function updateCartSummary(subtotal) {
        // Calcular frete (exemplo simples: frete fixo de R$ 10,00 para compras abaixo de R$ 100)
        const shipping = subtotal > 0 && subtotal < 100 ? 10 : 0;
        const total = subtotal + shipping;
        
        // Atualizar elementos na interface
        subtotalElement.textContent = `R$ ${subtotal.toFixed(2)}`;
        shippingElement.textContent = shipping > 0 ? `R$ ${shipping.toFixed(2)}` : 'Grátis';
        totalElement.textContent = `R$ ${total.toFixed(2)}`;
        
        // Desabilitar botão de checkout se o carrinho estiver vazio
        checkoutButton.disabled = subtotal <= 0;
    }
    
    /**
     * Remove um item do carrinho
     */
    function removeFromCart(index) {
        // Obter carrinho atual
        let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
        
        // Remover item pelo índice
        carrinho.splice(index, 1);
        
        // Salvar carrinho atualizado
        localStorage.setItem('carrinho', JSON.stringify(carrinho));
        
        // Atualizar contador no cabeçalho
        updateCartCounter();
        
        // Recarregar itens do carrinho
        loadCart();
    }
    
    /**
     * Remove um item da lista de desejos
     */
    function removeFromWishlist(index) {
        // Verificar se o usuário está logado
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!loggedInUser) return;
        
        // Obter lista de desejos atual
        let wishlist = JSON.parse(localStorage.getItem(`wishlist_${loggedInUser.email}`)) || [];
        
        // Remover item pelo índice
        wishlist.splice(index, 1);
        
        // Salvar lista atualizada
        localStorage.setItem(`wishlist_${loggedInUser.email}`, JSON.stringify(wishlist));
        
        // Recarregar lista de desejos
        loadWishlist();
    }
    
    /**
     * Move um item da lista de desejos para o carrinho
     */
    function moveToCart(index) {
        // Verificar se o usuário está logado
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!loggedInUser) return;
        
        // Obter lista de desejos atual
        let wishlist = JSON.parse(localStorage.getItem(`wishlist_${loggedInUser.email}`)) || [];
        
        // Verificar se o índice é válido
        if (index < 0 || index >= wishlist.length) return;
        
        // Obter o item a ser movido
        const item = wishlist[index];
        
        // Adicionar ao carrinho
        let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
        carrinho.push(item);
        localStorage.setItem('carrinho', JSON.stringify(carrinho));
        
        // Remover da lista de desejos
        wishlist.splice(index, 1);
        localStorage.setItem(`wishlist_${loggedInUser.email}`, JSON.stringify(wishlist));
        
        // Atualizar contador do carrinho
        updateCartCounter();
        
        // Recarregar ambas as listas
        loadCart();
        loadWishlist();
    }
    
    /**
     * Atualiza o contador do carrinho no cabeçalho
     */
    function updateCartCounter() {
        // Obter carrinho atual
        const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
        
        // Atualizar contador
        const contador = document.getElementById('carrinho-contador');
        if (contador) {
            contador.textContent = carrinho.length;
        }
    }
    
    /**
     * Processa o checkout (finalização da compra)
     */
    function processCheckout() {
        // Verificar se o usuário está logado
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        
        if (!loggedInUser) {
            // Redirecionar para página de login
            alert('Por favor, faça login para finalizar a compra.');
            window.location.href = 'login.html?redirect=checkout.html';
            return;
        }
        
        // Verificar se o carrinho tem itens
        const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
        if (carrinho.length === 0) {
            alert('Seu carrinho está vazio.');
            return;
        }
        
        // Aqui seria implementada a lógica de processamento do pagamento
        // Por enquanto, apenas simulamos um checkout bem-sucedido
        
        alert('Compra finalizada com sucesso! Obrigado por comprar conosco.');
        
        // Limpar o carrinho
        localStorage.setItem('carrinho', JSON.stringify([]));
        
        // Atualizar interface
        updateCartCounter();
        loadCart();
    }
});

/**
 * Função para adicionar um produto à lista de desejos
 * Esta função é exportada para ser usada em outras páginas
 */
function addToWishlist(product) {
    // Verificar se o usuário está logado
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    
    if (!loggedInUser) {
        alert('Por favor, faça login para adicionar produtos à lista de desejos.');
        return false;
    }
    
    // Obter lista de desejos atual
    let wishlist = JSON.parse(localStorage.getItem(`wishlist_${loggedInUser.email}`)) || [];
    
    // Verificar se o produto já está na lista
    const existingProduct = wishlist.find(item => item.id === product.id);
    if (existingProduct) {
        alert('Este produto já está na sua lista de desejos.');
        return false;
    }
    
    // Adicionar produto à lista
    wishlist.push(product);
    
    // Salvar lista atualizada
    localStorage.setItem(`wishlist_${loggedInUser.email}`, JSON.stringify(wishlist));
    
    alert('Produto adicionado à lista de desejos!');
    return true;
}

// Exportar função para uso global
window.addToWishlist = addToWishlist;
