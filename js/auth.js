/* ============================================================
   js/auth.js - Inteligência de Acesso EstudoTeca Elite
   ============================================================ */

const App = {
    isLoginMode: true,

    // 1. INICIALIZAÇÃO
    init() {
        console.log("🔒 Auth Module v10.0 - Sistema de Acesso 2026 Ativo");
        this.setupEventListeners();
        
        // Foca no campo de e-mail ao carregar para melhor UX
        const emailInput = document.getElementById('authEmail');
        if (emailInput) emailInput.focus();
    },

    // 2. ALTERNAR MODO (LOGIN <-> CADASTRO)
    toggleMode() {
        this.isLoginMode = !this.isLoginMode;

        // Elementos Alvo
        const nameGroup = document.getElementById('nameGroup');
        const title = document.getElementById('auth-title');
        const subtitle = document.getElementById('auth-subtitle');
        const btnText = document.getElementById('btnText');
        const toggleMsg = document.getElementById('toggleMsg');
        const forgotLink = document.getElementById('forgotLink');
        const form = document.getElementById('authForm');

        // Limpa o formulário para evitar troca de dados entre telas
        form.reset();

        if (!this.isLoginMode) {
            // --- CONFIGURAÇÃO PARA MODO CADASTRO ---
            title.innerText = "Criar Conta Elite";
            subtitle.innerText = "Junte-se à plataforma mais avançada de 2026.";
            btnText.innerText = "Finalizar Cadastro";
            toggleMsg.innerHTML = 'Já possui uma conta? <a href="javascript:void(0)" onclick="App.toggleMode()">Fazer Login</a>';
            
            nameGroup.classList.remove('hidden');
            forgotLink.classList.add('hidden'); // Não precisa de "esqueceu senha" no cadastro
            document.getElementById('regName').required = true;
        } else {
            // --- CONFIGURAÇÃO PARA MODO LOGIN ---
            title.innerText = "Bem-vindo de volta";
            subtitle.innerText = "Sincronize seus dados para acessar o painel.";
            btnText.innerText = "Acessar Plataforma";
            toggleMsg.innerHTML = 'Primeira vez em 2026? <a href="javascript:void(0)" onclick="App.toggleMode()">Crie sua conta Elite</a>';
            
            nameGroup.classList.add('hidden');
            forgotLink.classList.remove('hidden');
            document.getElementById('regName').required = false;
        }
    },

    // 3. MOSTRAR/ESCONDER SENHA
    togglePassword() {
        const passInput = document.getElementById('authPass');
        const eyeIcon = document.getElementById('eyeIcon');

        if (passInput.type === 'password') {
            passInput.type = 'text';
            eyeIcon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            passInput.type = 'password';
            eyeIcon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    },

    // 4. GERENCIAMENTO DE SUBMISSÃO (INTEGRAÇÃO API)
    setupEventListeners() {
        const form = document.getElementById('authForm');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPass').value;
            const name = document.getElementById('regName').value;

            // Feedback Visual de Carregamento
            this.setLoading(true);

            try {
                if (this.isLoginMode) {
                    // --- LÓGICA DE LOGIN ---
                    const user = await apiService.login(email, password);
                    notify(`Bem-vindo, ${user.name.split(' ')[0]}! Acessando sistema...`, "success");
                    
                    // Redireciona para o Dashboard após o login
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);

                } else {
                    // --- LÓGICA DE REGISTRO ---
                    if (name.length < 3) throw new Error("Por favor, insira seu nome completo.");
                    
                    await apiService.register(name, email, password);
                    notify("Conta Elite criada! Agora você já pode entrar.", "success");
                    
                    // Volta para o login automaticamente para o usuário logar
                    setTimeout(() => {
                        this.toggleMode();
                        this.setLoading(false);
                    }, 1000);
                }
            } catch (error) {
                // Notificação de erro vinda do servidor ou da validação
                notify(error.message || "Falha na autenticação.", "error");
                this.setLoading(false);
            }
        });
    },

    // 5. AUXILIAR DE INTERFACE
    setLoading(active) {
        const btn = document.getElementById('btnAuth');
        const btnText = document.getElementById('btnText');

        if (active) {
            btn.disabled = true;
            btn.style.opacity = "0.7";
            btnText.innerText = "Processando...";
        } else {
            btn.disabled = false;
            btn.style.opacity = "1";
            btnText.innerText = this.isLoginMode ? "Acessar Plataforma" : "Finalizar Cadastro";
        }
    }
};

// Disparar o sistema de autenticação ao carregar
document.addEventListener('DOMContentLoaded', () => App.init());
