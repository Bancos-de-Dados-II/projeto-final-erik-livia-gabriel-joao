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


const PontoSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true
    },
    material: {
        type: String,
        required: true
    },
    endereco: {
        type: String,
        required: true
    },
    horario: {
        type: String,
        required: true
    },
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

        if (!nome || !material || !endereco || !horario || latitude == null || longitude == null) {
            return res.status(400).json({
                erro: "Todos os campos são obrigatórios."
            });
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({
                erro: "Latitude e longitude devem ser números."
            });
        }

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({
                erro: "Coordenadas inválidas."
            });
        }

        const novoPonto = new Ponto({
            nome,
            material,
            endereco,
            horario,
            localizacao: {
                type: 'Point',
                coordinates: [lng, lat]
            }
        });

        await novoPonto.save();
        await redis.del('todos_pontos');

        return res.status(201).json({ msg: "Ponto cadastrado com sucesso no MongoDB!", ponto: novoPonto });
    } catch (error) {
        return res.status(500).json({ erro: error.message });
    }
});

app.get('/api/pontos', async (req, res) => {
    try {
        const cachePontos = await redis.get('todos_pontos');
        if (cachePontos) {
            return res.status(200).json({ fonte: "Cache (Redis)", dados: JSON.parse(cachePontos) });
        }
        const pontosBanco = await Ponto.find();
        await redis.set('todos_pontos', JSON.stringify(pontosBanco), { ex: 60 }); 
        return res.status(200).json({ fonte: "Banco Principal (MongoDB)", dados: pontosBanco });
    } catch (error) {
        return res.status(500).json({ erro: error.message });
    }
});

app.get('/api/pontos/:id', async (req, res) => {
    try {
        const ponto = await Ponto.findById(req.params.id);
        if (!ponto) return res.status(404).json({ erro: "Ponto não encontrado." });
        return res.status(200).json(ponto);
    } catch (error) {
        return res.status(500).json({ erro: error.message });
    }
});

app.put('/api/pontos/:id', async (req, res) => {
    try {
        const pontoAtualizado = await Ponto.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!pontoAtualizado) return res.status(404).json({ erro: "Ponto não encontrado." });
        await redis.del('todos_pontos');
        return res.status(200).json({ msg: "Ponto atualizado com sucesso!", ponto: pontoAtualizado });
    } catch (error) {
        return res.status(500).json({ erro: error.message });
    }
});

app.delete('/api/pontos/:id', async (req, res) => {
    try {
        const pontoDeletado = await Ponto.findByIdAndDelete(req.params.id);
        if (!pontoDeletado) return res.status(404).json({ erro: "Ponto não encontrado." });
        await redis.del('todos_pontos'); 
        return res.status(200).json({ msg: "Ponto deletado com sucesso do MongoDB!" });
    } catch (error) {
        return res.status(500).json({ erro: error.message });
    }
});

const AvaliacaoSchema = new mongoose.Schema({
    pontoId: { type: mongoose.Schema.Types.ObjectId, ref: 'PontoColeta', required: true },
    nota: { type: Number, min: 1, max: 5, required: true },
    comentario: String,
    data: { type: Date, default: Date.now }
});
const Avaliacao = mongoose.model('Avaliacao', AvaliacaoSchema);

//(OBS:Falta completar a entidade avaliacoes com as rotas GET,PUT E DELETE, só fiz POST)
app.post('/api/pontos/:id/avaliacoes', async (req, res) => {
    try {
        const pontoId = req.params.id;
        const { nota, comentario } = req.body;
        const pontoExiste = await Ponto.findById(pontoId);
        
        if (!pontoExiste) {
            return res.status(404).json({ erro: "EcoPonto não encontrado." });
        }
        
        const novaAvaliacao = new Avaliacao({ pontoId, nota, comentario });
        await novaAvaliacao.save();
        return res.status(201).json({ msg: "Avaliação salva com sucesso!", avaliacao: novaAvaliacao });
    } catch (error) {
        return res.status(500).json({ erro: error.message });
    }
});

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


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor EcoPontos rodando na porta ${PORT}`));