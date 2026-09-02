const firebaseConfig = {
    apiKey: "AIzaSyB8cxkzGDC2f--Wpbjhs-zO868aeu_XeVY",
    authDomain: "proponto-73a2e.firebaseapp.com",
    projectId: "proponto-73a2e",
    storageBucket: "proponto-73a2e.firebasestorage.app",
    messagingSenderId: "250329635867",
    appId: "1:250329635867:web:a343e85d0a42c3eb04ecbe"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let memoriaDoSistema = { pastas: [], clientes: [], usuarios: [] };
let usuarioLogado = null;

function iniciarSistema() {
    document.getElementById('dashboard-screen').style.display = 'block';
    
    db.collection("pastas").where("status", "==", "ATIVO").onSnapshot((snapshot) => {
        memoriaDoSistema.pastas = [];
        snapshot.forEach(doc => memoriaDoSistema.pastas.push(doc.id));
        desenharPastas();
    });

    db.collection("clientes").where("status", "==", "ATIVO").onSnapshot((snapshot) => {
        memoriaDoSistema.clientes = [];
        snapshot.forEach(doc => {
            memoriaDoSistema.clientes.push({ idFirebase: doc.id, ...doc.data() });
        });
        
        const telaPastaAberta = document.getElementById('app-screen').style.display === 'block';
        if (telaPastaAberta) filtrarClientesDaPasta();
        
        const urlParams = new URLSearchParams(window.location.search);
        const pastaQR = urlParams.get('pasta'); 
        if (pastaQR && !telaPastaAberta) abrirTelaPasta(pastaQR);
    });
}