/* ============================================================
   ESTUDOTECA SaaS ELITE - SERVIDOR CENTRAL (v10.0 AI)
   ============================================================ */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();

// --- 1. CONFIGURAÇÕES ---
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

// --- 2. CONFIGURAÇÃO DA IA (GEMINI 2.0/3 READY) ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Usando o modelo mais estável para análise textual profunda
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); 

// --- 3. CONEXÃO MONGODB ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ SaaS Elite Database: Conectado (Contexto 2026 Ativo)"))
    .catch(err => console.error("❌ Erro MongoDB:", err));

// --- 4. MODELOS ---
const User = mongoose.model('User', new mongoose.Schema({
    name: String, email: { type: String, unique: true }, password: String
}));

const Event = mongoose.model('Event', new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId, title: String, date: String
}));

// --- 5. MIDDLEWARE JWT ---
const auth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Acesso negado." });
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Sessão expirada." });
        req.user = user;
        next();
    });
};

// --- 6. ROTAS DE INTELIGÊNCIA ARTIFICIAL (O Diferencial v10.0) ---

// ROTA: Chat de Dúvidas
app.post('/api/ai/chat', auth, async (req, res) => {
    try {
        const { prompt } = req.body;
        const systemPrompt = `Você é o Tutor Elite da EstudoTeca. Estamos em 2026. 
        Você tem acesso aos históricos do ENEM 2023, 2024 e 2025. 
        Responda de forma didática, use bullet points e seja motivador. 
        Dúvida do aluno: ${prompt}`;
        
        const result = await model.generateContent(systemPrompt);
        res.json({ response: result.response.text() });
    } catch (err) {
        res.status(500).json({ error: "Falha na IA." });
    }
});

// ROTA: Analisador de Redação (A lógica que você pediu)
app.post('/api/ai/analyze-essay', auth, async (req, res) => {
    try {
        const { essayText } = req.body;
        const analysisPrompt = `Aja como um corretor rigoroso do ENEM 2026. 
        Analise a seguinte redação e retorne um JSON com:
        1. Nota Final (0-1000).
        2. Notas por Competência (1 a 5).
        3. Lista de Erros Ortográficos e Gramaticais encontrados.
        4. Sugestões de melhoria para repertório sociocultural.
        5. Texto corrigido (exemplo de como ficaria melhor).
        
        Texto da Redação: "${essayText}"`;

        const result = await model.generateContent(analysisPrompt);
        res.json({ analysis: result.response.text() });
    } catch (err) {
        res.status(500).json({ error: "Erro na análise da redação." });
    }
});

// --- 7. ROTAS DE AUTENTICAÇÃO ---
app.post('/api/auth/register', async (req, res) => {
    const hash = await bcrypt.hash(req.body.password, 10);
    const user = new User({ name: req.body.name, email: req.body.email, password: hash });
    await user.save();
    res.status(201).json({ message: "Registrado!" });
});

app.post('/api/auth/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET);
        return res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
    }
    res.status(400).json({ error: "Dados incorretos." });
});

// --- 8. ROTAS DE AGENDA ---
app.get('/api/events', auth, async (req, res) => res.json(await Event.find({ userId: req.user.id })));
app.post('/api/events', auth, async (req, res) => {
    const ev = new Event({ userId: req.user.id, title: req.body.title, date: req.body.date });
    await ev.save(); res.status(201).json(ev);
});
app.delete('/api/events/:id', auth, async (req, res) => {
    await Event.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: "Removido!" });
});

// --- INICIALIZAÇÃO ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Elite Server v10 rodando na porta ${PORT}`));