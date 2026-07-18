require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { Client } = require('pg');
const { Redis } = require('@upstash/redis');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Conexões com os bancos de dados
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('🟢 Conectado ao MongoDB Atlas'))
    .catch(err => console.error('Erro MongoDB:', err));

const pgClient = new Client({ connectionString: process.env.POSTGRES_URL });
pgClient.connect()
    .then(() => console.log('🔵 Conectado ao PostgreSQL (Supabase)'))
    .catch(err => console.error('Erro Postgres:', err));

const redis = new Redis({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN });

// Esqueleto das rotas para o grupo trabalhar
app.post('/api/pontos', (req, res) => res.status(501).json({ msg: "Em desenvolvimento" }));
app.get('/api/pontos', (req, res) => res.status(501).json({ msg: "Em desenvolvimento" }));
app.post('/api/auth/login', (req, res) => res.status(501).json({ msg: "Em desenvolvimento" }));
app.post('/api/pontos/:id/avaliacoes', (req, res) => res.status(501).json({ msg: "Em desenvolvimento" }));