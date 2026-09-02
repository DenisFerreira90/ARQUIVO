// =========================================================
// ARQUIVO INTELIGENTE - CONSULTA PÚBLICA (QR CODE)
// =========================================================

let clientesDaPasta = [];

function carregarDadosPublicos(pastaId) {
    const tituloEl = document.getElementById('pub-titulo-pasta');
    const listaEl = document.getElementById('pub-lista-clientes');

    if (!pastaId) {
        if (tituloEl) tituloEl.innerText = "ID não informado";
        if (listaEl) listaEl.innerHTML = "<p style='text-align:center; color:#86868b;'>Nenhum código de pasta foi detectado na URL.</p>";
        return;
    }

    // Tratamento seguro de caracteres da URL
    let idLimpo = pastaId;
    try {
        idLimpo = decodeURIComponent(pastaId).trim();
    } catch (e) {
        idLimpo = pastaId.trim();
    }

    // Validação se o Firebase foi carregado corretamente
    if (typeof db === 'undefined' || !db) {
        if (tituloEl) tituloEl.innerText = "Erro de Conexão";
        if (listaEl) listaEl.innerHTML = "<p style='text-align:center; color:red;'>Erro: O banco de dados (db) não foi inicializado no config.js.</p>";
        return;
    }

    // 1. Busca os dados da Pasta
    db.collection("pastas").doc(idLimpo).get().then(doc => {
        if (doc.exists && doc.data().status === "ATIVO") {
            const p = doc.data();
            if (tituloEl) tituloEl.innerText = doc.id;
            
            document.getElementById('pub-endereco').innerHTML = `<b>Endereço:</b> ${p.endereco || 'N/A'}`;
            document.getElementById('pub-andar').innerHTML = `<b>Andar/Sala:</b> ${p.andar || 'N/A'}`;
            document.getElementById('pub-caixa').innerHTML = `<b>Caixa:</b> ${p.caixa || 'N/A'} &nbsp;&nbsp; <b>Nº:</b> ${p.numero || 'N/A'}`;
            
            const divObs = document.getElementById('pub-obs');
            if (p.obs) {
                divObs.innerText = `⚠️ OBS: ${p.obs}`;
                divObs.style.display = 'block';
            } else {
                divObs.style.display = 'none';
            }
        } else {
            // Se o ID digitado não bater com nenhuma pasta do banco
            if (tituloEl) tituloEl.innerText = "Pasta não encontrada";
            document.getElementById('pub-endereco').innerHTML = "";
            document.getElementById('pub-andar').innerHTML = "";
            document.getElementById('pub-caixa').innerHTML = "";
            document.getElementById('pub-obs').style.display = 'none';
            if (listaEl) listaEl.innerHTML = `<p style="text-align: center; color: #86868b; margin-top: 20px;">A pasta <b>"${idLimpo}"</b> não existe ou foi excluída do sistema.</p>`;
        }
    }).catch(erro => {
        console.error("Erro Firestore Pasta:", erro);
        if (tituloEl) tituloEl.innerText = "Erro de Leitura";
        if (listaEl) listaEl.innerHTML = `<p style="text-align: center; color: red;">Erro ao acessar banco de dados: ${erro.message}</p>`;
    });

    // 2. Busca os Clientes em Tempo Real
    db.collection("clientes")
      .where("pasta", "==", idLimpo)
      .where("status", "==", "ATIVO")
      .onSnapshot(snapshot => {
          clientesDaPasta = [];
          snapshot.forEach(doc => {
              clientesDaPasta.push({ idFirebase: doc.id, ...doc.data() });
          });
          filtrarListaPublica(); 
      }, erro => {
          console.error("Erro Firestore Clientes:", erro);
          if (listaEl) listaEl.innerHTML = `<p style="text-align: center; color: red;">Erro de Permissão: ${erro.message}</p>`;
      });
}

function filtrarListaPublica() {
    const campoBusca = document.getElementById('pub-busca');
    const termo = campoBusca ? campoBusca.value.toLowerCase().trim() : '';
    const divLista = document.getElementById('pub-lista-clientes');
    
    if (!divLista) return;

    const filtrados = clientesDaPasta.filter(c => 
        (c.nome && c.nome.toLowerCase().includes(termo)) || 
        (c.cpf && c.cpf.includes(termo)) || 
        (c.processo && c.processo.toLowerCase().includes(termo))
    );

    if (filtrados.length === 0) {
        divLista.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 20px;">Nenhum documento cadastrado nesta pasta.</p>';
        return;
    }

    let html = `<p style="font-size: 13px; color: var(--text-muted); margin-bottom: 10px;">${filtrados.length} documento(s) nesta pasta:</p>`;
    
    filtrados.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(c => {
        const dataFormatada = c.data ? c.data.split('-').reverse().join('/') : 'N/I';
        const obsHtml = c.obs ? `<div class="info-detalhe" style="color: var(--danger); font-weight: 600; margin-top: 6px;">⚠️ OBS: ${c.obs}</div>` : '';
        const processoTexto = c.processo ? c.processo : 'N/I';
        
        html += `
        <div class="card-item" style="flex-direction: column; align-items: flex-start; cursor: default; margin-bottom: 10px;">
            <div style="font-weight: 600; color: var(--text-main); font-size: 16px;">${c.nome}</div>
            <div class="info-detalhe">CPF: ${c.cpf || 'N/I'} | Processo: ${processoTexto}</div>
            <div class="info-detalhe">Data Cad.: ${dataFormatada}</div>
            ${obsHtml}
        </div>`;
    });
    
    divLista.innerHTML = html;
}