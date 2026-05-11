/* ============================================================
   ESTUDOTECA SaaS - SERVIDOR CENTRAL (v3.3)
   ============================================================ */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();

// --- 1. CONFIGURAÇÕES INICIAIS (Middlewares) ---
app.use(express.json());
app.use(cors());

// --- 2. CONEXÃO COM O BANCO DE DADOS (MongoDB Atlas) ---
const MONGO_URI = process.env.MONGO_URI || "SUA_URL_AQUI";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ SaaS Database: Conectado com sucesso!"))
    .catch(err => console.error("❌ Erro fatal de conexão MongoDB:", err));

// --- 3. MODELOS DE DADOS (Schemas) ---

// Modelo de Usuário
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Modelo de Agenda (Eventos)
const EventSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    date: { type: String, required: true }, // Formato: YYYY-MM-DD
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Event = mongoose.model('Event', EventSchema);

// --- 4. MIDDLEWARE DE SEGURANÇA (JWT Guard) ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Acesso negado." });

    jwt.verify(token, process.env.JWT_SECRET || 'secret_saas_key', (err, user) => {
        if (err) return res.status(403).json({ error: "Sessão expirada." });
        req.user = user;
        next();
    });
};

// --- 5. ROTAS DE API (Devem vir ANTES das rotas de arquivo) ---

// [AGENDA] Buscar Eventos do Usuário (GET)
app.get('/api/events', authenticateToken, async (req, res) => {
    try {
        const events = await Event.find({ userId: req.user.id }).sort({ date: 1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar agenda." });
    }
});

// [AGENDA] Criar Novo Evento (POST)
app.post('/api/events', authenticateToken, async (req, res) => {
    try {
        const { title, date } = req.body;
        const newEvent = new Event({
            userId: req.user.id,
            title,
            date
        });
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (err) {
        res.status(500).json({ error: "Erro ao salvar na agenda." });
    }
});

// [AGENDA] Deletar Evento (DELETE) - NOVA ROTA
app.delete('/api/events/:id', authenticateToken, async (req, res) => {
    try {
        // Verifica se o evento pertence ao usuário antes de deletar
        const event = await Event.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.user.id 
        });

        if (!event) return res.status(404).json({ error: "Evento não encontrado." });

        res.json({ message: "Compromisso removido com sucesso." });
    } catch (err) {
        res.status(500).json({ error: "Erro ao excluir compromisso." });
    }
});

// [AUTH] Cadastro
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ error: "E-mail já cadastrado." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "Usuário SaaS criado!" });
    } catch (err) {
        res.status(500).json({ error: "Erro no registro." });
    }
});

// [AUTH] Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Usuário não encontrado." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Senha incorreta." });

        const token = jwt.sign(
            { id: user._id, name: user.name }, 
            process.env.JWT_SECRET || 'secret_saas_key', 
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        res.status(500).json({ error: "Erro no login." });
    }
});

// [USER] Atualizar Perfil
app.put('/api/user/:id', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        if (req.user.id !== req.params.id) return res.status(403).json({ error: "Não autorizado." });

        const updatedUser = await User.findByIdAndUpdate(req.params.id, { name }, { new: true }).select('-password');
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: "Erro ao atualizar." });
    }
});

// [USER] Deletar Conta
app.delete('/api/user/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.id !== req.params.id) return res.status(403).json({ error: "Não autorizado." });

        // Deleta o usuário e também todos os eventos dele (Limpeza SaaS)
        await Event.deleteMany({ userId: req.params.id });
        await User.findByIdAndDelete(req.params.id);

        res.json({ message: "Conta e dados excluídos." });
    } catch (err) {
        res.status(500).json({ error: "Erro ao excluir conta." });
    }
});

// --- 6. CONFIGURAÇÃO DE ARQUIVOS ESTÁTICOS ---
app.use(express.static(__dirname));

// Rota principal (Abre o login ao acessar o domínio principal)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// --- 7. INICIALIZAÇÃO ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 EstudoTeca SaaS v3.3 rodando em: http://localhost:${PORT}`);
});