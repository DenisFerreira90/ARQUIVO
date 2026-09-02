// =========================================================
// ARQUIVO INTELIGENTE - AUTENTICAÇÃO E INICIALIZAÇÃO
// =========================================================

// Evita o erro de re-declaração caso a variável já exista no config.js
var usuarioLogado = window.usuarioLogado || null;

window.onload = function() {
    // 1. Captura os parâmetros da URL para leitura via QR Code
    const params = new URLSearchParams(window.location.search);
    let idDaPasta = params.get('id') || params.get('pasta') || window.location.hash.replace('#', '');
    const caminho = window.location.pathname.replace('/', '');
    
    if (!idDaPasta && caminho && caminho.length > 2 && !caminho.includes('.html') && caminho !== 'index') {
        idDaPasta = caminho;
    }

    // Se detectou um ID na URL, abre a tela pública de leitura
    if (idDaPasta) {
        const loginEl = document.getElementById('login-screen');
        const publicEl = document.getElementById('public-screen');
        
        if (loginEl) loginEl.style.display = 'none';
        if (publicEl) publicEl.style.display = 'block';
        
        carregarDadosPublicos(idDaPasta);
        return; // Interrompe a execução para não abrir a tela de login
    }

    // 2. Fluxo Normal de Login (Se NÃO for leitura de QR Code)
    const usuarioSalvo = localStorage.getItem('usuarioLogadoAI');
    if (usuarioSalvo) {
        usuarioLogado = JSON.parse(usuarioSalvo);
        
        const loginEl = document.getElementById('login-screen');
        if (loginEl) loginEl.style.display = 'none';
        
        const btnConfig = document.getElementById('btn-configuracoes');
        if (btnConfig) btnConfig.style.display = usuarioLogado.permAdmin ? 'block' : 'none';
        
        const btnAuditoria = document.getElementById('btn-auditoria');
        if (btnAuditoria) btnAuditoria.style.display = usuarioLogado.permAdmin ? 'block' : 'none';
        
        const btnExcluirP = document.getElementById('btn-excluir-pasta');
        if (btnExcluirP) btnExcluirP.style.display = (usuarioLogado.permAdmin || usuarioLogado.permExcluirPasta) ? 'block' : 'none';
        
        iniciarSistema();
    }
};

function verificarEnterLogin(event) {
    if (event.key === "Enter") fazerLogin();
}

function fazerLogin() {
    const user = document.getElementById('login-user').value.trim().toLowerCase();
    const senha = document.getElementById('senha').value.trim();
    const msgErro = document.getElementById('msg-login');
    const btnLogin = document.querySelector('#login-screen button');

    if (!user || !senha) {
        msgErro.innerText = "Preencha usuário e senha.";
        msgErro.style.display = 'block';
        return;
    }

    btnLogin.innerText = "Autenticando...";
    msgErro.style.display = 'none';

    db.collection("usuarios").doc(user).get().then(doc => {
        btnLogin.innerText = "Entrar";

        if (doc.exists && doc.data().senha === senha) {
            usuarioLogado = { login: user, ...doc.data() };
            
            // Salva a sessão no navegador para evitar logout no F5
            localStorage.setItem('usuarioLogadoAI', JSON.stringify(usuarioLogado));
            
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('senha').value = '';
            
            const btnConfig = document.getElementById('btn-configuracoes');
            if (btnConfig) btnConfig.style.display = usuarioLogado.permAdmin ? 'block' : 'none';
            
            const btnAuditoria = document.getElementById('btn-auditoria');
            if (btnAuditoria) btnAuditoria.style.display = usuarioLogado.permAdmin ? 'block' : 'none';
            
            const btnExcluirP = document.getElementById('btn-excluir-pasta');
            if (btnExcluirP) btnExcluirP.style.display = (usuarioLogado.permAdmin || usuarioLogado.permExcluirPasta) ? 'block' : 'none';
            
            iniciarSistema();
        } else {
            msgErro.innerText = "Usuário ou senha incorretos.";
            msgErro.style.display = 'block';
        }
    }).catch(() => {
        btnLogin.innerText = "Entrar";
        msgErro.innerText = "Erro ao conectar com o banco de dados.";
        msgErro.style.display = 'block';
    });
}

function sair() {
    // Apaga a memória ao encerrar a sessão
    localStorage.removeItem('usuarioLogadoAI');
    usuarioLogado = null;
    
    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('config-screen').style.display = 'none';
    document.getElementById('auditoria-screen').style.display = 'none';
    document.getElementById('dashboard-screen').style.display = 'none';
    
    const publicEl = document.getElementById('public-screen');
    if (publicEl) publicEl.style.display = 'none';
    
    document.getElementById('login-screen').style.display = 'block';
    
    const buscaInput = document.getElementById('busca-global');
    if (buscaInput) buscaInput.value = '';
}