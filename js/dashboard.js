/* ============================================================
   ESTUDOTECA CORE ENGINE - V6.0
   ============================================================ */

const App = {
    currentDate: new Date(),
    events: [],
    // Base de dados local para renderização dos cards
    subjects: [
        { id: 'mat', name: 'Matemática', cat: 'Exatas', icon: 'fa-calculator', progress: 65 },
        { id: 'por', name: 'Português', cat: 'Linguagens', icon: 'fa-language', progress: 40 },
        { id: 'fis', name: 'Física', cat: 'Exatas', icon: 'fa-atom', progress: 25 },
        { id: 'his', name: 'História', cat: 'Humanas', icon: 'fa-scroll', progress: 80 },
        { id: 'bio', name: 'Biologia', cat: 'Biológicas', icon: 'fa-dna', progress: 55 },
        { id: 'qui', name: 'Química', cat: 'Exatas', icon: 'fa-flask-vial', progress: 10 }
    ],

    async init() {
        console.log("🚀 EstudoTeca V6.0 Iniciada...");
        
        // Proteção de Rota
        if (!localStorage.getItem('token')) {
            window.location.href = 'login.html';
            return;
        }

        this.showLoader();
        this.loadUserData();
        this.renderSubjects();
        
        // Inicia na aba salva ou 'inicio'
        const lastTab = localStorage.getItem('lastTab') || 'inicio';
        this.showTab(lastTab);

        await this.fetchEvents();
        this.hideLoader();
    },

    // 1. GERENCIAMENTO DE INTERFACE
    showTab(tabId) {
        // Esconde todas as seções e remove ativos da sidebar
        document.querySelectorAll('.tab-pane').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

        // Ativa os novos
        const target = document.getElementById(`tab-${tabId}`);
        if (target) target.classList.add('active');

        const navLink = document.querySelector(`.nav-link[onclick*="'${tabId}'"]`);
        if (navLink) navLink.classList.add('active');

        // Salva estado e carrega funções específicas
        localStorage.setItem('lastTab', tabId);
        if (tabId === 'cronograma') this.renderCalendar();
    },

    showLoader() { document.getElementById('app-loader').classList.remove('hidden'); },
    hideLoader() { document.getElementById('app-loader').classList.add('hidden'); },

    // 2. RENDERIZAÇÃO DE DISCIPLINAS (Cards Premium)
    renderSubjects() {
        const grid = document.getElementById('subjects-container');
        if (!grid) return;

        grid.innerHTML = this.subjects.map(s => `
            <div class="subject-card-premium">
                <div class="subject-card-header">
                    <div class="icon-box amber"><i class="fa-solid ${s.icon}"></i></div>
                    <div class="subject-title-group">
                        <h3>${s.name}</h3>
                        <span>Área: ${s.cat}</span>
                    </div>
                </div>

                <div class="card-progress-box">
                    <div class="progress-info">
                        <span>Progresso Geral</span>
                        <span>${s.progress}%</span>
                    </div>
                    <div class="card-progress-container">
                        <div class="progress-bar-fill" style="width: ${s.progress}%"></div>
                    </div>
                </div>

                <div class="year-selector-group">
                    <button class="btn-year active">1º Ano</button>
                    <button class="btn-year">2º Ano</button>
                    <button class="btn-year">3º Ano</button>
                </div>

                <div class="subject-card-actions">
                    <button class="btn-card-action primary">Estudar</button>
                    <button class="btn-card-action">Revisar</button>
                </div>
            </div>
        `).join('');
    },

    // 3. CRONOGRAMA (CALENDÁRIO INTELIGENTE)
    async fetchEvents() {
        try {
            this.events = await apiService.getEvents();
            this.updateNotifDot();
        } catch (e) { console.error("Erro ao carregar agenda."); }
    },

    renderCalendar() {
        const grid = document.getElementById('tab-cronograma');
        if (!grid) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

        grid.innerHTML = `
            <div class="calendar-container">
                <div class="calendar-header">
                    <h3>${monthNames[month]} ${year}</h3>
                    <div class="calendar-nav">
                        <button class="btn-nav-cal" onclick="App.changeMonth(-1)"><i class="fa-solid fa-chevron-left"></i></button>
                        <button class="btn-nav-cal" onclick="App.changeMonth(1)"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                </div>
                <div class="calendar-grid">
                    <div class="weekday-label">Dom</div><div class="weekday-label">Seg</div><div class="weekday-label">Ter</div>
                    <div class="weekday-label">Qua</div><div class="weekday-label">Qui</div><div class="weekday-label">Sex</div><div class="weekday-label">Sáb</div>
                    ${this.generateCalendarDays(year, month)}
                </div>
            </div>
        `;
    },

    generateCalendarDays(year, month) {
        let html = '';
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayStr = new Date().toISOString().split('T')[0];

        // Células Vazias
        for (let i = 0; i < firstDay; i++) html += `<div class="day-cell empty"></div>`;

        // Dias do Mês
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr ? 'today' : '';
            const hasEvent = this.events.some(ev => ev.date === dateStr) ? 'has-event' : '';
            
            html += `
                <div class="day-cell ${isToday} ${hasEvent}" onclick="App.openEventModal('${dateStr}')">
                    ${day}
                </div>
            `;
        }
        return html;
    },

    changeMonth(step) {
        this.currentDate.setMonth(this.currentDate.getMonth() + step);
        this.renderCalendar();
    },

    // 4. PERFIL E DADOS
    loadUserData() {
        const name = localStorage.getItem('user_name') || 'Estudante';
        const firstName = name.split(' ')[0];
        
        document.getElementById('sidebar-user-name').innerText = name;
        document.getElementById('welcome-msg').innerText = `Bem-vindo, ${firstName}! 🚀`;
        document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${name}&background=ffb703&color=011627&bold=true`;
    },

    updateNotifDot() {
        const dot = document.getElementById('notif-dot');
        if (this.events.length > 0) dot.classList.remove('hidden');
        else dot.classList.add('hidden');
    },

    // 5. MODAIS (Exemplos)
    openProfileModal() {
        notify("Configurações do Perfil abertas!", "info");
        // Aqui você abriria o modal de perfil
    },

    openEventModal(date) {
        const formatted = date.split('-').reverse().join('/');
        notify(`Agenda para o dia ${formatted}`, "info");
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => App.init());