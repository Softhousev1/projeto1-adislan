// payment.js - Script para a página de pagamento

// Configurações do Mercado Pago
const MERCADO_PAGO_PUBLIC_KEY = 'APP_USR-38686b62-6d55-4c0f-8d9a-487f1a3bbb25';
// As credenciais de acesso (access token, client id, client secret) devem ser usadas apenas no backend

document.addEventListener('DOMContentLoaded', function() {
    console.log('[payment] Inicializando página de pagamento');
    
    // Carregar dados do carrinho e do usuário
    loadCartData();
    loadUserData();
    
    // Configurar eventos
    setupCepSearch();
    setupFormValidation();
    
    // Inicializar Mercado Pago
    initMercadoPago();
    
    // Botão finalizar pagamento
    document.getElementById('btn-finalizar-pagamento').addEventListener('click', processPayment);
});

/**
 * Carrega os dados do carrinho do localStorage e exibe na página
 */
function loadCartData() {
    // Obter itens do carrinho do localStorage
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    const productList = document.getElementById('product-list');
    
    // Limpar a lista
    productList.innerHTML = '';
    
    // Calcular subtotal
    let subtotal = 0;
    
    // Adicionar cada item à lista
    carrinho.forEach(item => {
        // Calcular preço do item
        const itemPrice = parseFloat(item.preco);
        subtotal += itemPrice;
        
        // Criar elemento do item
        const itemElement = document.createElement('div');
        itemElement.className = 'product-item';
        itemElement.innerHTML = `
            <img src="${item.img || './img/placeholder.png'}" alt="${item.nome}" class="product-item-img">
            <div class="product-item-details">
                <div class="product-item-name">${item.nome}</div>
                <div class="product-item-price">R$ ${itemPrice.toFixed(2)}</div>
            </div>
        `;
        
        // Adicionar ao container
        productList.appendChild(itemElement);
    });
    
    // Atualizar resumo do carrinho
    updateCartSummary(subtotal);
}

/**
 * Atualiza o resumo do carrinho com os valores calculados
 */
function updateCartSummary(subtotal) {
    // Calcular frete (exemplo simples: frete fixo de R$ 10,00 para compras abaixo de R$ 100)
    const shipping = subtotal > 0 && subtotal < 100 ? 10 : 0;
    const total = subtotal + shipping;
    
    // Atualizar elementos na interface
    document.getElementById('subtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = shipping > 0 ? `R$ ${shipping.toFixed(2)}` : 'Grátis';
    document.getElementById('total').textContent = `R$ ${total.toFixed(2)}`;
}

/**
 * Carrega os dados do usuário logado e preenche o formulário
 */
function loadUserData() {
    // Verificar se o usuário está logado
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    
    if (loggedInUser) {
        // Preencher campos de dados pessoais
        if (loggedInUser.email) {
            document.getElementById('email').value = loggedInUser.email;
        }
        
        if (loggedInUser.nome) {
            document.getElementById('nome').value = loggedInUser.nome;
        }
        
        if (loggedInUser.telefone) {
            document.getElementById('telefone').value = loggedInUser.telefone;
        }
        
        // Preencher campos de endereço se disponíveis
        if (loggedInUser.endereco) {
            const endereco = loggedInUser.endereco;
            
            if (endereco.cep) document.getElementById('cep').value = endereco.cep;
            if (endereco.rua) document.getElementById('rua').value = endereco.rua;
            if (endereco.numero) document.getElementById('numero').value = endereco.numero;
            if (endereco.complemento) document.getElementById('complemento').value = endereco.complemento;
            if (endereco.bairro) document.getElementById('bairro').value = endereco.bairro;
            if (endereco.cidade) document.getElementById('cidade').value = endereco.cidade;
            if (endereco.estado) document.getElementById('estado').value = endereco.estado;
        }
    }
}

/**
 * Configura a busca de CEP para autopreenchimento de endereço
 */
function setupCepSearch() {
    const cepInput = document.getElementById('cep');
    
    cepInput.addEventListener('blur', function() {
        const cep = cepInput.value.replace(/\D/g, '');
        
        if (cep.length !== 8) {
            return;
        }
        
        // Mostrar indicador de carregamento
        cepInput.classList.add('is-loading');
        
        // Fazer requisição à API ViaCEP
        fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then(response => response.json())
            .then(data => {
                if (!data.erro) {
                    document.getElementById('rua').value = data.logradouro;
                    document.getElementById('bairro').value = data.bairro;
                    document.getElementById('cidade').value = data.localidade;
                    document.getElementById('estado').value = data.uf;
                    
                    // Focar no campo número após preenchimento
                    document.getElementById('numero').focus();
                }
            })
            .catch(error => {
                console.error('Erro ao buscar CEP:', error);
            })
            .finally(() => {
                // Remover indicador de carregamento
                cepInput.classList.remove('is-loading');
            });
    });
    
    // Formatar CEP enquanto digita
    cepInput.addEventListener('input', function() {
        let value = cepInput.value.replace(/\D/g, '');
        
        if (value.length > 5) {
            cepInput.value = `${value.substring(0, 5)}-${value.substring(5, 8)}`;
        } else {
            cepInput.value = value;
        }
    });
}

/**
 * Inicializa o Mercado Pago
 */
function initMercadoPago() {
    // Inicializar o SDK do Mercado Pago
    if (typeof MercadoPago !== 'undefined') {
        console.log('[payment] Inicializando SDK do Mercado Pago');
        
        // Configurar o SDK com a chave pública
        const mp = new MercadoPago(MERCADO_PAGO_PUBLIC_KEY);
        
        // Salvar a instância para uso posterior
        window.mercadoPagoInstance = mp;
    } else {
        console.error('[payment] SDK do Mercado Pago não carregado');
        
        // Adicionar um listener para verificar quando o SDK estiver disponível
        window.addEventListener('mercadopago-loaded', function() {
            console.log('[payment] SDK do Mercado Pago carregado posteriormente');
            const mp = new MercadoPago(MERCADO_PAGO_PUBLIC_KEY);
            window.mercadoPagoInstance = mp;
        });
    }
}

/**
 * Configura a validação do formulário
 */
function setupFormValidation() {
    const form = document.getElementById('paymentForm');
    
    // Adicionar classe de validação do Bootstrap aos campos
    form.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('blur', function() {
            if (input.required && !input.value) {
                input.classList.add('is-invalid');
            } else {
                input.classList.remove('is-invalid');
            }
        });
        
        input.addEventListener('input', function() {
            if (input.classList.contains('is-invalid') && input.value) {
                input.classList.remove('is-invalid');
            }
        });
    });
}

/**
 * Valida o formulário de pagamento
 * @returns {boolean} True se o formulário for válido, false caso contrário
 */
function validateForm() {
    const form = document.getElementById('paymentForm');
    let isValid = true;
    
    // Verificar campos obrigatórios
    form.querySelectorAll('input[required], select[required]').forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
        }
    });
    
    // Validar formato de e-mail
    const emailInput = document.getElementById('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailInput.value && !emailRegex.test(emailInput.value)) {
        emailInput.classList.add('is-invalid');
        isValid = false;
    }
    
    // Validar formato de telefone
    const telefoneInput = document.getElementById('telefone');
    const telefoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
    if (telefoneInput.value && !telefoneRegex.test(telefoneInput.value)) {
        telefoneInput.classList.add('is-invalid');
        isValid = false;
    }
    
    // Verificar método de pagamento selecionado
    const selectedMethod = document.querySelector('.payment-method.active');
    if (!selectedMethod) {
        isValid = false;
        alert('Por favor, selecione um método de pagamento.');
    } else {
        const method = selectedMethod.getAttribute('data-method');
        
        // Validar campos específicos do método de pagamento
        if (method === 'credit' || method === 'debit') {
            const cardNumber = document.getElementById('card-number');
            const cardName = document.getElementById('card-name');
            const cardExpiry = document.getElementById('card-expiry');
            const cardCvv = document.getElementById('card-cvv');
            
            if (!cardNumber.value || !cardName.value || !cardExpiry.value || !cardCvv.value) {
                isValid = false;
                
                if (!cardNumber.value) cardNumber.classList.add('is-invalid');
                if (!cardName.value) cardName.classList.add('is-invalid');
                if (!cardExpiry.value) cardExpiry.classList.add('is-invalid');
                if (!cardCvv.value) cardCvv.classList.add('is-invalid');
            }
        }
    }
    
    // Mostrar alerta de validação se necessário
    const validationAlert = document.getElementById('payment-validation-alert');
    validationAlert.style.display = isValid ? 'none' : 'block';
    
    return isValid;
}

/**
 * Processa o pagamento usando o Mercado Pago
 */
function processPayment() {
    // Validar formulário
    if (!validateForm()) {
        // Rolar até o primeiro campo inválido
        const firstInvalid = document.querySelector('.is-invalid');
        if (firstInvalid) {
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // Mostrar alerta de validação
        document.getElementById('payment-validation-alert').style.display = 'block';
        return;
    }
    
    // Ocultar alerta de validação
    document.getElementById('payment-validation-alert').style.display = 'none';
    
    // Obter dados do formulário
    const formData = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        endereco: {
            cep: document.getElementById('cep').value,
            rua: document.getElementById('rua').value,
            numero: document.getElementById('numero').value,
            complemento: document.getElementById('complemento').value || '',
            bairro: document.getElementById('bairro').value,
            cidade: document.getElementById('cidade').value,
            estado: document.getElementById('estado').value
        }
    };
    
    // Obter dados do carrinho
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    
    // Calcular valores
    let subtotal = 0;
    const items = carrinho.map(item => {
        const price = parseFloat(item.preco);
        subtotal += price;
        
        return {
            id: item.id,
            title: item.nome,
            quantity: 1,
            unit_price: price
        };
    });
    
    // Calcular frete
    const shipping = subtotal > 0 && subtotal < 100 ? 10 : 0;
    const total = subtotal + shipping;
    
    // Preparar dados para o Mercado Pago
    const paymentData = {
        items: items,
        payer: {
            name: formData.nome,
            email: formData.email,
            phone: {
                area_code: formData.telefone.substring(1, 3),
                number: formData.telefone.replace(/\D/g, '').substring(2)
            },
            address: {
                zip_code: formData.endereco.cep.replace('-', ''),
                street_name: formData.endereco.rua,
                street_number: formData.endereco.numero
            }
        },
        shipments: {
            cost: shipping,
            mode: "custom"
        },
        back_urls: {
            success: window.location.origin + "/index.html?payment=success",
            failure: window.location.origin + "/payment.html?status=failure",
            pending: window.location.origin + "/index.html?payment=pending"
        },
        auto_return: "approved",
        external_reference: "ORDER_" + new Date().getTime()
    };
    
    console.log('[payment] Dados para o Mercado Pago:', paymentData);
    
    // Desabilitar botão de pagamento e mostrar loading
    const paymentButton = document.getElementById('btn-finalizar-pagamento');
    const originalText = paymentButton.textContent;
    paymentButton.disabled = true;
    paymentButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Redirecionando para pagamento...';
    
    // Em um ambiente real, aqui seria feita uma chamada ao backend para criar a preferência
    // O backend usaria o access token para criar a preferência e retornaria o ID
    // Aqui estamos simulando esse processo
    
    // Simular uma chamada ao backend
    setTimeout(() => {
        try {
            // Salvar endereço no localStorage para uso futuro
            const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')) || {};
            loggedInUser.endereco = formData.endereco;
            localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
            
            // Simular redirecionamento para o Mercado Pago
            redirectToMercadoPago(paymentData);
        } catch (error) {
            console.error('[payment] Erro ao processar pagamento:', error);
            alert('Erro ao processar pagamento. Por favor, tente novamente mais tarde.');
            
            // Restaurar botão
            paymentButton.disabled = false;
            paymentButton.textContent = originalText;
        }
    }, 1500);
}

/**
 * Redireciona para o checkout do Mercado Pago
 * @param {Object} paymentData Dados do pagamento
 */
function redirectToMercadoPago(paymentData) {
    // Em um ambiente real, o backend retornaria o ID da preferência
    // Aqui estamos simulando esse processo
    
    // Limpar carrinho após redirecionamento
    localStorage.setItem('carrinho', JSON.stringify([]));
    
    // Redirecionar para uma URL simulada do Mercado Pago
    // Em produção, isso seria gerado pelo backend usando o SDK do Mercado Pago
    const mercadoPagoUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=SIMULATED_${Date.now()}`;
    
    // Mostrar uma mensagem antes de redirecionar
    alert('Você será redirecionado para o ambiente seguro do Mercado Pago para finalizar seu pagamento.');
    
    // Redirecionar
    window.location.href = 'index.html?payment=redirect';
}

/**
 * Formata o número do telefone enquanto o usuário digita
 * @param {Event} event Evento de input
 */
function formatPhone(event) {
    let input = event.target;
    let value = input.value.replace(/\D/g, '');
    
    if (value.length <= 10) {
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    } else {
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    }
    
    input.value = value;
}

// Adicionar formatação de telefone
document.addEventListener('DOMContentLoaded', function() {
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', formatPhone);
    }
    
    // Formatar campos de cartão
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function() {
            let value = cardNumberInput.value.replace(/\D/g, '');
            value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
            cardNumberInput.value = value;
        });
    }
    
    const cardExpiryInput = document.getElementById('card-expiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', function() {
            let value = cardExpiryInput.value.replace(/\D/g, '');
            if (value.length > 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            cardExpiryInput.value = value;
        });
    }
    
    const cardCvvInput = document.getElementById('card-cvv');
    if (cardCvvInput) {
        cardCvvInput.addEventListener('input', function() {
            let value = cardCvvInput.value.replace(/\D/g, '');
            cardCvvInput.value = value.substring(0, 3);
        });
    }
});
