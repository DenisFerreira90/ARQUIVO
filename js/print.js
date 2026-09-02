function gerarImpressao(id) {
    db.collection("pastas").doc(id).get().then(doc => {
        if (doc.exists) {
            preencherEImprimir(id, doc.data());
        }
    });
}

function imprimirEspelho() {
    const id = document.getElementById('titulo-pasta').innerText;
    db.collection("pastas").doc(id).get().then(doc => {
        if (doc.exists) {
            preencherEImprimir(id, doc.data());
        }
    });
}

function preencherEImprimir(id, dados) {
    document.getElementById('print-pasta-id').innerText = id;
    document.getElementById('print-endereco').innerHTML = `<b>Endereço:</b> ${dados.endereco || 'N/A'}`;
    document.getElementById('print-andar').innerHTML = `<b>Andar/Sala:</b> ${dados.andar || 'N/A'}`;
    document.getElementById('print-caixa').innerHTML = `<b>Caixa:</b> ${dados.caixa || 'N/A'} &nbsp;&nbsp; <b>Nº:</b> ${dados.numero || 'N/A'}`;
    
    // Gera o link público apontando para o arquivo pasta.html que criamos
    const baseUrl = window.location.origin; 
    const urlPublica = `${baseUrl}/pasta.html?id=${encodeURIComponent(id)}`;
    
    // Cria a imagem do QR Code
    document.getElementById('print-qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(urlPublica)}`;
    
    // Aguarda meio segundo para a imagem do QR Code carregar na tela antes de abrir a janela de impressão
    setTimeout(() => {
        window.print();
    }, 500);
}