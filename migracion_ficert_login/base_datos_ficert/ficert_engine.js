/**
 * ====================================================================
 * MOTOR JAVASCRIPT: BASE DE DATOS FICERT (FIRESTORE REALTIME ENGINE)
 * ====================================================================
 */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configurador Global de compatibilidad de colecciones de Firestore
class FirestoreCompatCollection {
    constructor(db, collectionName) {
        this.db = db;
        this.collectionName = collectionName;
    }

    async get() {
        const colRef = collection(this.db, this.collectionName);
        const snapshot = await getDocs(colRef);
        const docs = [];
        snapshot.forEach(docSnap => {
            docs.push({
                id: docSnap.id,
                data: () => docSnap.data()
            });
        });
        return docs;
    }

    async add(data) {
        const colRef = collection(this.db, this.collectionName);
        const docRef = doc(colRef);
        await setDoc(docRef, data);
        return { id: docRef.id };
    }

    doc(docId) {
        return new FirestoreCompatDocument(this.db, this.collectionName, docId);
    }
}

class FirestoreCompatDocument {
    constructor(db, collectionName, docId) {
        this.db = db;
        this.collectionName = collectionName;
        this.docId = docId;
    }

    async update(data) {
        const docRef = doc(this.db, this.collectionName, this.docId);
        await updateDoc(docRef, data);
    }

    async delete() {
        const docRef = doc(this.db, this.collectionName, this.docId);
        await deleteDoc(docRef);
    }

    async set(data) {
        const docRef = doc(this.db, this.collectionName, this.docId);
        await setDoc(docRef, data);
    }
}

class FirestoreCompatDatabase {
    constructor(db) {
        this.db = db;
    }

    collection(collectionName) {
        return new FirestoreCompatCollection(this.db, collectionName);
    }
}

// Variables Globales
var appFicertInstance = null;
var dbFicertInstance = null;
let ficertDocListCache = [];

let excelIdSeleccionado = null;
let excelCampoSeleccionado = null;
let excelValorOriginal = null;
let excelTipoDatoOriginal = 'string';
let celdaSeleccionadaElemento = null;

// Inicialización de Firebase Global
window.initFicertFirebaseGlobal = function() {
    if (window.dbFicertInstance) {
        dbFicertInstance = window.dbFicertInstance;
        return window.dbFicertInstance;
    }
    const estadoConexion = document.getElementById('ficert-estado-conexion');
    try {
        console.log("🔥 Inicializando Firebase Ficert Modular...");
        let app = window.appFicertInstance;
        if (!app) {
            const existingApps = getApps();
            const existing = existingApps.find(a => a.name === 'ficert-app');
            if (existing) {
                app = existing;
            } else {
                // Modifica esta configuración con tus credenciales de Firebase en tu nuevo proyecto
                const firebaseConfig = {
                    apiKey: window.VITE_FIREBASE_API_KEY || "",
                    authDomain: window.VITE_FIREBASE_AUTH_DOMAIN || "",
                    projectId: window.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0926013041",
                    storageBucket: window.VITE_FIREBASE_STORAGE_BUCKET || "",
                    messagingSenderId: window.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
                    appId: window.VITE_FIREBASE_APP_ID || ""
                };
                app = initializeApp(firebaseConfig, 'ficert-app');
            }
        }

        const rawDb = getFirestore(app);
        window.appFicertInstance = app;
        window.dbFicertInstance = new FirestoreCompatDatabase(rawDb);
        dbFicertInstance = window.dbFicertInstance;

        if (estadoConexion) {
            estadoConexion.innerHTML = '<span style="color: #2ecc71; font-weight: bold;"><i class="fas fa-check-circle"></i> Conectado con éxito</span>';
        }
        return dbFicertInstance;
    } catch (error) {
        console.error("Error al inicializar Firebase Ficert Modular:", error);
        if (estadoConexion) {
            estadoConexion.innerHTML = `<span style="color: #e74c3c;"><i class="fas fa-exclamation-triangle"></i> Error de conexión: ${error.message}</span>`;
        }
    }
};

window.togglePanelFicert = function() {
    const panelFicert = document.getElementById('panelFicert');
    if (!panelFicert) return;

    if (panelFicert.style.display === 'none' || panelFicert.style.display === '') {
        panelFicert.style.display = 'block';
        if (!dbFicertInstance) {
            window.initFicertFirebaseGlobal();
        }
        window.cargarDocumentosFicert();
    } else {
        panelFicert.style.display = 'none';
    }
};

window.cerrarVentanaFicert = function() {
    const panelFicert = document.getElementById('panelFicert');
    if (panelFicert) panelFicert.style.display = 'none';
};

window.seleccionarColeccionFicert = function(valor) {
    const customInput = document.getElementById('ficertColeccionCustom');
    if (valor === 'custom') {
        customInput.style.display = 'inline-block';
        customInput.focus();
    } else {
        customInput.style.display = 'none';
    }
};

function getFicertColeccionActual() {
    const select = document.getElementById('ficertSelectorColeccion').value;
    if (select === 'custom') {
        const val = document.getElementById('ficertColeccionCustom').value.trim();
        return val || 'Pedidos';
    }
    return select;
}

window.cargarDocumentosFicert = async function() {
    if (!dbFicertInstance) {
        window.initFicertFirebaseGlobal();
    }

    const coleccion = getFicertColeccionActual();
    const container = document.getElementById('ficertDocsContainer');
    container.innerHTML = `<div style="text-align: center; color: #ef6c00; padding: 25px;"><i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 8px; display: block;"></i> Cargando la colección '${coleccion}'...</div>`;

    try {
        const snapshot = await dbFicertInstance.collection(coleccion).get();
        ficertDocListCache = [];
        snapshot.forEach(doc => {
            ficertDocListCache.push({
                id: doc.id,
                data: doc.data()
            });
        });

        renderizarDocumentosFicert(ficertDocListCache);
    } catch (error) {
        console.error("Error al obtener datos de Ficert:", error);
        container.innerHTML = `
            <div style="text-align: center; color: #e74c3c; padding: 20px; font-size: 13px;">
                <i class="fas fa-exclamation-circle" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
                Error al cargar datos:<br>
                <span style="font-family: monospace; font-size: 11px; display: block; margin-top: 6px; background: rgba(0,0,0,0.05); padding: 5px; border-radius: 4px; word-break: break-all;">${error.message || error}</span>
            </div>
        `;
    }
};

function obtenerLetraColumna(index) {
    let letStr = '';
    while (index >= 0) {
        letStr = String.fromCharCode((index % 26) + 65) + letStr;
        index = Math.floor(index / 26) - 1;
    }
    return letStr;
}

function deducirEtiquetaTipoDato(col, docs) {
    for (let i = 0; i < docs.length; i++) {
        const val = docs[i].data[col];
        if (val !== undefined && val !== null) {
            if (typeof val === 'number') {
                return (val % 1 !== 0) ? { label: 'Double', css: 'background: #e1bee7; color: #4a148c;' } : { label: 'Int64', css: 'background: #fff9c4; color: #f57f17;' };
            }
            if (typeof val === 'boolean') {
                return { label: 'Bool', css: 'background: #e8f5e9; color: #1b5e20;' };
            }
        }
    }
    return { label: 'Str', css: 'background: #e3f2fd; color: #0d47a1;' };
}

function renderizarDocumentosFicert(docs) {
    const container = document.getElementById('ficertDocsContainer');
    const badgeCant = document.getElementById('ficertCantRegs');

    if (docs.length === 0) {
        if (badgeCant) badgeCant.style.display = 'none';
        container.innerHTML = `<div style="text-align: center; color: #777; padding: 40px; font-size: 13px;">No se encontraron documentos en esta colección.</div>`;
        actualizarPestanasExcelActivas();
        return;
    }

    if (badgeCant) {
        badgeCant.innerText = `${docs.length} ${docs.length === 1 ? 'fila' : 'filas'}`;
        badgeCant.style.display = 'inline-block';
    }

    let todasLasClaves = new Set();
    docs.forEach(doc => {
        if (doc.data && typeof doc.data === 'object') {
            Object.keys(doc.data).forEach(key => todasLasClaves.add(key));
        }
    });

    const columnasDinamicas = Array.from(todasLasClaves).sort();

    let tableHeaderHtml = '<tr>';
    tableHeaderHtml += `
        <th class="ficert-sticky-col" style="min-width: 140px; text-align: left; vertical-align: bottom;">
            <span class="ficert-excel-col-letter">A</span>
            <span style="display: flex; align-items: center; gap: 4px;">Doc ID (Clave) <span class="ficert-col-type-tag" style="background: #e2e3e5; color: #383d41;">Id</span></span>
        </th>
    `;

    columnasDinamicas.forEach((col, idx) => {
        const letra = obtenerLetraColumna(idx + 1);
        const tipoInfo = deducirEtiquetaTipoDato(col, docs);
        tableHeaderHtml += `
            <th title="${col}" style="vertical-align: bottom; text-align: left;">
                <span class="ficert-excel-col-letter">${letra}</span>
                <span style="display: flex; align-items: center; gap: 4px; justify-content: space-between; width: 100%;">
                    <span>${col}</span>
                    <span class="ficert-col-type-tag" style="${tipoInfo.css}">${tipoInfo.label}</span>
                </span>
            </th>
        `;
    });

    const letraAcciones = obtenerLetraColumna(columnasDinamicas.length + 1);
    tableHeaderHtml += `
        <th style="text-align: center; min-width: 100px; position: sticky; right: 0; background: #f1f3f5; z-index: 5; vertical-align: bottom;">
            <span class="ficert-excel-col-letter">${letraAcciones}</span>
            Acciones
        </th>
    </tr>`;

    let tableRowsHtml = '';
    docs.forEach((doc, idx) => {
        let rowHtml = '<tr>';
        rowHtml += `
            <td class="ficert-sticky-col" title="${doc.id}" style="color: #ef6c00; font-family: monospace; font-weight: bold;" onclick="seleccionarCeldaExcel(this, '${doc.id.replace(/'/g, "\\'")}', 'doc_id', '${doc.id.replace(/'/g, "\\'")}', 'string')">
                ${doc.id}
            </td>
        `;

        columnasDinamicas.forEach(col => {
            const val = doc.data[col];
            let displayVal = val === undefined || val === null ? '<span class="ficert-cell-null">(vacío)</span>' : String(val);
            let titleVal = val === undefined || val === null ? 'null' : String(val);
            let tipoDato = typeof val;

            const valorEscapadoStr = String(titleVal).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            rowHtml += `<td title="${titleVal.replace(/"/g, '&quot;')}" onclick="seleccionarCeldaExcel(this, '${doc.id.replace(/'/g, "\\'")}', '${col.replace(/'/g, "\\'")}', '${valorEscapadoStr}', '${tipoDato}')">${displayVal}</td>`;
        });

        rowHtml += `
            <td style="text-align: center; position: sticky; right: 0; background: #ffffff; z-index: 4;">
                <div class="ficert-td-actions" style="justify-content: center;">
                    <button class="ficert-row-btn ficert-row-btn-edit" onclick="editarDocFicert(${idx})" title="Editar en Formulario">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="ficert-row-btn ficert-row-btn-delete" onclick="eliminarDocFicert('${doc.id.replace(/'/g, "\\'")}', ${idx}, event)" title="Eliminar de Firestore">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>`;
        tableRowsHtml += rowHtml;
    });

    container.innerHTML = `
        <div class="ficert-excel-table-wrapper">
            <table class="ficert-table">
                <thead>${tableHeaderHtml}</thead>
                <tbody>${tableRowsHtml}</tbody>
            </table>
        </div>
    `;

    actualizarPestanasExcelActivas();
}

window.seleccionarCeldaExcel = function(cell, docId, campo, valorOriginalStr, tipoDato) {
    excelIdSeleccionado = docId;
    excelCampoSeleccionado = campo;
    excelValorOriginal = valorOriginalStr;
    excelTipoDatoOriginal = tipoDato;
    celdaSeleccionadaElemento = cell;

    const fxCellRef = document.getElementById('ficertFxCellRef');
    const fxValueInput = document.getElementById('ficertFxValueInput');

    if (fxCellRef) fxCellRef.innerText = `${campo} (${docId})`;
    if (fxValueInput) {
        fxValueInput.value = (valorOriginalStr === 'undefined' || valorOriginalStr === 'null') ? '' : valorOriginalStr;
        fxValueInput.focus();
    }

    const anterior = document.querySelector('.ficert-cell-selected');
    if (anterior) anterior.classList.remove('ficert-cell-selected');
    cell.classList.add('ficert-cell-selected');
};

window.cancelarEdicionCeldaExcel = function() {
    const fxValueInput = document.getElementById('ficertFxValueInput');
    if (fxValueInput) fxValueInput.value = (excelValorOriginal === 'undefined' || excelValorOriginal === 'null') ? '' : excelValorOriginal;

    const anterior = document.querySelector('.ficert-cell-selected');
    if (anterior) anterior.classList.remove('ficert-cell-selected');

    const fxCellRef = document.getElementById('ficertFxCellRef');
    if (fxCellRef) fxCellRef.innerText = '(Ninguna celda)';

    excelIdSeleccionado = null;
    excelCampoSeleccionado = null;
    excelValorOriginal = null;
    celdaSeleccionadaElemento = null;
};

window.guardarEdicionCeldaExcel = async function() {
    if (!excelIdSeleccionado || !excelCampoSeleccionado) {
        alert("Selecciona una celda para editar su contenido.");
        return;
    }
    if (excelCampoSeleccionado === 'doc_id') {
        alert("No se puede editar los IDs de documentos directamente.");
        return;
    }

    const fxValueInput = document.getElementById('ficertFxValueInput');
    if (!fxValueInput) return;

    const nuevoValorRaw = fxValueInput.value;
    let nuevoValorParseado;

    if (excelTipoDatoOriginal === 'number') {
        nuevoValorParseado = Number(nuevoValorRaw);
        if (isNaN(nuevoValorParseado)) {
            alert(`El valor ingresado no es un número válido.`);
            return;
        }
    } else if (excelTipoDatoOriginal === 'boolean') {
        nuevoValorParseado = (nuevoValorRaw.toLowerCase().trim() === 'true');
    } else {
        nuevoValorParseado = nuevoValorRaw;
    }

    const coleccion = getFicertColeccionActual();
    try {
        await dbFicertInstance.collection(coleccion).doc(excelIdSeleccionado).update({
            [excelCampoSeleccionado]: nuevoValorParseado
        });

        if (celdaSeleccionadaElemento) {
            celdaSeleccionadaElemento.innerText = String(nuevoValorParseado);
        }

        const docObj = ficertDocListCache.find(d => d.id === excelIdSeleccionado);
        if (docObj && docObj.data) {
            docObj.data[excelCampoSeleccionado] = nuevoValorParseado;
        }

        excelValorOriginal = String(nuevoValorParseado);
    } catch (error) {
        console.error("Error al actualizar celda:", error);
        alert("No se ha podido guardar el cambio: " + error.message);
    }
};

window.detectarEnterEdicionCelda = function(event) {
    if (event.key === 'Enter') {
        window.guardarEdicionCeldaExcel();
    }
};

window.cambiarHojaColeccionFicert = function(coleccionName) {
    const select = document.getElementById('ficertSelectorColeccion');
    if (select) {
        select.value = coleccionName;
        window.cargarDocumentosFicert();
    }
};

function actualizarPestanasExcelActivas() {
    const coleccionActual = getFicertColeccionActual();
    const tabsRow = document.getElementById('ficertExcelTabsRow');
    if (!tabsRow) return;

    const tabs = tabsRow.querySelectorAll('.ficert-excel-tab');
    tabs.forEach(tab => {
        if (tab.innerText.trim() === coleccionActual) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

window.toggleAnchoFicert = function() {
    const panel = document.getElementById('panelFicert');
    if (panel) {
        panel.style.width = (panel.style.width === '450px') ? '900px' : '450px';
    }
};

window.filtrarDocumentosFicert = function(texto) {
    const query = texto.toLowerCase().trim();
    if (!query) {
        renderizarDocumentosFicert(ficertDocListCache);
        return;
    }

    const filtered = ficertDocListCache.filter(doc => {
        const idMatch = doc.id.toLowerCase().includes(query);
        const contentMatch = JSON.stringify(doc.data).toLowerCase().includes(query);
        return idMatch || contentMatch;
    });

    renderizarDocumentosFicert(filtered);
};

window.eliminarDocFicert = async function(docId, idx, event) {
    if (event) event.stopPropagation();
    if (!confirm(`¿Estás seguro de que deseas eliminar el documento "${docId}"?`)) {
        return;
    }

    const coleccion = getFicertColeccionActual();
    try {
        await dbFicertInstance.collection(coleccion).doc(docId).delete();
        alert("Documento eliminado correctamente.");
        ficertDocListCache = ficertDocListCache.filter(doc => doc.id !== docId);
        renderizarDocumentosFicert(ficertDocListCache);
    } catch (error) {
        console.error("Error al eliminar documento:", error);
        alert("Error al eliminar: " + error.message);
    }
};

window.abrirModalCrearFicert = function() {
    document.getElementById('ficertFormCrear').style.display = 'block';
};

window.cerrarFormCrearFicert = function() {
    document.getElementById('ficertFormCrear').style.display = 'none';
};

window.guardarNuevoDocFicert = async function() {
    const coleccion = getFicertColeccionActual();
    const docId = document.getElementById('ficertFormId').value.trim();
    const nguia = document.getElementById('ficertFormNguia').value.toUpperCase().trim();

    if (!nguia) {
        alert("El Número de Guía (NGUIA) es requerido.");
        return;
    }

    const payloadData = {
        NGUIA: nguia,
        RECIBE_NOMBRE: document.getElementById('ficertFormRecibeNombre').value.toUpperCase().trim(),
        RECIBE_APELLIDO: document.getElementById('ficertFormRecibeApellido').value.toUpperCase().trim(),
        DIRECCION: document.getElementById('ficertFormDireccion').value.toUpperCase().trim(),
        RUTA: document.getElementById('ficertFormRuta').value.toUpperCase().trim(),
        ACOBRAR: parseFloat(document.getElementById('ficertFormAcobrar').value) || 0,
        CONTENIDO: document.getElementById('ficertFormContenido').value.toUpperCase().trim(),
        ENVIA: document.getElementById('ficertFormEnvia').value.toUpperCase().trim(),
        TELEFONO: document.getElementById('ficertFormTelefono').value.toUpperCase().trim(),
        REFERENCIA: document.getElementById('ficertFormReferencia').value.toUpperCase().trim()
    };

    try {
        if (docId) {
            await dbFicertInstance.collection(coleccion).doc(docId).set(payloadData);
        } else {
            await dbFicertInstance.collection(coleccion).add(payloadData);
        }

        alert("¡Documento guardado con éxito!");
        window.cerrarFormCrearFicert();
        window.cargarDocumentosFicert();
    } catch (error) {
        console.error("Error al guardar en Firestore:", error);
        alert("Error al intentar guardar: " + error.message);
    }
};

// Auto-inicialización
try {
    window.initFicertFirebaseGlobal();
} catch (e) {}
