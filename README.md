[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/NZVyGR9C)

# EcoPontos

Sistema web para cadastro de pontos de coleta seletiva utilizando persistência poliglota.

## 🔗 Link da Aplicação em Produção

🌐 **Acesse o projeto rodando no Render:**  
👉 [https://projetobd-63j2.onrender.com](https://projetobd-63j2.onrender.com)

---

## 👥 Integrantes

* **Erik**
* **Lívia**
* **Gabriel**
* **João**

---

## 🛠️ Tecnologias

* **Backend:** Node.js, Express
* **Frontend:** HTML, CSS, JavaScript
* **Mapas & Geolocalização:** Leaflet, GeoJSON

---

## 🗄️ Bancos de Dados (Persistência Poliglota)

O projeto utiliza três bancos de dados diferentes, aplicando o conceito de persistência poliglota conforme a necessidade de cada módulo:

* **🟢 MongoDB Atlas (NoSQL):** Armazenamento dos Pontos de Coleta e Avaliações (suporte nativo a documentos e GeoJSON).
* **🔵 PostgreSQL (SQL):** Gestão relacional de Usuários e autenticação.
* **🔴 Redis (In-Memory Cache):** Cache de requisições para otimização de performance das consultas.

---

## Bancos de dados

- MongoDB Atlas (Pontos de Coleta e Avaliações)
- PostgreSQL (Usuários)
- Redis (Cache)

## Funcionalidades

- Login
- Cadastro de usuários
- CRUD de Pontos de Coleta
- CRUD de Avaliações
- Localização espacial com GeoJSON
- Visualização dos pontos no mapa

## 📋 Funcionalidades

* [x] **Autenticação:** Login e cadastro de usuários.
* [x] **Pontos de Coleta:** CRUD completo de pontos de coleta.
* [x] **Avaliações:** CRUD de avaliações e comentários dos pontos.
* [x] **Geolocalização:** Mapeamento espacial utilizando formato GeoJSON.
* [x] **Interface Interativa:** Visualização dinâmica dos pontos em mapa via Leaflet.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
* **Node.js** instalado na máquina
* Gerenciador de pacotes **npm**

npm install

npm start / node server

http://localhost:3000
