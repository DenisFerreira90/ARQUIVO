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
    if (!novoId) return alert("O ID não pode ser vazio!");

    const dadosAtualizados = {
        endereco: document.getElementById('ep-endereco').value.trim(),
        andar: document.getElementById('ep-andar').value.trim(),
        caixa: document.getElementById('ep-caixa').value.trim(),
        numero: document.getElementById('ep-numero').value.trim(),
        status: "ATIVO",
        atualizadoPor: usuarioLogado ? usuarioLogado.login : 'sistema'
    };

    if (novoId !== nomeAtual) {
        db.collection("pastas").doc(novoId).set(dadosAtualizados).then(() => {
            db.collection("pastas").doc(nomeAtual).update({ status: "EXCLUÍDO" });
            memoriaDoSistema.clientes.filter(c => c.pasta === nomeAtual).forEach(c => {
                db.collection("clientes").doc(c.idFirebase).update({ pasta: novoId });
            });
            document.getElementById('titulo-pasta').innerText = novoId;
            voltarParaPasta();
        });
    } else {
        db.collection("pastas").doc(nomeAtual).update(dadosAtualizados).then(() => voltarParaPasta());
    }
}

function excluirPasta() {
    const nomeDaPasta = document.getElementById('titulo-pasta').innerText;
    const clientesDaPasta = memoriaDoSistema.clientes.filter(c => c.pasta === nomeDaPasta);
    
    if (clientesDaPasta.length > 0) {
        return alert(`Ação Bloqueada: A ${nomeDaPasta} possui ${clientesDaPasta.length} cliente(s).`);
    }

    if (confirm(`Excluir a ${nomeDaPasta}?`)) {
        db.collection("pastas").doc(nomeDaPasta).update({ 
            status: "EXCLUÍDO", 
            excluidoPor: usuarioLogado ? usuarioLogado.login : 'sistema' 
        }).then(() => sair());
    }
}