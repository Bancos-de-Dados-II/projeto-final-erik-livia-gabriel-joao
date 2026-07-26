"use strict";

/**
 * Pontos recebidos da API.
 *
 * Neste commit, os dados serão apenas carregados e armazenados.
 * Os marcadores serão adicionados no próximo commit.
 */
let pontosDeColeta = [];

const coordenadasSousa = {
    latitude: -6.7592,
    longitude: -38.2281,
    zoom: 14
};

const statusApi = document.querySelector("#status-api");
const quantidadePontos = document.querySelector(
    "#quantidade-pontos"
);

/**
 * Cria o mapa e centraliza na cidade de Sousa.
 */
const mapa = L.map("mapa").setView(
    [
        coordenadasSousa.latitude,
        coordenadasSousa.longitude
    ],
    coordenadasSousa.zoom
);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }
).addTo(mapa);

/**
 * Atualiza as informações visuais da API.
 *
 * @param {string} fonte Fonte dos dados retornada pelo backend.
 * @param {number} quantidade Quantidade de pontos carregados.
 */
function atualizarInformacoesApi(fonte, quantidade) {
    statusApi.classList.remove(
        "status--carregando",
        "status--erro"
    );

    statusApi.textContent = `Dados: ${fonte}`;

    quantidadePontos.textContent =
        quantidade === 1
            ? "1 ponto"
            : `${quantidade} pontos`;
}

/**
 * Mostra que ocorreu uma falha ao buscar os pontos.
 */
function mostrarErroApi() {
    statusApi.classList.remove("status--carregando");
    statusApi.classList.add("status--erro");

    statusApi.textContent = "Erro ao carregar";
    quantidadePontos.textContent = "0 pontos";
}

/**
 * Busca os pontos cadastrados no backend.
 */
async function carregarPontos() {
    statusApi.classList.add("status--carregando");
    statusApi.textContent = "Carregando pontos...";

    try {
        const resposta = await fetch("/api/pontos");

        if (!resposta.ok) {
            throw new Error(
                `Erro HTTP: ${resposta.status}`
            );
        }

        const resultado = await resposta.json();

        /**
         * O backend retorna:
         *
         * {
         *   fonte: "MongoDB" ou "Redis",
         *   dados: [...]
         * }
         */
        pontosDeColeta = Array.isArray(resultado.dados)
            ? resultado.dados
            : [];

        atualizarInformacoesApi(
            resultado.fonte || "Não informada",
            pontosDeColeta.length
        );

        console.log(
            "Pontos de coleta carregados:",
            pontosDeColeta
        );

        console.table(pontosDeColeta);
    } catch (erro) {
        pontosDeColeta = [];

        mostrarErroApi();

        console.error(
            "Não foi possível carregar os pontos de coleta:",
            erro
        );
    }
}

/**
 * Carrega os pontos assim que a página estiver pronta.
 */
document.addEventListener(
    "DOMContentLoaded",
    carregarPontos
);