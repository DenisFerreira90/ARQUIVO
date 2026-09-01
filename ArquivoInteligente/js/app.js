// ==========================================================================
// ARQUIVO INTELIGENTE - CORE APP ENGINE (FIREBASE FIRESTORE EDITION)
// ==========================================================================

const firebaseConfig = {
    apiKey: "AIzaSyB8cxkzGDC2f--Wpbjhs-zO868aeu_XeVY",
    authDomain: "proponto-73a2e.firebaseapp.com",
    projectId: "proponto-73a2e",
    storageBucket: "proponto-73a2e.firebasestorage.app",
    messagingSenderId: "250329635867",
    appId: "1:250329635867:web:a343e85d0a42c3eb04ecbe"
};

// Inicialização do Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Memória Local de Sincronização
let memoriaDoSistema = { pastas: [], clientes: [], usuarios: [] };
let usuarioLogado = null;

// ==========================================================================
// 1. AUTENTICAÇÃO E CONTROLE DE ACESSO
// ==========================================================================

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

    // Consulta de credenciais no Firestore
    db.collection("usuarios").doc(user).get().then(doc => {
        btnLogin.innerText = "Entrar";

        if (doc.exists && doc.data().senha === senha) {
            usuarioLogado = { login: user, ...doc.data() };
            
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('senha').value = '';
            
            // Aplica Permissões na Interface
            const btnConfig = document.getElementById('btn-configuracoes');
            if (btnConfig) {
                btnConfig.style.display = usuarioLogado.permAdmin ? 'block' : 'none';
            }
            
            const btnExcluirP = document.getElementById('btn-excluir-pasta');
            if (btnExcluirP) {
                btnExcluirP.style.display = (usuarioLogado.permAdmin || usuarioLogado.permExcluirPasta) ? 'block' : 'none';
            }
            
            iniciarSistema();
        } else {
            msgErro.innerText = "Usuário ou senha incorretos.";
            msgErro.style.display = 'block';
        }
    }).catch(err => {
        btnLogin.innerText = "Entrar";
        msgErro.innerText = "Erro ao conectar com o banco de dados.";
        msgErro.style.display = 'block';
    });
}

function sair() {
    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('config-screen').style.display = 'none';
    document.getElementById('dashboard-screen').style.display = 'block';
    
    const buscaInput = document.getElementById('busca-global');
    if (buscaInput) {
        buscaInput.value = '';
        pesquisarGlobal(); 
    }
}

// ==========================================================================
// 2. ESCUTA EM TEMPO REAL (FIRESTORE SNAPSHOTS)
// ==========================================================================

function iniciarSistema() {
    document.getElementById('dashboard-screen').style.display = 'block';
    
    // Monitoramento de Pastas Ativas
    db.collection("pastas").where("status", "==", "ATIVO").onSnapshot((snapshot) => {
        memoriaDoSistema.pastas = [];
        snapshot.forEach(doc => memoriaDoSistema.pastas.push(doc.id));
        desenharPastas();
    });

    // Monitoramento de Clientes Ativos
    db.collection("clientes").where("status", "==", "ATIVO").onSnapshot((snapshot) => {
        memoriaDoSistema.clientes = [];
        snapshot.forEach(doc => {
            memoriaDoSistema.clientes.push({ idFirebase: doc.id, ...doc.data() });
        });
        
        // Atualiza dinamicamente a tela da pasta se estiver aberta
        const telaPastaAberta = document.getElementById('app-screen').style.display === 'block';
        if (telaPastaAberta) {
            filtrarClientesDaPasta();
        }
        
        // Leitura e redirecionamento automático via QR Code (URL Query String)
        const urlParams = new URLSearchParams(window.location.search);
        const pastaQR = urlParams.get('pasta'); 
        if (pastaQR && !telaPastaAberta) {
            abrirTelaPasta(pastaQR);
        }
    });
}

// ==========================================================================
// 3. DASHBOARD & NAVEGAÇÃO
// ==========================================================================

function desenharPastas() {
    const divPastas = document.getElementById('lista-pastas');
    let html = '';
    
    if (memoriaDoSistema.pastas.length === 0) {
        divPastas.innerHTML = '<p style="text-align: center; color: #86868b;">Nenhuma pasta cadastrada.</p>';
        return;
    }

    memoriaDoSistema.pastas.sort().forEach(nomePasta => {
        html += `
        <div class="card-item" style="cursor: pointer; font-weight: 600; color: var(--apple-blue);" onclick="abrirTelaPasta('${nomePasta}')">
            📁 ${nomePasta}
        </div>`;
    });
    divPastas.innerHTML = html;
}

function pesquisarGlobal() {
    const termo = document.getElementById('busca-global').value.toLowerCase();
    const divResultados = document.getElementById('resultados-busca');
    const divPastas = document.getElementById('lista-pastas');

    if (termo.length < 2) {
        divResultados.style.display = 'none';
        divPastas.style.display = 'block';
        return;
    }

    divPastas.style.display = 'none';
    divResultados.style.display = 'block';

    const clientesFiltrados = memoriaDoSistema.clientes.filter(c => 
        c.nome.toLowerCase().includes(termo) || c.cpf.includes(termo)
    );

    if (clientesFiltrados.length === 0) {
        divResultados.innerHTML = '<p style="text-align:center; color:#86868b;">Nenhum cliente encontrado.</p>';
        return;
    }

    let html = '<p style="font-size: 13px; color: #86868b; text-align: left; margin-bottom: 10px;">Resultados encontrados:</p>';
    clientesFiltrados.forEach(c => {
        html += `
        <div class="card-item" style="flex-direction: column; align-items: flex-start;">
            <div style="font-weight: 600; color: #1d1d1f;">${c.nome}</div>
            <div style="color: #86868b; font-size: 14px;">CPF: ${c.cpf}</div>
            <div style="color: var(--apple-blue); font-size: 13px; margin-top: 8px; font-weight: bold; cursor: pointer; text-decoration: underline;" onclick="abrirTelaPasta('${c.pasta}')">
                📍 Localização: ${c.pasta}
            </div>
        </div>`;
    });
    divResultados.innerHTML = html;
}

function abrirTelaPasta(nomeDaPasta) {
    document.getElementById('dashboard-screen').style.display = 'none';
    const telas = ['nova-pasta-screen', 'editar-pasta-screen', 'novo-cliente-screen', 'editar-cliente-screen', 'config-screen'];
    telas.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    document.getElementById('app-screen').style.display = 'block';
    document.getElementById('titulo-pasta').innerText = nomeDaPasta;
    
    // Reseta o campo de busca interno da pasta
    const campoBuscaInterna = document.getElementById('busca-cliente-pasta');
    if (campoBuscaInterna) campoBuscaInterna.value = '';

    filtrarClientesDaPasta();
}

function filtrarClientesDaPasta() {
    const campoBusca = document.getElementById('busca-cliente-pasta');
    const termo = campoBusca ? campoBusca.value.toLowerCase() : '';
    const nomeDaPasta = document.getElementById('titulo-pasta').innerText;
    const divLista = document.getElementById('lista-clientes');
    
    const clientesFiltrados = memoriaDoSistema.clientes.filter(c => 
        c.pasta === nomeDaPasta && 
        (c.nome.toLowerCase().includes(termo) || c.cpf.includes(termo))
    );
    
    renderizarListaClientesHtml(clientesFiltrados, divLista);
}

function renderizarListaClientesHtml(clientes, divLista) {
    if (!divLista) return;

    if (clientes.length === 0) {
        divLista.innerHTML = '<p style="text-align: center; color: #86868b; margin: 20px 0;">Nenhum cliente nesta pasta.</p>';
        return;
    }
    
    let html = '';
    clientes.forEach(cliente => {
        const btnExcluir = (usuarioLogado && (usuarioLogado.permAdmin || usuarioLogado.permExcluirCliente)) 
            ? `<button style="padding: 8px 12px; font-size: 14px; width: auto; background-color: var(--apple-red-bg); color: var(--apple-red); border-radius: 8px;" onclick="excluirCliente('${cliente.idFirebase}', '${cliente.nome}')">🗑️</button>`
            : ``;

        html += `
        <div class="card-item">
            <div>
                <div style="font-weight: 600; color: #1d1d1f;">${cliente.nome}</div>
                <div style="color: #86868b; font-size: 14px;">CPF: ${cliente.cpf}</div>
            </div>
            <div style="display: flex; gap: 8px; flex-shrink: 0;">
                <button style="padding: 8px 12px; font-size: 14px; width: auto; background-color: #e5e5ea; border-radius: 8px; color: #1d1d1f;" onclick="abrirEditarCliente('${cliente.idFirebase}', '${cliente.nome}', '${cliente.cpf}')">✏️</button>
                ${btnExcluir}
            </div>
        </div>`;
    });
    divLista.innerHTML = html;
}

// ==========================================================================
// 4. CRUD COMPLETO DE PASTAS (LOCALIZAÇÃO FÍSICA E ID)
// ==========================================================================

function abrirNovaPasta() {
    document.getElementById('dashboard-screen').style.display = 'none';
    document.getElementById('nova-pasta-screen').style.display = 'block';
    limparFormularioNovaPasta();
    document.getElementById('np-id').focus();
}

function limparFormularioNovaPasta() {
    document.getElementById('np-id').value = '';
    document.getElementById('np-endereco').value = '';
    document.getElementById('np-andar').value = '';
    document.getElementById('np-caixa').value = '';
    document.getElementById('np-numero').value = '';
}

function voltarParaDashboard() {
    limparFormularioNovaPasta();
    document.getElementById('nova-pasta-screen').style.display = 'none';
    document.getElementById('config-screen').style.display = 'none';
    document.getElementById('dashboard-screen').style.display = 'block';
}

function salvarNovaPasta() {
    const id = document.getElementById('np-id').value.trim().toUpperCase();
    if (!id) return alert("O ID da pasta é obrigatório!");

    db.collection("pastas").doc(id).set({
        endereco: document.getElementById('np-endereco').value.trim(),
        andar: document.getElementById('np-andar').value.trim(),
        caixa: document.getElementById('np-caixa').value.trim(),
        numero: document.getElementById('np-numero').value.trim(),
        status: "ATIVO",
        criadoPor: usuarioLogado ? usuarioLogado.login : 'sistema'
    }).then(() => {
        gerarImpressao(id);
        voltarParaDashboard();
    });
}

function abrirEditarPasta() {
    const nomeDaPasta = document.getElementById('titulo-pasta').innerText;
    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('editar-pasta-screen').style.display = 'block';
    document.getElementById('ep-nome-atual').innerText = `Editando: ${nomeDaPasta}`;
    document.getElementById('ep-id').value = nomeDaPasta;

    // Carrega dados físicos completos do Firestore
    db.collection("pastas").doc(nomeDaPasta).get().then(doc => {
        if (doc.exists) {
            const dados = doc.data();
            document.getElementById('ep-endereco').value = dados.endereco || '';
            document.getElementById('ep-andar').value = dados.andar || '';
            document.getElementById('ep-caixa').value = dados.caixa || '';
            document.getElementById('ep-numero').value = dados.numero || '';
        }
    });
}

function voltarParaPasta() {
    document.getElementById('editar-pasta-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';
}

function salvarEdicaoPasta() {
    const nomeAtual = document.getElementById('titulo-pasta').innerText;
    const novoId = document.getElementById('ep-id').value.trim().toUpperCase();
    if (!novoId) return alert("O ID da pasta não pode ficar vazio!");

    const dadosAtualizados = {
        endereco: document.getElementById('ep-endereco').value.trim(),
        andar: document.getElementById('ep-andar').value.trim(),
        caixa: document.getElementById('ep-caixa').value.trim(),
        numero: document.getElementById('ep-numero').value.trim(),
        status: "ATIVO",
        atualizadoPor: usuarioLogado ? usuarioLogado.login : 'sistema'
    };

    if (novoId !== nomeAtual) {
        // Renomeação de ID: Cria o novo documento, desativa o antigo e migra clientes
        db.collection("pastas").doc(novoId).set(dadosAtualizados).then(() => {
            db.collection("pastas").doc(nomeAtual).update({ status: "EXCLUÍDO" });
            
            memoriaDoSistema.clientes.filter(c => c.pasta === nomeAtual).forEach(c => {
                db.collection("clientes").doc(c.idFirebase).update({ pasta: novoId });
            });

            document.getElementById('titulo-pasta').innerText = novoId;
            voltarParaPasta();
        });
    } else {
        // Atualização de localização na mesma pasta
        db.collection("pastas").doc(nomeAtual).update(dadosAtualizados).then(() => {
            voltarParaPasta();
        });
    }
}

function excluirPasta() {
    const nomeDaPasta = document.getElementById('titulo-pasta').innerText;
    const clientesDaPasta = memoriaDoSistema.clientes.filter(c => c.pasta === nomeDaPasta);
    
    if (clientesDaPasta.length > 0) {
        return alert(`Ação Bloqueada: A ${nomeDaPasta} possui ${clientesDaPasta.length} cliente(s). Mova ou exclua os clientes antes de remover a pasta.`);
    }

    if (confirm(`Excluir permanentemente a ${nomeDaPasta}?`)) {
        db.collection("pastas").doc(nomeDaPasta).update({ 
            status: "EXCLUÍDO", 
            excluidoPor: usuarioLogado ? usuarioLogado.login : 'sistema' 
        }).then(() => sair());
    }
}

// ==========================================================================
// 5. CRUD DE CLIENTES (DOCUMENTOS)
// ==========================================================================

function abrirCadastroCliente() {
    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('novo-cliente-screen').style.display = 'block';
    document.getElementById('nc-pasta-destino').innerText = `Destino: ${document.getElementById('titulo-pasta').innerText}`;
    document.getElementById('nc-nome').value = '';
    document.getElementById('nc-cpf').value = '';
}

function voltarParaPastaDeCliente() {
    document.getElementById('novo-cliente-screen').style.display = 'none';
    document.getElementById('editar-cliente-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';
}

function salvarNovoCliente() {
    const nome = document.getElementById('nc-nome').value.trim();
    const cpf = document.getElementById('nc-cpf').value.trim();
    const pastaAtual = document.getElementById('titulo-pasta').innerText;

    if (!nome || !cpf) return alert("Preencha Nome e CPF do cliente!");

    db.collection("clientes").add({
        nome: nome,
        cpf: cpf,
        pasta: pastaAtual,
        status: "ATIVO",
        criadoPor: usuarioLogado ? usuarioLogado.login : 'sistema'
    }).then(() => {
        voltarParaPastaDeCliente();
    });
}

function abrirEditarCliente(idFirebase, nome, cpf) {
    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('editar-cliente-screen').style.display = 'block';
    document.getElementById('ec-cpf-antigo').value = idFirebase;
    document.getElementById('ec-nome').value = nome;
    document.getElementById('ec-cpf').value = cpf;
}

function salvarEdicaoCliente() {
    const idFirebase = document.getElementById('ec-cpf-antigo').value;
    const nomeNovo = document.getElementById('ec-nome').value.trim();
    const cpfNovo = document.getElementById('ec-cpf').value.trim();

    if (!nomeNovo || !cpfNovo) return alert("Preencha Nome e CPF!");

    db.collection("clientes").doc(idFirebase).update({
        nome: nomeNovo,
        cpf: cpfNovo,
        atualizadoPor: usuarioLogado ? usuarioLogado.login : 'sistema'
    }).then(() => {
        voltarParaPastaDeCliente();
    });
}

function excluirCliente(idFirebase, nome) {
    if (confirm(`Excluir o cliente ${nome}?`)) {
        db.collection("clientes").doc(idFirebase).update({ 
            status: "EXCLUÍDO", 
            excluidoPor: usuarioLogado ? usuarioLogado.login : 'sistema' 
        });
    }
}

// ==========================================================================
// 6. PAINEL DE CONFIGURAÇÕES & PAINEL DE USUÁRIOS
// ==========================================================================

function abrirConfiguracoes() {
    document.getElementById('dashboard-screen').style.display = 'none';
    document.getElementById('config-screen').style.display = 'block';
    resetarFormularioUsuario();
    carregarListaUsuarios();
}

function alternarPermissoesAdmin() {
    const isAdmin = document.getElementById('perm-admin').checked;
    document.getElementById('perm-excluir-pasta').checked = isAdmin;
    document.getElementById('perm-excluir-cliente').checked = isAdmin;
    document.getElementById('perm-excluir-pasta').disabled = isAdmin;
    document.getElementById('perm-excluir-cliente').disabled = isAdmin;
}

function resetarFormularioUsuario() {
    document.getElementById('form-user-title').innerText = "Novo Usuário";
    document.getElementById('nu-login-antigo').value = "";
    document.getElementById('nu-nome').value = "";
    document.getElementById('nu-login').value = "";
    document.getElementById('nu-senha').value = "";
    document.getElementById('perm-admin').checked = false;
    document.getElementById('perm-excluir-pasta').checked = false;
    document.getElementById('perm-excluir-cliente').checked = false;
    alternarPermissoesAdmin();
    
    document.getElementById('btn-salvar-user').innerText = "Cadastrar Usuário";
    document.getElementById('btn-cancelar-user').style.display = "none";
}

function salvarUsuario() {
    const loginAntigo = document.getElementById('nu-login-antigo').value;
    const nome = document.getElementById('nu-nome').value.trim();
    const loginNovo = document.getElementById('nu-login').value.trim().toLowerCase();
    const senha = document.getElementById('nu-senha').value.trim();
    
    const pAdmin = document.getElementById('perm-admin').checked;
    const pExcluirPasta = document.getElementById('perm-excluir-pasta').checked;
    const pExcluirCliente = document.getElementById('perm-excluir-cliente').checked;

    if (!nome || !loginNovo || !senha) return alert("Preencha Nome, Login e Senha!");

    const dadosUsuario = {
        nome: nome,
        senha: senha,
        permAdmin: pAdmin,
        permExcluirPasta: pExcluirPasta,
        permExcluirCliente: pExcluirCliente,
        atualizadoPor: usuarioLogado ? usuarioLogado.login : 'sistema'
    };

    if (loginAntigo && loginAntigo !== loginNovo) {
        db.collection("usuarios").doc(loginNovo).set(dadosUsuario).then(() => {
            db.collection("usuarios").doc(loginAntigo).delete().then(() => {
                alert(`Usuário alterado para ${loginNovo} com sucesso!`);
                resetarFormularioUsuario();
                carregarListaUsuarios();
            });
        });
    } else {
        db.collection("usuarios").doc(loginNovo).set(dadosUsuario).then(() => {
            alert(`Usuário ${loginNovo} salvo com sucesso!`);
            resetarFormularioUsuario();
            carregarListaUsuarios();
        });
    }
}

function iniciarEdicaoUsuario(loginStr, dadosObjetoString) {
    const dados = JSON.parse(decodeURIComponent(dadosObjetoString));
    
    document.getElementById('form-user-title').innerText = `Editando Usuário: ${loginStr}`;
    document.getElementById('nu-login-antigo').value = loginStr;
    
    document.getElementById('nu-nome').value = dados.nome;
    document.getElementById('nu-login').value = loginStr;
    document.getElementById('nu-senha').value = dados.senha;
    
    document.getElementById('perm-admin').checked = dados.permAdmin || false;
    document.getElementById('perm-excluir-pasta').checked = dados.permExcluirPasta || false;
    document.getElementById('perm-excluir-cliente').checked = dados.permExcluirCliente || false;
    
    alternarPermissoesAdmin();

    document.getElementById('btn-salvar-user').innerText = "Salvar Alterações";
    document.getElementById('btn-cancelar-user').style.display = "block";
    window.scrollTo(0, 0);
}

function carregarListaUsuarios() {
    db.collection("usuarios").get().then(snapshot => {
        let html = '<h3 style="margin-top: 25px; font-size: 15px; text-align: left;">Usuários Cadastrados</h3>';
        snapshot.forEach(doc => {
            const u = doc.data();
            const tagAdmin = u.permAdmin ? '<span style="color: var(--apple-blue); font-size: 12px; font-weight: bold;">(ADMIN)</span>' : '';
            const dadosCodificados = encodeURIComponent(JSON.stringify(u));
            
            html += `
            <div class="card-item">
                <div>
                    <b>${u.nome}</b> ${tagAdmin}<br>
                    <small style="color: #86868b;">Login: ${doc.id}</small>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button style="padding: 8px 12px; font-size: 14px; width: auto; background-color: #e5e5ea; border-radius: 8px; color: #1d1d1f;" onclick="iniciarEdicaoUsuario('${doc.id}', '${dadosCodificados}')">✏️</button>
                    ${doc.id !== 'denis' ? `<button style="padding: 8px 12px; font-size: 14px; width: auto; background-color: var(--apple-red-bg); color: var(--apple-red); border-radius: 8px;" onclick="excluirUsuario('${doc.id}')">🗑️</button>` : ''}
                </div>
            </div>`;
        });
        document.getElementById('lista-usuarios').innerHTML = html;
    });
}

function excluirUsuario(login) {
    if (confirm(`Remover permanentemente o acesso do usuário ${login}?`)) {
        db.collection("usuarios").doc(login).delete().then(() => carregarListaUsuarios());
    }
}

// ==========================================================================
// 7. MOTOR DE IMPRESSÃO DE ETIQUETAS E QR CODE
// ==========================================================================

function imprimirEspelho() {
    gerarImpressao(document.getElementById('titulo-pasta').innerText);
}

function gerarImpressao(pasta) {
    db.collection("pastas").doc(pasta).get().then(doc => {
        let endereco = "N/A", andar = "N/A", caixa = "N/A", numero = "N/A";
        
        if (doc.exists) {
            const dados = doc.data();
            endereco = dados.endereco || "N/A";
            andar = dados.andar || "N/A";
            caixa = dados.caixa || "N/A";
            numero = dados.numero || "N/A";
        }

        document.getElementById('print-pasta-id').innerText = pasta;
        document.getElementById('print-endereco').innerHTML = `<b>Endereço:</b> ${endereco}`;
        document.getElementById('print-andar').innerHTML = `<b>Andar/Sala:</b> ${andar}`;
        document.getElementById('print-caixa').innerHTML = `<b>Caixa:</b> ${caixa} &nbsp;&nbsp; <b>Nº:</b> ${numero}`;

        const linkApp = window.location.origin + window.location.pathname + "?pasta=" + pasta;
        const imgQr = document.getElementById('print-qr');
        imgQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(linkApp)}`;
        
        imgQr.onload = () => window.print();
    });
}