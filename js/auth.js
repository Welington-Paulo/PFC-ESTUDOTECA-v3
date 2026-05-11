/* ============================================================
   js/auth.js - Inteligência de Acesso SaaS EstudoTeca
   ============================================================ */

const authForm = document.getElementById('authForm');
const nameGroup = document.getElementById('nameGroup');
const forgotLink = document.getElementById('forgotLink');
const nameField = document.getElementById('regName');
const emailField = document.getElementById('authEmail');
const passField = document.getElementById('authPass');
const btnAuth = document.getElementById('btnAuth');
const btnText = document.getElementById('btnText');

/**
 * 1. ALTERNAR MODO (LOGIN <-> CADASTRO)
 * Gerencia quais campos e links devem aparecer em cada tela
 */
function toggleAuthMode() {
    const isCurrentlyLogin = nameGroup.classList.contains('hidden');
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const toggleMsg = document.getElementById('toggleMsg');

    // Limpa o formulário para evitar confusão de dados
    authForm.reset();

    if (isCurrentlyLogin) {
        // --- TROCANDO PARA MODO CADASTRO ---
        title.innerText = "Crie sua conta SaaS";
        subtitle.innerText = "Junte-se a milhares de estudantes e comece sua jornada.";
        btnText.innerText = "Finalizar Cadastro";
        toggleMsg.innerHTML = 'Já possui uma conta? <a href="javascript:void(0)" onclick="toggleAuthMode()">Faça login aqui</a>';
        
        nameGroup.classList.remove('hidden'); // MOSTRA NOME
        forgotLink.classList.add('hidden');   // ESCONDE ESQUECEU SENHA
        
        nameField.required = true;
        nameField.focus();
    } else {
        // --- TROCANDO PARA MODO LOGIN ---
        title.innerText = "Bem-vindo de volta";
        subtitle.innerText = "Insira seus dados para acessar sua conta.";
        btnText.innerText = "Acessar Plataforma";
        toggleMsg.innerHTML = 'Novo por aqui? <a href="javascript:void(0)" onclick="toggleAuthMode()">Crie uma conta gratuitamente</a>';
        
        nameGroup.classList.add('hidden');    // ESCONDE NOME
        forgotLink.classList.remove('hidden'); // MOSTRA ESQUECEU SENHA
        
        nameField.required = false;
        emailField.focus();
    }
}

/**
 * 2. MOSTRAR/ESCONDER SENHA
 * Altera o tipo do campo e o ícone do olho
 */
function togglePasswordVisibility() {
    const eyeIcon = document.getElementById('eyeIcon');

    if (passField.type === 'password') {
        passField.type = 'text';
        eyeIcon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passField.type = 'password';
        eyeIcon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

/**
 * 3. SUBMISSÃO DO FORMULÁRIO
 * Integração com o apiService do services.js
 */
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isLoginMode = nameGroup.classList.contains('hidden');
    const email = emailField.value;
    const password = passField.value;

    setLoading(true);

    try {
        if (isLoginMode) {
            // --- LÓGICA DE LOGIN ---
            const user = await apiService.login(email, password);
            notify(`Bem-vindo de volta, ${user.name.split(' ')[0]}!`, "success");
            
            setTimeout(() => { window.location.href = 'index.html'; }, 1500);

        } else {
            // --- LÓGICA DE CADASTRO ---
            const name = nameField.value;
            if (name.length < 3) throw new Error("Insira seu nome completo.");

            await apiService.register(name, email, password);
            notify("Conta criada com sucesso! Redirecionando...", "success");
            
            setTimeout(() => {
                toggleAuthMode();
                emailField.value = email;
                setLoading(false);
            }, 1000);
        }
    } catch (error) {
        notify(error.message, "error");
        setLoading(false);
    }
});

/**
 * 4. UTILITÁRIOS VISUAIS
 */
function setLoading(active) {
    if (active) {
        btnAuth.disabled = true;
        btnAuth.style.opacity = "0.7";
        btnText.innerText = "Processando...";
    } else {
        btnAuth.disabled = false;
        btnAuth.style.opacity = "1";
        const isLogin = nameGroup.classList.contains('hidden');
        btnText.innerText = isLogin ? "Acessar Plataforma" : "Finalizar Cadastro";
    }
}

// Atualiza o ano de direitos autorais dinamicamente
const currentYear = new Date().getFullYear();
const yearSpan = document.getElementById('currentYear');
if (yearSpan) yearSpan.innerText = currentYear;

// Foco inicial padrão SaaS
document.addEventListener('DOMContentLoaded', () => {
    if (emailField) emailField.focus();
});