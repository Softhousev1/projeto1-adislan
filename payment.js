// payment.js - Script para a página de pagamento

document.addEventListener('DOMContentLoaded', function() {
    console.log('[payment] Inicializando página de pagamento');
    
    // Carregar dados do carrinho e do usuário
    loadCartData();
    loadUserData();
    
    // Configurar eventos
    setupCepSearch();
    setupPaymentMethodSelection();
    setupFormValidation();
    
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
 * Configura a seleção de método de pagamento
 */
function setupPaymentMethodSelection() {
    const paymentMethods = document.querySelectorAll('.payment-method');
    
    // Adicionar evento de clique a cada método de pagamento
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            // Remover classe 'active' de todos os métodos
            paymentMethods.forEach(m => m.classList.remove('active'));
            
            // Adicionar classe 'active' ao método selecionado
            this.classList.add('active');
            
            // Obter o método selecionado
            const selectedMethod = this.getAttribute('data-method');
            
            // Esconder todos os campos de pagamento
            document.querySelectorAll('.payment-fields').forEach(field => {
                field.style.display = 'none';
            });
            
            // Mostrar os campos do método selecionado
            const selectedFields = document.getElementById(`${selectedMethod}-fields`);
            if (selectedFields) {
                selectedFields.style.display = 'block';
            }
        });
    });
    
    // Selecionar o primeiro método por padrão
    if (paymentMethods.length > 0) {
        paymentMethods[0].click();
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
 * Processa o pagamento
 */
function processPayment() {
    // Validar formulário
    if (!validateForm()) {
        // Rolar até o primeiro campo inválido
        const firstInvalid = document.querySelector('.is-invalid');
        if (firstInvalid) {
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    
    // Obter dados do formulário
    const formData = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        endereco: {
            cep: document.getElementById('cep').value,
            rua: document.getElementById('rua').value,
            numero: document.getElementById('numero').value,
            complemento: document.getElementById('complemento').value,
            bairro: document.getElementById('bairro').value,
            cidade: document.getElementById('cidade').value,
            estado: document.getElementById('estado').value
        },
        metodoPagamento: document.querySelector('.payment-method.active').getAttribute('data-method')
    };
    
    // Obter dados do carrinho
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    
    // Preparar dados para envio
    const paymentData = {
        cliente: formData,
        produtos: carrinho,
        total: parseFloat(document.getElementById('total').textContent.replace('R$ ', ''))
    };
    
    console.log('[payment] Processando pagamento:', paymentData);
    
    // Simular chamada à API de pagamento
    simulatePaymentAPI(paymentData);
}

/**
 * Simula uma chamada à API de pagamento
 * @param {Object} data Dados do pagamento
 */
function simulatePaymentAPI(data) {
    // Desabilitar botão de pagamento e mostrar loading
    const paymentButton = document.getElementById('btn-finalizar-pagamento');
    const originalText = paymentButton.textContent;
    paymentButton.disabled = true;
    paymentButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processando...';
    
    // Simular delay de processamento
    setTimeout(() => {
        // Em um ambiente real, aqui seria feita uma chamada fetch para a API de pagamento
        // fetch('/api/pagamento', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify(data)
        // })
        
        // Simular sucesso
        const success = Math.random() > 0.2; // 80% de chance de sucesso
        
        if (success) {
            // Salvar endereço no localStorage para uso futuro
            const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')) || {};
            loggedInUser.endereco = data.cliente.endereco;
            localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
            
            // Limpar carrinho
            localStorage.setItem('carrinho', JSON.stringify([]));
            
            // Redirecionar para página de confirmação
            alert('Pagamento processado com sucesso! Você será redirecionado para a página de confirmação.');
            window.location.href = 'index.html?payment=success';
        } else {
            // Simular erro
            alert('Erro ao processar pagamento. Por favor, verifique seus dados e tente novamente.');
            
            // Restaurar botão
            paymentButton.disabled = false;
            paymentButton.textContent = originalText;
        }
    }, 2000);
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
