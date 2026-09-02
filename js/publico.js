let clientesDaPasta = [];

function carregarDadosPublicos(pastaId) {
    pastaId = decodeURIComponent(pastaId).toUpperCase();

    db.collection("pastas").doc(pastaId).get().then(doc => {
        if (doc.exists) {
            const p = doc.data();
            document.getElementById('pub-titulo-pasta').innerText = doc.id;
            document.getElementById('pub-endereco').innerHTML = `<b>Endereço:</b> ${p.endereco || 'N/A'}`;
            document.getElementById('pub-andar').innerHTML = `<b>Andar/Sala:</b> ${p.andar || 'N/A'}`;
            document.getElementById('pub-caixa').innerHTML = `<b>Caixa:</b> ${p.caixa || 'N/A'} &nbsp;&nbsp; <b>Nº:</b> ${p.numero || 'N/A'}`;
            
            if (p.obs) {
                document.getElementById('pub-obs').innerText = `⚠️ OBS: ${p.obs}`;
                document.getElementById('pub-obs').style.display = 'block';
            }
        } else {
            document.getElementById('pub-titulo-pasta').innerText = "Pasta Inativa ou Excluída";
            document.getElementById('pub-lista-clientes').innerHTML = "";
        }
    });

    db.collection("clientes")
      .where("pasta", "==", pastaId)
      .where("status", "==", "ATIVO")
      .onSnapshot(snapshot => {
          clientesDaPasta = [];
          snapshot.forEach(doc => {
              clientesDaPasta.push(doc.data());
          });
          filtrarListaPublica(); 
      });
}

function filtrarListaPublica() {
    const termo = document.getElementById('pub-busca').value.toLowerCase();
    const divLista = document.getElementById('pub-lista-clientes');
    
    const filtrados = clientesDaPasta.filter(c => 
        c.nome.toLowerCase().includes(termo) || 
        c.cpf.includes(termo) || 
        (c.processo && c.processo.toLowerCase().includes(termo))
    );

    if (filtrados.length === 0) {
        divLista.innerHTML = '<p style="text-align: center; color: #86868b; margin-top: 20px;">Nenhum documento encontrado.</p>';
        return;
    }

    let html = `<p style="font-size: 13px; color: #86868b; margin-bottom: 10px;">${filtrados.length} documento(s) nesta pasta:</p>`;
    
    filtrados.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(c => {
        const dataFormatada = c.data ? c.data.split('-').reverse().join('/') : 'N/I';
        const obsHtml = c.obs ? `<div class="info-detalhe" style="color: var(--danger); font-weight: 600;">⚠️ OBS: ${c.obs}</div>` : '';
        
        html += `
        <div class="card-item" style="flex-direction: column; align-items: flex-start; cursor: default;">
            <div style="font-weight: 600; color: var(--text-main); font-size: 16px;">${c.nome}</div>
            <div class="info-detalhe">CPF: ${c.cpf} | Processo: ${c.processo || 'N/I'}</div>
            <div class="info-detalhe">Data Cad.: ${dataFormatada}</div>
            ${obsHtml}
        </div>`;
    });
    
    divLista.innerHTML = html;
}