require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { Client } = require('pg');
const { Redis } = require('@upstash/redis');

const app = express();
app.use(express.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('🟢 Conectado ao MongoDB Atlas'))
    .catch(err => console.error('Erro MongoDB:', err));

const pgClient = new Client({ connectionString: process.env.POSTGRES_URL });
pgClient.connect()
    .then(() => console.log('🔵 Conectado ao PostgreSQL (Supabase)'))
    .catch(err => console.error('Erro Postgres:', err));

const redis = new Redis({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN });

app.post('/api/pontos', (req, res) => res.status(501).json({ msg: "Em desenvolvimento" }));
app.get('/api/pontos', (req, res) => res.status(501).json({ msg: "Em desenvolvimento" }));
app.post('/api/auth/login', (req, res) => res.status(501).json({ msg: "Em desenvolvimento" }));
app.post('/api/pontos/:id/avaliacoes', (req, res) => res.status(501).json({ msg: "Em desenvolvimento" }));

const PontoSchema = new mongoose.Schema({
    nome: String,
    material: String,
    endereco: String,
    horario: String,
    localizacao: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true }
    }
});
PontoSchema.index({ localizacao: '2dsphere' });
const Ponto = mongoose.model('PontoColeta', PontoSchema);

app.post('/api/pontos', async (req, res) => {
    try {
        const { nome, material, endereco, horario, latitude, longitude } = req.body;
        
        const novoPonto = new Ponto({
            nome, material, endereco, horario,
            localizacao: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            }
        });

        await novoPonto.save();
        await redis.del('todos_pontos');

        return res.status(201).json({ msg: "Ponto cadastrado com sucesso no MongoDB!", ponto: novoPonto });
    } catch (error) {
        return res.status(500).json({ erro: error.message });
    }
    // Rota de login consultando o PostgreSQL do Supabase
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const query = 'SELECT id, nome, email FROM usuarios WHERE email = $1 AND senha = $2';
        const resultado = await pgClient.query(query, [email, senha]);

        if (resultado.rows.length > 0) {
            return res.status(200).json({ msg: "Autenticado via PostgreSQL!", usuario: resultado.rows[0] });
        }
        return res.status(401).json({ erro: "Usuário ou senha inválidos." });
    } catch (error) {
        return res.status(500).json({ erro: error.message });
    }
});
});