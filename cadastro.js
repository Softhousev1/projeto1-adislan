// Configuração do Supabase
const supabaseUrl = 'https://hylttfhaedvytykjpeze.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bHR0ZmhhZWR2eXR5a2pwZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MTE1MDgsImV4cCI6MjA3NDI4NzUwOH0.e0BmMYbBC9QBI6TNsKgWUckFqCPnjPGEAq6-7h1W18A';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// --- Lógica de Cadastro ---
const signupButton = document.getElementById('signup-button');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const messageElement = document.getElementById('signup-message');

signupButton.addEventListener('click', async (e) => {
    e.preventDefault();
    messageElement.textContent = ''; // Limpa mensagens de erro antigas

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showMessage('Por favor, preencha todos os campos.', true);
        return;
    }
    if (password.length < 6) {
        showMessage('A senha deve ter pelo menos 6 caracteres.', true);
        return;
    }

    signupButton.disabled = true;
    signupButton.textContent = 'Criando conta...';
    
    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        showMessage(`Erro: ${error.message}`, true);
    } else if (data.user) {
        showToastNotification('Conta criada com sucesso!');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
    }

    signupButton.disabled = false;
    signupButton.textContent = 'Criar Conta';
});

// Mostra mensagens de erro dentro do formulário
function showMessage(message, isError = false) {
    messageElement.textContent = message;
    messageElement.style.color = isError ? '#dc3545' : '#198754';
}

// Mostra notificação "toast" no canto da tela
function showToastNotification(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification show';
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.className = toast.className.replace('show', '');
        setTimeout(() => document.body.removeChild(toast), 500);
    }, 2500);
}
