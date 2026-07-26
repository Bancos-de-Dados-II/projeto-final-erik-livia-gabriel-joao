"use strict";

/**
 * Pontos recebidos da API.
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

const formulario = document.querySelector(
    "#form-cadastro"
);

const campoNome = document.querySelector("#nome");
const campoMaterial = document.querySelector("#material");
const campoEndereco = document.querySelector("#endereco");
const campoHorario = document.querySelector("#horario");

const campoLatitude = document.querySelector("#latitude");
const campoLongitude = document.querySelector("#longitude");

const botaoCadastrar = formulario.querySelector(
    'button[type="submit"]'
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

let marcadorSelecao = null;

let pontoEmEdicaoId = null;

const marcadoresPontos = L.layerGroup().addTo(mapa);

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
 * Mostra uma falha ao buscar os pontos.
 */
function mostrarErroApi() {
    statusApi.classList.remove("status--carregando");
    statusApi.classList.add("status--erro");

    statusApi.textContent = "Erro ao carregar";
    quantidadePontos.textContent = "0 pontos";
}

/**
 * Remove os marcadores dos pontos cadastrados.
 */
function limparMarcadores() {
    marcadoresPontos.clearLayers();
}

/**
 * Exibe os pontos carregados no mapa.
 */
function exibirPontosNoMapa() {
    limparMarcadores();

    if (pontosDeColeta.length === 0) {
        return;
    }

    const limites = [];

    pontosDeColeta.forEach((ponto) => {
        if (
            !ponto.localizacao ||
            !Array.isArray(ponto.localizacao.coordinates)
        ) {
            return;
        }

        const [longitude, latitude] =
            ponto.localizacao.coordinates;

        if (
            typeof latitude !== "number" ||
            typeof longitude !== "number"
        ) {
            return;
        }

        const marcador = L.marker([
            latitude,
            longitude
        ]).addTo(marcadoresPontos);

        marcador.bindPopup(`
    <strong>${ponto.nome}</strong><br>
    <b>Material:</b> ${ponto.material}<br>
    <b>Endereço:</b> ${ponto.endereco}<br>
    <b>Horário:</b> ${ponto.horario}<br><br>

    <button
        type="button"
        class="botao-editar-ponto"
        data-id="${ponto._id}"
    >
        Editar
    </button>
`);

        limites.push([latitude, longitude]);
    });

    if (limites.length === 1) {
        mapa.setView(limites[0], 16);
        return;
    }

    if (limites.length > 1) {
        mapa.fitBounds(limites, {
            padding: [40, 40]
        });
    }
}

/**
 * Verifica se todos os campos necessários foram preenchidos.
 */
function atualizarEstadoBotao() {
    const formularioValido =
        campoNome.value.trim() !== "" &&
        campoMaterial.value !== "" &&
        campoEndereco.value.trim() !== "" &&
        campoHorario.value.trim() !== "" &&
        campoLatitude.value !== "" &&
        campoLongitude.value !== "";

    botaoCadastrar.disabled = !formularioValido;
}

/**
 * Seleciona a localização do novo ponto no mapa.
 */
mapa.on("click", (evento) => {
    const { lat, lng } = evento.latlng;

    campoLatitude.value = lat.toFixed(6);
    campoLongitude.value = lng.toFixed(6);

    if (marcadorSelecao) {
        mapa.removeLayer(marcadorSelecao);
    }

    marcadorSelecao = L.marker([
        lat,
        lng
    ]).addTo(mapa);

    marcadorSelecao.bindPopup(
        "Localização selecionada"
    ).openPopup();

    atualizarEstadoBotao();
});

/**
 * Atualiza o estado do botão quando os campos mudarem.
 */
[
    campoNome,
    campoMaterial,
    campoEndereco,
    campoHorario
].forEach((campo) => {
    campo.addEventListener(
        "input",
        atualizarEstadoBotao
    );

    campo.addEventListener(
        "change",
        atualizarEstadoBotao
    );
});

/**
 * Busca os pontos cadastrados no backend.
 */
async function carregarPontos() {
    statusApi.classList.remove("status--erro");
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

        exibirPontosNoMapa();
    } catch (erro) {
        pontosDeColeta = [];

        limparMarcadores();
        mostrarErroApi();

        console.error(
            "Não foi possível carregar os pontos de coleta:",
            erro
        );
    }
}


/**
 * Preenche o formulário com os dados de um ponto.
 *
 * @param {object} ponto Ponto que será editado.
 */
function iniciarEdicaoPonto(ponto) {
    if (
        !ponto.localizacao ||
        !Array.isArray(ponto.localizacao.coordinates)
    ) {
        alert("Este ponto não possui uma localização válida.");
        return;
    }

    const [longitude, latitude] =
        ponto.localizacao.coordinates;

    pontoEmEdicaoId = ponto._id;

    campoNome.value = ponto.nome || "";
    campoMaterial.value = ponto.material || "";
    campoEndereco.value = ponto.endereco || "";
    campoHorario.value = ponto.horario || "";

    campoLatitude.value = latitude;
    campoLongitude.value = longitude;

    if (marcadorSelecao) {
        mapa.removeLayer(marcadorSelecao);
    }

    marcadorSelecao = L.marker([
        latitude,
        longitude
    ]).addTo(mapa);

    marcadorSelecao.bindPopup(
        "Localização do ponto em edição"
    ).openPopup();

    mapa.setView([latitude, longitude], 16);

    botaoCadastrar.textContent =
        "Salvar alterações";

    atualizarEstadoBotao();

    formulario.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

/**
 * Cadastra um novo ponto de coleta.
 *
 * @param {SubmitEvent} evento Evento de envio do formulário.
 */
/**
 * Cadastra ou atualiza um ponto de coleta.
 *
 * @param {SubmitEvent} evento Evento de envio do formulário.
 */
async function cadastrarPonto(evento) {
    evento.preventDefault();

    atualizarEstadoBotao();

    if (botaoCadastrar.disabled) {
        return;
    }

    const editando = pontoEmEdicaoId !== null;

    const url = editando
        ? `/api/pontos/${pontoEmEdicaoId}`
        : "/api/pontos";

    const metodo = editando
        ? "PUT"
        : "POST";

    botaoCadastrar.disabled = true;

    botaoCadastrar.textContent = editando
        ? "Salvando..."
        : "Cadastrando...";

    try {
        const resposta = await fetch(url, {
            method: metodo,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                nome: campoNome.value.trim(),
                material: campoMaterial.value,
                endereco: campoEndereco.value.trim(),
                horario: campoHorario.value.trim(),
                latitude: campoLatitude.value,
                longitude: campoLongitude.value
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro ||
                "Não foi possível salvar o ponto."
            );
        }

        formulario.reset();

        campoLatitude.value = "";
        campoLongitude.value = "";

        if (marcadorSelecao) {
            mapa.removeLayer(marcadorSelecao);
            marcadorSelecao = null;
        }

        pontoEmEdicaoId = null;

        botaoCadastrar.textContent =
            "Cadastrar ponto";

        await carregarPontos();

        alert(
            editando
                ? "Ponto atualizado com sucesso!"
                : "Ponto cadastrado com sucesso!"
        );
    } catch (erro) {
        console.error(
            "Erro ao salvar ponto:",
            erro
        );

        alert(erro.message);
    } finally {
        botaoCadastrar.textContent =
            pontoEmEdicaoId
                ? "Salvar alterações"
                : "Cadastrar ponto";

        atualizarEstadoBotao();
    }
}

/**
 * Identifica o botão de edição clicado no popup.
 */
document.addEventListener("click", (evento) => {
    const botaoEditar = evento.target.closest(
        ".botao-editar-ponto"
    );

    if (!botaoEditar) {
        return;
    }

    const pontoId = botaoEditar.dataset.id;

    const pontoSelecionado = pontosDeColeta.find(
        (ponto) => ponto._id === pontoId
    );

    if (!pontoSelecionado) {
        alert("Não foi possível encontrar este ponto.");
        return;
    }

    iniciarEdicaoPonto(pontoSelecionado);
});

/**
 * Envia o formulário para a API.
 */
formulario.addEventListener(
    "submit",
    cadastrarPonto
);

/**
 * Carrega os pontos quando a página estiver pronta.
 */
document.addEventListener(
    "DOMContentLoaded",
    () => {
        atualizarEstadoBotao();
        carregarPontos();
    }
);