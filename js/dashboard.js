/* ============================================================
   js/dashboard.js - Inteligência SaaS Elite EstudoTeca (v10.0)
   ============================================================ */

const App = {
    currentDate: new Date(), // Controle do Calendário
    events: [],              // Cache de eventos da API
    selectedDate: null,
    
    // --- DATABASE LOCAL (Para Alimentar a Interface) ---
    subjects: [
        { id: 'mat', name: 'Matemática', cat: 'Exatas', icon: 'fa-calculator', progress: 75 },
        { id: 'por', name: 'Português', cat: 'Linguagens', icon: 'fa-language', progress: 50 },
        { id: 'fis', name: 'Física', cat: 'Exatas', icon: 'fa-atom', progress: 35 },
        { id: 'his', name: 'História', cat: 'Humanas', icon: 'fa-scroll', progress: 90 },
        { id: 'bio', name: 'Biologia', cat: 'Biológicas', icon: 'fa-dna', progress: 65 }
    ],

    atividades: [
        { id: 1, title: 'Revisão IA: Redação Dissertativa', deadline: 'Hoje', done: false },
        { id: 2, title: 'Simulado Gabarito 2025', deadline: 'Amanhã', done: false },
        { id: 3, title: 'Checklist: Fórmulas de Química', deadline: '28/05/2026', done: true }
    ],

    quizData: [
        {
            pergunta: "Qual o bioma brasileiro conhecido como a 'caixa d'água' do Brasil e possui solo ácido?",
            opcoes: ["Pantanal", "Cerrado", "Caatinga", "Mata Atlântica"],
            correta: 1
        },
        {
            pergunta: "Quem escreveu a obra 'Dom Casmurro' e é o maior expoente do Realismo no Brasil?",
            opcoes: ["José de Alencar", "Machado de Assis", "Castro Alves", "Clarice Lispector"],
            correta: 1
        }
    ],

    // --- 1. INICIALIZAÇÃO ---
    async init() {
        console.log("🚀 EstudoTeca Elite v10.0 - Sistema AI Operacional...");
        
        // Proteção de Rota
        if (!localStorage.getItem('token')) {
            window.location.href = 'login.html';
            return;
        }

        this.loadUserData();
        this.renderSubjects();
        this.renderAtividades();
        this.initEventListeners();
        
        const lastTab = localStorage.getItem('lastTab') || 'inicio';
        this.showTab(lastTab);
        this.showSubTab('redacao'); 

        await this.fetchEvents();
        
        // Notificação do Tutor IA após carregar
        setTimeout(() => {
            this.addNotification("Tutor IA: Analisei seu desempenho em Matemática. Vamos focar em Geometria hoje?");
        }, 3000);
    },

    // --- 2. COMUNICAÇÃO COM INTELIGÊNCIA ARTIFICIAL (GEMINI) ---
    
    // Chat Geral do Assistente
    async handleAiChatSubmit() {
        const input = document.getElementById('ai-user-input');
        const content = document.getElementById('ai-chat-content');
        const prompt = input.value.trim();

        if (!prompt) return;

        // UI: Adiciona mensagem do usuário
        content.innerHTML += `<div class="ai-msg user">${prompt}</div>`;
        input.value = '';
        content.scrollTop = content.scrollHeight;

        try {
            // Chamada para o apiService que se comunica com o Gemini
            const response = await apiService.askAI(prompt);
            content.innerHTML += `<div class="ai-msg bot">${response}</div>`;
        } catch (error) {
            content.innerHTML += `<div class="ai-msg bot error">Tive um problema na conexão com o servidor 2026.</div>`;
        }
        content.scrollTop = content.scrollHeight;
    },

    // Análise de Redação Profunda (Gabarito + Ortografia)
    async handleAiEssayAnalysis() {
        const essayText = document.getElementById('essay-editor').value;
        const chatContent = document.getElementById('ai-chat-content');

        if (essayText.length < 150) {
            return notify("Texto muito curto para análise técnica (mínimo 150 caracteres).", "error");
        }

        notify("IA Analítica: Escaneando gramática e competências...", "info");
        this.openAiChat(); // Abre o chat para o aluno ver o processo

        try {
            const response = await fetch(`http://localhost:3000/api/ai/analyze-essay`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ essayText })
            });

            const data = await response.json();
            
            // Adiciona o resultado da análise formatado no chat
            chatContent.innerHTML += `
                <div class="ai-msg bot">
                    <div class="analysis-result">
                        <header><h4>📊 Relatório de Desempenho IA</h4></header>
                        <div class="analysis-body">${data.analysis}</div>
                        <footer><small>Baseado nos critérios oficiais INEP 2026</small></footer>
                    </div>
                </div>
            `;
            this.addNotification("Seu feedback de redação está pronto no Assistente IA!");
        } catch (error) {
            notify("Erro ao processar análise da IA.", "error");
        }
        chatContent.scrollTop = chatContent.scrollHeight;
    },

    // --- 3. GERENCIAMENTO DE INTERFACE E NAVEGAÇÃO ---
    showTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

        const target = document.getElementById(`tab-${tabId}`);
        if (target) target.classList.add('active');

        const navLink = document.querySelector(`.nav-link[onclick*="'${tabId}'"]`);
        if (navLink) navLink.classList.add('active');

        localStorage.setItem('lastTab', tabId);
        if (tabId === 'agenda') this.renderCalendar();
    },

    showSubTab(subId) {
        document.querySelectorAll('.sub-content-pane').forEach(c => c.classList.add('hidden'));
        document.querySelectorAll('.sub-link').forEach(l => l.classList.remove('active'));

        document.getElementById(`sub-${subId}`).classList.remove('hidden');
        const btn = document.querySelector(`.sub-link[onclick*="'${subId}'"]`);
        if (btn) btn.classList.add('active');

        if (subId === 'simulados') this.loadQuizQuestion(0);
    },

    // --- 4. RENDERIZAÇÃO DE CONTEÚDO ---
    renderSubjects() {
        const grid = document.getElementById('disciplinas-grid');
        if (!grid) return;

        grid.innerHTML = this.subjects.map(s => `
            <div class="subject-card-premium card">
                <div class="subject-card-header">
                    <div class="stat-icon blue"><i class="fa-solid ${s.icon}"></i></div>
                    <div class="subject-title-group">
                        <h3>${s.name}</h3>
                        <span>Área: ${s.cat}</span>
                    </div>
                </div>
                <div class="card-progress-box">
                    <div class="progress-info">
                        <span>Progresso Atual</span>
                        <span>${s.progress}%</span>
                    </div>
                    <div class="card-progress-container">
                        <div class="progress-bar-fill" style="width: ${s.progress}%"></div>
                    </div>
                </div>
                <button class="btn-card-action primary">Continuar Módulo</button>
            </div>
        `).join('');
    },

    renderAtividades() {
        const list = document.getElementById('atividades-list');
        if (!list) return;

        list.innerHTML = this.atividades.map(a => `
            <div class="atividade-item-elite card ${a.done ? 'done' : ''}">
                <div class="task-check" onclick="App.toggleTask(${a.id})">
                    <i class="fa-solid ${a.done ? 'fa-circle-check' : 'fa-circle'}"></i>
                </div>
                <div class="atividade-content">
                    <p>${a.title}</p>
                    <small class="text-muted">Prazo: ${a.deadline}</small>
                </div>
            </div>
        `).join('');
    },

    // --- 5. CALENDÁRIO ELITE 2026 ---
    renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        const label = document.getElementById('calendar-month-year');
        if (!grid) return;

        grid.innerHTML = '';
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        label.innerText = `${monthNames[month]} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) grid.innerHTML += `<div class="day-cell-elite empty"></div>`;

        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            grid.innerHTML += `<div class="day-cell-elite ${isToday ? 'today' : ''}" onclick="notify('Data selecionada: ${day}/${month+1}', 'info')">${day}</div>`;
        }
    },

    changeMonth(step) {
        this.currentDate.setMonth(this.currentDate.getMonth() + step);
        this.renderCalendar();
    },

    // --- 6. SIMULADO (QUIZ) ---
    loadQuizQuestion(index) {
        const box = document.getElementById('quiz-box');
        const data = this.quizData[index];
        if (!box || !data) return;

        box.innerHTML = `
            <span class="badge-quiz">Simulado Elite - Questão ${index + 1}</span>
            <h3 id="quiz-question" style="margin: 20px 0">${data.pergunta}</h3>
            <div class="quiz-options">
                ${data.opcoes.map((opt, i) => `
                    <button class="opt-btn" onclick="App.checkAnswer(${index}, ${i})">
                        <span class="letter">${String.fromCharCode(65 + i)}</span>
                        <span class="text">${opt}</span>
                    </button>
                `).join('')}
            </div>
        `;
    },

    checkAnswer(qIndex, selected) {
        const data = this.quizData[qIndex];
        const buttons = document.querySelectorAll('.opt-btn');
        buttons.forEach(b => b.disabled = true);

        if (selected === data.correta) {
            buttons[selected].classList.add('correct');
            notify("Excelente! Você acertou.", "success");
        } else {
            buttons[selected].classList.add('wrong');
            buttons[data.correta].classList.add('correct');
            notify("Incorreto. Revise este tópico!", "error");
        }

        setTimeout(() => {
            if (qIndex + 1 < this.quizData.length) this.loadQuizQuestion(qIndex + 1);
            else {
                document.getElementById('quiz-box').innerHTML = `
                    <div class="quiz-finished">
                        <i class="fa-solid fa-trophy"></i>
                        <h3>Simulado Finalizado!</h3>
                        <button class="btn btn-primary" onclick="App.loadQuizQuestion(0)">Reiniciar</button>
                    </div>
                `;
            }
        }, 2000);
    },

    // --- 7. UTILS E DADOS USUÁRIO ---
    loadUserData() {
        const name = localStorage.getItem('user_name') || 'Estudante';
        document.getElementById('sidebar-user-name').innerText = name;
        document.getElementById('header-user-name').innerText = name.split(' ')[0];
        
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ffb703&color=011627&bold=true&size=128`;
        document.getElementById('sidebar-avatar-img').src = avatarUrl;
        document.getElementById('header-avatar-img').src = avatarUrl;
    },

    initEventListeners() {
        // Contador de caracteres redação
        const editor = document.getElementById('essay-editor');
        if (editor) {
            editor.addEventListener('input', (e) => {
                document.getElementById('char-count').innerText = `${e.target.value.length} caracteres`;
            });
        }

        // Fechar dropdowns ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.profile-accordion')) {
                document.querySelectorAll('.profile-accordion').forEach(a => a.classList.remove('active'));
            }
        });
    },

    toggleAccordion(id) { document.getElementById(id).classList.toggle('active'); },
    
    toggleNotifDropdown() {
        document.getElementById('notifDropdown').classList.toggle('active');
        document.getElementById('notif-dot').classList.add('hidden');
    },

    addNotification(msg) {
        const list = document.getElementById('notif-list');
        const empty = list.querySelector('.empty-notif');
        if (empty) empty.remove();
        list.innerHTML = `<div class="notif-item"><p>${msg}</p><small>Agora mesmo</small></div>` + list.innerHTML;
        document.getElementById('notif-dot').classList.remove('hidden');
    },

    clearNotifs() { 
        document.getElementById('notif-list').innerHTML = '<p class="empty-notif">Nenhum aviso novo.</p>'; 
        document.getElementById('notif-dot').classList.add('hidden'); 
    },

    openAiChat() { document.getElementById('aiChatModal').classList.add('active'); },
    closeAiChat() { document.getElementById('aiChatModal').classList.remove('active'); },
    
    async fetchEvents() { try { this.events = await apiService.getEvents(); } catch(e){} },
    
    viewImage(src) { 
        const m = document.getElementById('imageModal'); 
        document.getElementById('modal-img-display').src = src; 
        m.classList.add('active'); 
    },
    closeImageModal() { document.getElementById('imageModal').classList.remove('active'); },

    toggleTask(id) {
        const task = this.atividades.find(a => a.id === id);
        if (task) {
            task.done = !task.done;
            this.renderAtividades();
            if(task.done) notify("Tarefa concluída!", "success");
        }
    },

    // Modais de Perfil
    openProfileModal() { document.getElementById('configModal').classList.add('active'); },
    closeConfigModal() { document.getElementById('configModal').classList.remove('active'); },
    
    async handleProfileUpdate() {
        const newName = document.getElementById('edit-name').value;
        try {
            await apiService.updateProfile(localStorage.getItem('user_id'), newName);
            notify("Perfil atualizado!", "success");
            this.loadUserData();
            this.closeConfigModal();
        } catch (e) { notify(e.message, "error"); }
    },

    async handleAccountDelete() {
        if (!confirm("⚠️ Esta ação é irreversível. Deletar sua conta agora?")) return;
        try {
            await apiService.deleteAccount(localStorage.getItem('user_id'));
            notify("Conta excluída. Até a próxima!");
            setTimeout(() => apiService.logout(), 2000);
        } catch (e) { notify(e.message, "error"); }
    },

    showLoader() { document.getElementById('app-loader').classList.remove('hidden'); },
    hideLoader() { document.getElementById('app-loader').classList.add('hidden'); }
};

document.addEventListener('DOMContentLoaded', () => App.init());