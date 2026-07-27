"use strict";

const usuarioSalvo =
    localStorage.getItem("usuario");

if (usuarioSalvo) {
    window.location.href = "/";
}

const formularioLogin =
    document.querySelector("#form-login");

const campoEmail =
    document.querySelector("#email");

const campoSenha =
    document.querySelector("#senha");

const botaoEntrar =
    document.querySelector("#botao-entrar");

const mensagemLogin =
    document.querySelector("#mensagem-login");

/**
 * Mostra uma mensagem na tela de login.
 *
 * @param {string} mensagem
 * @param {"erro"|"sucesso"} tipo
 */
function mostrarMensagem(mensagem, tipo) {
    mensagemLogin.textContent = mensagem;

    mensagemLogin.classList.remove(
        "mensagem-login--erro",
        "mensagem-login--sucesso"
    );

    mensagemLogin.classList.add(
        tipo === "sucesso"
            ? "mensagem-login--sucesso"
            : "mensagem-login--erro"
    );
}

/**
 * Envia os dados de login para o backend.
 *
 * @param {SubmitEvent} evento
 */
async function realizarLogin(evento) {
    evento.preventDefault();

    const email = campoEmail.value.trim();
    const senha = campoSenha.value;

    mensagemLogin.classList.remove(
        "mensagem-login--erro",
        "mensagem-login--sucesso"
    );

    botaoEntrar.disabled = true;
    botaoEntrar.textContent = "Entrando...";

    try {
        const resposta = await fetch(
            "/api/auth/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    senha
                })
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro ||
                "Não foi possível realizar o login."
            );
        }

        localStorage.setItem(
            "usuario",
            JSON.stringify(resultado.usuario)
        );

        mostrarMensagem(
            resultado.msg ||
            "Login realizado com sucesso!",
            "sucesso"
        );

        window.location.href = "/";
    } catch (erro) {
        console.error(
            "Erro ao realizar login:",
            erro
        );

        mostrarMensagem(
            erro.message,
            "erro"
        );
    } finally {
        botaoEntrar.disabled = false;
        botaoEntrar.textContent = "Entrar";
    }
}

formularioLogin.addEventListener(
    "submit",
    realizarLogin
);