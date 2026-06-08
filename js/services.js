/* ============================================================
   js/services.js - Central de Integração SaaS Elite (v9.0 AI)
   ============================================================ */

const API_URL = "http://localhost:3000/api";

/**
 * 1. SISTEMA GLOBAL DE NOTIFICAÇÕES (TOASTS)
 * Alertas elegantes no estilo SaaS (Success / Error / Info)
 */
function notify(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-circle-check' : 
                 type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info';
    
    const color = type === 'success' ? '#10b981' : 
                  type === 'error' ? '#ef4444' : '#3b82f6';

    toast.innerHTML = `
        <i class="fa-solid ${icon}" style="color: ${color}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        toast.style.transition = '0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

/**
 * 2. CORE DA API (apiService)
 * Centraliza todas as chamadas ao servidor Node.js
 */
const apiService = {
    
    // --- INTELIGÊNCIA ARTIFICIAL (GEMINI) ---
    async askAI(prompt) {
        try {
            const response = await fetch(`${API_URL}/ai/chat`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ prompt })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "A IA falhou em responder.");

            return data.response;
        } catch (error) {
            console.error("AI Service Error:", error);
            throw error;
        }
    },

    // --- AUTENTICAÇÃO ---
    async login(email, password) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erro no login.");
        this.saveSession(data.token, data.user);
        return data.user;
    },

    async register(name, email, password) {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erro no cadastro.");
        return data;
    },

    logout() {
        localStorage.clear();
        window.location.href = 'login.html';
    },

    // --- PERFIL DO USUÁRIO (CRUD) ---
    async updateProfile(userId, newName) {
        const response = await fetch(`${API_URL}/user/${userId}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name: newName })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erro ao atualizar perfil.");
        localStorage.setItem('user_name', data.name);
        return data;
    },

    async deleteAccount(userId) {
        const response = await fetch(`${API_URL}/user/${userId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error("Erro ao excluir conta.");
        return true;
    },

    // --- AGENDA / CRONOGRAMA ---
    async getEvents() {
        const response = await fetch(`${API_URL}/events`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        return data;
    },

    async createEvent(eventData) {
        const response = await fetch(`${API_URL}/events`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(eventData)
        });
        return await response.json();
    },

    async deleteEvent(eventId) {
        const response = await fetch(`${API_URL}/events/${eventId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
        });
        return await response.json();
    },

    // --- UTILITÁRIOS DE SESSÃO ---
    saveSession(token, user) {
        localStorage.setItem('isLogged', 'true');
        localStorage.setItem('token', token);
        localStorage.setItem('user_id', user.id);
        localStorage.setItem('user_name', user.name);
        localStorage.setItem('user_email', user.email);
    }
};