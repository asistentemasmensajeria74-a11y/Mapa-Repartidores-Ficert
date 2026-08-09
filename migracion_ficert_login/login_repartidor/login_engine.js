/**
 * ====================================================================
 * MOTOR JAVASCRIPT: AUTENTICACIÓN Y SESIÓN DE REPARTIDORES
 * ====================================================================
 */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let repartidorLogueado = null;

// Obtener o inicializar la app de Firebase
function getFirestoreDbAsync() {
    let app = getApps().find(a => a.name === 'ficert-app') || getApps()[0];
    if (!app) {
        const firebaseConfig = {
            apiKey: window.VITE_FIREBASE_API_KEY || "",
            authDomain: window.VITE_FIREBASE_AUTH_DOMAIN || "",
            projectId: window.VITE_FIREBASE_PROJECT_ID || "",
            storageBucket: window.VITE_FIREBASE_STORAGE_BUCKET || "",
            messagingSenderId: window.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
            appId: window.VITE_FIREBASE_APP_ID || ""
        };
        app = initializeApp(firebaseConfig, 'ficert-app');
    }
    const db = getFirestore(app);
    return { app, db };
}

// Obtener colecciones normalizadas en mayúsculas/minúsculas
async function getRawCollectionNormalized(collectionName) {
    const { db } = getFirestoreDbAsync();
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const results = [];
    
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const upperData = {};
        Object.keys(data).forEach(key => {
            upperData[key.toUpperCase()] = data[key];
        });
        results.push({
            id: docSnap.id,
            dataRaw: data,
            dataUpper: upperData
        });
    });
    return results;
}

// Devuelve el ID_REPA activo
window.obtenerIdRepaLogueadoFirestore = async function() {
    if (!repartidorLogueado) return null;
    
    if (repartidorLogueado.ID_REPA) {
        return repartidorLogueado.ID_REPA;
    }
    
    try {
        const repartidoresDocs = await getRawCollectionNormalized("REPARTIDORES");
        const matchedRef = repartidoresDocs.find(d => 
            String(d.id).trim() === String(repartidorLogueado.id).trim() ||
            String(d.dataUpper['REPA_CORREO'] || d.dataRaw.REPA_CORREO || '').toLowerCase().trim() === String(repartidorLogueado.REPA_CORREO || '').toLowerCase().trim()
        );
        if (matchedRef) {
            const dataUpper = matchedRef.dataUpper || {};
            const dbIdRepa = (dataUpper['ID_REPA'] || dataUpper['ID_REPARTIDOR'] || matchedRef.id || '').toString().trim();
            if (dbIdRepa) {
                repartidorLogueado.ID_REPA = dbIdRepa;
                localStorage.setItem('estado_repartidor_activo', JSON.stringify(repartidorLogueado));
                return dbIdRepa;
            }
        }
    } catch (error) {
        console.error("Error al obtener ID_REPA desde Firestore:", error);
    }
    return repartidorLogueado.id;
};

// Verificar la sesión guardada en localStorage
window.verificarSesionRepartidor = function() {
    const sesionStr = localStorage.getItem('estado_repartidor_activo');
    const pantalla = document.getElementById('pantallaLogin');
    
    if (sesionStr) {
        try {
            repartidorLogueado = JSON.parse(sesionStr);
            console.log("👤 Sesión de repartidor recuperada:", repartidorLogueado);
            
            if (pantalla) {
                pantalla.style.transition = "opacity 0.4s ease";
                pantalla.style.opacity = "0";
                setTimeout(() => {
                    pantalla.style.display = "none";
                }, 400);
            }
            actualizarUiConRepartidorLogueado();
            
        } catch (e) {
            console.error("Error parseando sesión de repartidor:", e);
            localStorage.removeItem('estado_repartidor_activo');
            repartidorLogueado = null;
            if (pantalla) pantalla.style.display = "flex";
        }
    } else {
        repartidorLogueado = null;
        if (pantalla) {
            pantalla.style.opacity = "1";
            pantalla.style.display = "flex";
        }
        
        const emailInput = document.getElementById('loginEmail');
        const passInput = document.getElementById('loginPassword');
        if (emailInput) emailInput.value = '';
        if (passInput) passInput.value = '';
        
        const errorDiv = document.getElementById('loginErrorMsg');
        if (errorDiv) errorDiv.style.display = 'none';

        actualizarUiConRepartidorLogueado();
    }
};

function actualizarUiConRepartidorLogueado() {
    const caja = document.getElementById('cajaSesionRepartidor');
    const nombreS = document.getElementById('repartidorNombre');
    const correoS = document.getElementById('repartidorCorreo');
    const rutaS = document.getElementById('repartidorRutaBadge');
    const inicialesS = document.getElementById('repartidorIniciales');

    if (repartidorLogueado) {
        if (caja) caja.style.display = "flex";
        if (nombreS) nombreS.textContent = repartidorLogueado.NOMBRE || 'Repartidor';
        if (correoS) correoS.textContent = repartidorLogueado.REPA_CORREO || '';
        if (rutaS) rutaS.textContent = `Ruta ${repartidorLogueado.REPA_RUTA || '1'}`;
        if (inicialesS) {
            const nombre = repartidorLogueado.NOMBRE || 'R';
            inicialesS.textContent = nombre.charAt(0).toUpperCase();
        }
        sincronizarSwitchDisponibilidad();
    } else {
        if (caja) caja.style.display = "none";
    }
}

// Ejecutar Login
window.ejecutarLoginRepartidor = async function() {
    const btn = document.getElementById('btnSumitLogin');
    const errorDiv = document.getElementById('loginErrorMsg');
    const emailInput = document.getElementById('loginEmail');
    const passInput = document.getElementById('loginPassword');
    
    if (!emailInput || !passInput) return;

    const enteredEmail = emailInput.value.trim().toLowerCase();
    const enteredPassword = passInput.value.trim();
    
    if (!enteredEmail || !enteredPassword) {
        if (errorDiv) {
            errorDiv.textContent = "⚠️ Por favor ingresa el correo y la contraseña.";
            errorDiv.style.display = "block";
        }
        return;
    }

    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando alta...';
        }
        if (errorDiv) errorDiv.style.display = "none";

        const docs = await getRawCollectionNormalized("REPARTIDORES");
        
        let matchedDoc = null;
        let repaCorreo = '';
        let repaContra = '';
        let repaRuta = '';
        let repaNombre = '';

        for (const docObj of docs) {
            const dataUpper = docObj.dataUpper || {};
            const dataRaw = docObj.dataRaw || {};

            const dbEmail = (dataUpper['REPA_CORREO'] || dataRaw.REPA_CORREO || '').toString().toLowerCase().trim();
            const dbContra = (dataUpper['CONTRASEÑA'] || dataRaw.CONTRASEÑA || '').toString().trim();
            const dbRuta = (dataUpper['REPA_RUTA'] || dataUpper['RUTA'] || '1').toString().trim();
            const dbNombre = (dataUpper['REPA_NOMBRE'] || dataUpper['NOMBRE'] || 'Repartidor').toString().trim();

            if (dbEmail === enteredEmail && dbContra === enteredPassword) {
                matchedDoc = docObj;
                repaCorreo = dbEmail;
                repaContra = dbContra;
                repaRuta = dbRuta;
                repaNombre = dbNombre;
                break;
            }
        }

        if (matchedDoc) {
            console.log(`✅ Acceso concedido para: ${repaNombre}, Ruta asignada: ${repaRuta}`);
            
            const dataUpper = matchedDoc.dataUpper || {};
            const dbIdRepa = (dataUpper['ID_REPA'] || matchedDoc.id || '').toString().trim();

            const infoSesion = {
                id: matchedDoc.id,
                REPA_CORREO: repaCorreo,
                REPA_RUTA: repaRuta,
                repaRuta: repaRuta,
                CONTRASEÑA: repaContra,
                NOMBRE: repaNombre,
                ID_REPA: dbIdRepa
            };
            
            localStorage.setItem('estado_repartidor_activo', JSON.stringify(infoSesion));
            
            // Actualizar REPA_ESTADO a "DISPONIBLE"
            try {
                const { db } = getFirestoreDbAsync();
                const docRef = doc(db, "REPARTIDORES", matchedDoc.id);
                await updateDoc(docRef, { REPA_ESTADO: "DISPONIBLE" });
            } catch (errEstado) {
                console.error("❌ Error actualizando REPA_ESTADO:", errEstado);
            }

            passInput.value = "";
            window.verificarSesionRepartidor();
            
        } else {
            if (errorDiv) {
                errorDiv.textContent = "⚠️ Correo o contraseña incorrectos, o usuario no está de alta.";
                errorDiv.style.display = "block";
            }
        }
    } catch (error) {
        console.error("Error en ejecutarLoginRepartidor:", error);
        if (errorDiv) {
            errorDiv.textContent = "❌ Error de conexión: " + error.message;
            errorDiv.style.display = "block";
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>Ingresar al Sistema</span> <i class="fas fa-sign-in-alt"></i>';
        }
    }
};

// Cerrar sesión
window.logoutRepartidor = async function() {
    if (repartidorLogueado && repartidorLogueado.id) {
        try {
            const { db } = getFirestoreDbAsync();
            const docRef = doc(db, "REPARTIDORES", repartidorLogueado.id);
            await updateDoc(docRef, { REPA_ESTADO: "INACTIVO" });
        } catch (errEstado) {
            console.error("❌ Error actualizando REPA_ESTADO en logout:", errEstado);
        }
    }

    localStorage.removeItem('estado_repartidor_activo');
    repartidorLogueado = null;
    window.verificarSesionRepartidor();
};

async function sincronizarSwitchDisponibilidad() {
    if (!repartidorLogueado) return;
    try {
        const { db } = getFirestoreDbAsync();
        const docRef = doc(db, "REPARTIDORES", repartidorLogueado.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const estado = String(data.REPA_ESTADO || 'DISPONIBLE').toUpperCase().trim();
            
            const indicator = document.getElementById('indicatorEstadoRepartidor');
            const txt = document.getElementById('txtEstadoRepartidor');
            
            if (indicator) {
                indicator.style.color = (estado === 'DISPONIBLE') ? '#2ecc71' : '#e74c3c';
            }
            if (txt) {
                txt.innerHTML = `<i class="fas fa-circle" id="indicatorEstadoRepartidor" style="color: ${(estado === 'DISPONIBLE') ? '#2ecc71' : '#e74c3c'}; font-size: 10px;"></i> ${estado === 'DISPONIBLE' ? 'Disponible' : 'Inactivo'}`;
            }
        }
    } catch (error) {
        console.warn("Error al sincronizar disponibilidad:", error);
    }  
}

// Configurar botón toggle de mostrar/ocultar contraseña
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggleLoginPasswordBtn');
    const passInput = document.getElementById('loginPassword');
    if (toggleBtn && passInput) {
        toggleBtn.addEventListener('click', () => {
            const isPass = passInput.type === 'password';
            passInput.type = isPass ? 'text' : 'password';
            toggleBtn.className = isPass ? 'fas fa-eye-slash' : 'fas fa-eye';
        });
    }
});

// Auto-verificación de sesión al iniciar
try {
    window.verificarSesionRepartidor();
} catch(e) {}
