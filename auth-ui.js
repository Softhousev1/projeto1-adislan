// Script para gerenciar a UI de autenticação no cabeçalho
(function() {
    // Evita conflitos de variáveis com outros scripts
    console.log('[auth-ui] Inicializando script de autenticação UI');
    
    // Obtém ou cria o cliente Supabase
    let authClient;
    
    // Verifica se já existe um cliente Supabase global
    if (typeof window.supabaseClient !== 'undefined') {
        console.log('[auth-ui] Usando cliente Supabase existente (window.supabaseClient)');
        authClient = window.supabaseClient;
    } else if (typeof window.supabase !== 'undefined') {
        console.log('[auth-ui] Usando cliente Supabase existente (window.supabase)');
        authClient = window.supabase;
    } else {
        console.log('[auth-ui] Aguardando cliente Supabase ser inicializado por outro script');
        // Espera até que o cliente seja inicializado em outro script
        const checkInterval = setInterval(() => {
            if (typeof window.supabaseClient !== 'undefined') {
                console.log('[auth-ui] Cliente Supabase encontrado (window.supabaseClient)');
                authClient = window.supabaseClient;
                clearInterval(checkInterval);
                initializeUI(); // Inicializa a UI quando o cliente estiver disponível
            }
        }, 100);
        
        // Timeout após 5 segundos para evitar espera infinita
        setTimeout(() => {
            if (!authClient) {
                console.error('[auth-ui] Timeout ao aguardar cliente Supabase');
                clearInterval(checkInterval);
                // Fallback para um objeto vazio com métodos vazios para evitar erros
                authClient = {
                    auth: { 
                        getSession: async () => ({ data: { session: null } }),
                        signOut: async () => {}
                    },
                    from: () => ({
                        select: () => ({
                            eq: () => ({
                                single: () => ({ data: null, error: null })
                            })
                        })
                    })
                };
                initializeUI(); // Inicializa a UI mesmo com o cliente fallback
            }
        }, 5000);
        
        // Retorna aqui para evitar a execução do restante do código até que o cliente esteja pronto
        return;
    }

    function updateHeaderUI() {
        console.log('[auth-ui] Atualizando UI do cabeçalho');
        const userIconsContainer = document.querySelector('.user-icons');
        if (!userIconsContainer) {
            console.error('[auth-ui] Container de ícones de usuário não encontrado');
            return;
        }

        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        console.log('[auth-ui] Estado de login:', loggedInUser ? 'Logado' : 'Não logado');

        if (loggedInUser && loggedInUser.email) {
            // Extrai o primeiro nome do email (antes do @)
            const firstName = loggedInUser.email.split('@')[0];
            
            // Capitaliza a primeira letra do nome
            const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

            // Verifica se o usuário é admin (para mostrar link do painel)
            const checkAdminAccess = async () => {
                try {
                    console.log('[auth-ui] Verificando permissões de administrador');
                    
                    // Verifica se authClient e authClient.auth existem
                    if (!authClient || !authClient.auth || typeof authClient.auth.getSession !== 'function') {
                        console.error('[auth-ui] Cliente Supabase não está disponível ou não tem método getSession');
                        return false;
                    }
                    
                    const { data } = await authClient.auth.getSession();
                    const session = data?.session;
                    
                    if (session && session.user) {
                        const { data: profile } = await authClient
                            .from('profiles')
                            .select('role')
                            .eq('id', session.user.id)
                            .single();
                        
                        const isAdmin = profile && profile.role === 'admin';
                        console.log('[auth-ui] Usuário é admin:', isAdmin);
                        return isAdmin;
                    }
                    return false;
                } catch (error) {
                    console.error('[auth-ui] Erro ao verificar permissões:', error);
                    return false;
                }
            };

            // Renderiza o dropdown
            userIconsContainer.innerHTML = `
                <div class="profile-dropdown" id="profile-dropdown">
                    <div class="user-profile-link" id="profile-toggle">
                        <img src="img/icons/login.png" alt="Meu Perfil" class="profile-icon">
                        <span class="welcome-message">Bem vindo, ${capitalizedName}</span>
                        <i class="fas fa-chevron-down ms-2"></i>
                    </div>
                    <div class="dropdown-content" id="profile-dropdown-content">
                        <a href="paginadeperfil.html">
                            <i class="fas fa-user me-2"></i>Meu Perfil
                        </a>
                        <div id="admin-menu-item" style="display: none;">
                            <a href="painel/admin.html">
                                <i class="fas fa-cogs me-2"></i>Painel Admin
                            </a>
                        </div>
                        <a href="#" id="logout-button">
                            <i class="fas fa-sign-out-alt me-2"></i>Sair
                        </a>
                    </div>
                </div>
                <a href="#" class="icon-link">
                    <img src="./img/icons/carrinho-icone.png" alt="Ícone de Carrinho">
                    <span>Carrinho (<span id="carrinho-contador">0</span>)</span>
                </a>
            `;
            
            // Adiciona comportamento de clique ao dropdown
            const profileToggle = document.getElementById('profile-toggle');
            const dropdownContent = document.getElementById('profile-dropdown-content');
            const profileDropdown = document.getElementById('profile-dropdown');
            
            if (profileToggle && dropdownContent) {
                // Toggle do dropdown ao clicar
                profileToggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    dropdownContent.classList.toggle('show');
                    profileDropdown.classList.toggle('active');
                });
                
                // Mantém o dropdown aberto quando o mouse está sobre ele
                dropdownContent.addEventListener('mouseenter', function() {
                    dropdownContent.classList.add('show');
                    profileDropdown.classList.add('active');
                });
                
                // Previne que o dropdown feche quando clicamos dentro dele
                dropdownContent.addEventListener('click', function(e) {
                    // Não propaga o clique a menos que seja um link de logout
                    if (!e.target.matches('#logout-button') && !e.target.closest('#logout-button')) {
                        e.stopPropagation();
                    }
                });
                
                // Fecha o dropdown quando clicar fora dele
                document.addEventListener('click', function(e) {
                    if (!profileDropdown.contains(e.target)) {
                        dropdownContent.classList.remove('show');
                        profileDropdown.classList.remove('active');
                    }
                });
            }
            
            // Verifica e mostra link do admin se necessário
            checkAdminAccess().then(isAdmin => {
                const adminMenuItem = document.getElementById('admin-menu-item');
                if (adminMenuItem && isAdmin) {
                    adminMenuItem.style.display = 'block';
                }
            });

            // Adiciona evento de logout
            const logoutButton = document.getElementById('logout-button');
            if (logoutButton) {
                logoutButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    console.log('[auth-ui] Realizando logout');
                    try {
                        if (authClient && authClient.auth && typeof authClient.auth.signOut === 'function') {
                            await authClient.auth.signOut();
                        }
                        localStorage.removeItem('loggedInUser');
                        window.location.href = 'index.html';
                    } catch (error) {
                        console.error('[auth-ui] Erro ao fazer logout:', error);
                        // Mesmo com erro, tenta redirecionar
                        localStorage.removeItem('loggedInUser');
                        window.location.href = 'index.html';
                    }
                });
            }

        } else {
            // HTML Padrão para usuário deslogado
            userIconsContainer.innerHTML = `
                <a href="./login.html" class="icon-link">
                    <img src="./img/icons/login.png" alt="Ícone de Login">
                    <span>Login</span>
                </a>
                <a href="#" class="icon-link">
                    <img src="./img/icons/carrinho-icone.png" alt="Ícone de Carrinho">
                    <span>Carrinho (<span id="carrinho-contador">0</span>)</span>
                </a>
            `;
        }
    }

    // Atualiza o contador do carrinho (movido para cá para ser global)
    function atualizarContadorCarrinho() {
        console.log('[auth-ui] Atualizando contador do carrinho');
        const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
        const contador = document.getElementById('carrinho-contador');
        if (contador) {
            contador.textContent = carrinho.length;
        }
    }

    // Função para inicializar a UI
    function initializeUI() {
        console.log('[auth-ui] Inicializando componentes da UI');
        updateHeaderUI();
        atualizarContadorCarrinho();
    }
    
    // Inicializa quando o DOM estiver pronto
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[auth-ui] DOM carregado');
        // Verifica se já temos o cliente Supabase
        if (authClient) {
            console.log('[auth-ui] Cliente Supabase já disponível, inicializando componentes');
            initializeUI();
        } else {
            console.log('[auth-ui] Aguardando cliente Supabase para inicializar componentes');
            // A inicialização será feita quando o cliente estiver disponível
        }
    });
})();