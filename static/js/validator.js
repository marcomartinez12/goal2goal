/**
 * SISTEMA DE VALIDACIÓN DE PREDICCIONES BTTS
 * Compara predicciones del simulador contra datos históricos reales
 */

let partidosReales = [];
let validationStats = {
    aciertos: 0,
    fallos: 0,
    precision: 0,
    confianza: 0
};

/**
 * Carga datos históricos reales
 */
async function cargarDatosHistoricos() {
    try {
        const response = await fetch('/static/data/partidos_reales.json');
        const data = await response.json();
        partidosReales = data.partidos;
        console.log(`✓ ${partidosReales.length} partidos históricos cargados`);
        return partidosReales;
    } catch (error) {
        console.error('Error cargando datos históricos:', error);
        return [];
    }
}

/**
 * Busca partidos similares en el histórico
 * @param {string} equipo1 - Nombre equipo local
 * @param {string} equipo2 - Nombre equipo visitante
 * @returns {Array} - Partidos similares encontrados
 */
function buscarPartidosSimilares(equipo1, equipo2) {
    if (partidosReales.length === 0) return [];

    // Buscar coincidencias exactas
    const exactos = partidosReales.filter(p =>
        (p.equipo_local.toLowerCase().includes(equipo1.toLowerCase()) &&
         p.equipo_visitante.toLowerCase().includes(equipo2.toLowerCase())) ||
        (p.equipo_local.toLowerCase().includes(equipo2.toLowerCase()) &&
         p.equipo_visitante.toLowerCase().includes(equipo1.toLowerCase()))
    );

    if (exactos.length > 0) return exactos;

    // Si no hay exactos, buscar partidos con equipos similares
    const similares = partidosReales.filter(p =>
        p.equipo_local.toLowerCase().includes(equipo1.toLowerCase().split(' ')[0]) ||
        p.equipo_visitante.toLowerCase().includes(equipo2.toLowerCase().split(' ')[0])
    );

    return similares.length > 0 ? similares.slice(0, 5) : [];
}

/**
 * Valida una predicción BTTS contra datos históricos
 * @param {Object} prediccion - {team1, team2, btts_predicho, probabilidad}
 * @returns {Object} - Resultado de validación
 */
function validarPrediccion(prediccion) {
    const partidosSimilares = buscarPartidosSimilares(prediccion.team1, prediccion.team2);

    if (partidosSimilares.length === 0) {
        return {
            validado: false,
            mensaje: 'No hay datos históricos suficientes',
            confianza: 30,
            partidosSimilares: []
        };
    }

    // Calcular tasa de BTTS en partidos similares
    const totalBTTS = partidosSimilares.filter(p => p.btts === true).length;
    const tasaBTTS = (totalBTTS / partidosSimilares.length) * 100;

    // Comparar con predicción
    const prediccionCorrecta =
        (prediccion.btts_predicho && tasaBTTS > 50) ||
        (!prediccion.btts_predicho && tasaBTTS <= 50);

    // Calcular confianza basada en coincidencias
    const confianza = Math.min(50 + (partidosSimilares.length * 10), 95);

    return {
        validado: true,
        acierto: prediccionCorrecta,
        tasaBTTS_historica: tasaBTTS.toFixed(1),
        partidosSimilares: partidosSimilares.slice(0, 3),
        confianza: confianza,
        mensaje: prediccionCorrecta
            ? `✓ Predicción alineada con histórico (${tasaBTTS.toFixed(0)}% BTTS)`
            : `⚠ Predicción difiere del histórico (${tasaBTTS.toFixed(0)}% BTTS)`
    };
}

/**
 * Muestra panel de validación en el UI
 * @param {Object} validacion - Resultado de validación
 */
function mostrarPanelValidacion(validacion) {
    // Buscar o crear contenedor de validación
    let panel = document.getElementById('validation-panel');

    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'validation-panel';
        panel.className = 'validation-panel';

        // Insertar después del resultado BTTS
        const bttsResult = document.getElementById('btts-result');
        if (bttsResult) {
            bttsResult.parentNode.insertBefore(panel, bttsResult.nextSibling);
        }
    }

    if (!validacion.validado) {
        panel.innerHTML = `
            <div class="validation-no-data">
                <i class="fas fa-info-circle"></i>
                <span>${validacion.mensaje}</span>
                <span class="confidence-badge low">Confianza: ${validacion.confianza}%</span>
            </div>
        `;
        return;
    }

    // Panel completo de validación
    const confianzaClass = validacion.confianza > 70 ? 'high' : validacion.confianza > 50 ? 'medium' : 'low';
    const statusIcon = validacion.acierto ? '✓' : '⚠';
    const statusClass = validacion.acierto ? 'success' : 'warning';

    let partidosHTML = '';
    validacion.partidosSimilares.forEach(p => {
        const bttsIcon = p.btts ? '⚽⚽' : '❌';
        partidosHTML += `
            <div class="historical-match">
                <div class="match-teams">${p.equipo_local} vs ${p.equipo_visitante}</div>
                <div class="match-result">${p.goles_local}-${p.goles_visitante} ${bttsIcon}</div>
                <div class="match-date">${p.fecha}</div>
            </div>
        `;
    });

    panel.innerHTML = `
        <div class="validation-header">
            <h4><i class="fas fa-chart-line"></i> Validación con Datos Reales</h4>
            <span class="confidence-badge ${confianzaClass}">
                <i class="fas fa-shield-alt"></i> Confianza: ${validacion.confianza}%
            </span>
        </div>

        <div class="validation-status ${statusClass}">
            <span class="status-icon">${statusIcon}</span>
            <span class="status-message">${validacion.mensaje}</span>
        </div>

        <div class="historical-stats">
            <div class="stat-item">
                <span class="stat-label">BTTS Histórico:</span>
                <span class="stat-value">${validacion.tasaBTTS_historica}%</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Partidos Analizados:</span>
                <span class="stat-value">${validacion.partidosSimilares.length}</span>
            </div>
        </div>

        <div class="historical-matches">
            <h5>Partidos Históricos Similares:</h5>
            ${partidosHTML}
        </div>

        <div class="validation-footer">
            <small><i class="fas fa-database"></i> Basado en datos reales de partidos históricos</small>
        </div>
    `;
}

/**
 * Calcula métricas globales de precisión del modelo
 * @returns {Object} - Métricas del modelo
 */
function calcularMetricasModelo() {
    if (partidosReales.length === 0) {
        return {
            precision: 0,
            recall: 0,
            accuracy: 0,
            total_validaciones: 0
        };
    }

    // Simular validación en todo el histórico
    let aciertos = 0;
    let fallos = 0;

    partidosReales.forEach(partido => {
        // Simular predicción basada en estadísticas del partido
        const probabilidadBTTS = calcularProbabilidadBTTS({
            posesion1: partido.posesion_local,
            posesion2: partido.posesion_visitante,
            tiros1: partido.tiros_local,
            tiros2: partido.tiros_visitante,
            efectividad1: partido.efectividad_ofensiva_local,
            efectividad2: partido.efectividad_ofensiva_visitante
        });

        const predicho = probabilidadBTTS > 50;
        const real = partido.btts;

        if (predicho === real) {
            aciertos++;
        } else {
            fallos++;
        }
    });

    const total = aciertos + fallos;
    const precision = total > 0 ? ((aciertos / total) * 100).toFixed(1) : 0;

    return {
        precision: parseFloat(precision),
        aciertos: aciertos,
        fallos: fallos,
        total_validaciones: total,
        accuracy: precision
    };
}

/**
 * Calcula probabilidad BTTS basada en estadísticas
 * (Mismo algoritmo del simulador principal)
 */
function calcularProbabilidadBTTS(stats) {
    let prob = 50;

    // Posesión balanceada → más BTTS
    const difPosesion = Math.abs(stats.posesion1 - stats.posesion2);
    if (difPosesion < 15) prob += 15;
    else if (difPosesion < 25) prob += 8;

    // Tiros altos en ambos → más BTTS
    if (stats.tiros1 > 10 && stats.tiros2 > 10) prob += 20;
    else if (stats.tiros1 > 8 || stats.tiros2 > 8) prob += 10;

    // Efectividad ofensiva
    if (stats.efectividad1 > 0.35 && stats.efectividad2 > 0.35) prob += 15;

    return Math.min(95, Math.max(5, prob));
}

/**
 * Muestra panel de métricas del modelo
 */
function mostrarMetricasModelo() {
    const metricas = calcularMetricasModelo();

    let panelMetricas = document.getElementById('model-metrics-panel');

    if (!panelMetricas) {
        panelMetricas = document.createElement('div');
        panelMetricas.id = 'model-metrics-panel';
        panelMetricas.className = 'model-metrics-panel';

        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(panelMetricas);
        }
    }

    const precisionClass = metricas.precision > 70 ? 'excellent' : metricas.precision > 60 ? 'good' : 'needs-improvement';

    panelMetricas.innerHTML = `
        <div class="metrics-header">
            <h3><i class="fas fa-tachometer-alt"></i> Precisión del Modelo</h3>
            <button class="btn-close-metrics" onclick="document.getElementById('model-metrics-panel').style.display='none'">
                <i class="fas fa-times"></i>
            </button>
        </div>

        <div class="metrics-grid">
            <div class="metric-card ${precisionClass}">
                <div class="metric-icon"><i class="fas fa-bullseye"></i></div>
                <div class="metric-value">${metricas.precision}%</div>
                <div class="metric-label">Precisión Global</div>
            </div>

            <div class="metric-card">
                <div class="metric-icon"><i class="fas fa-check-circle"></i></div>
                <div class="metric-value">${metricas.aciertos}</div>
                <div class="metric-label">Aciertos</div>
            </div>

            <div class="metric-card">
                <div class="metric-icon"><i class="fas fa-times-circle"></i></div>
                <div class="metric-value">${metricas.fallos}</div>
                <div class="metric-label">Fallos</div>
            </div>

            <div class="metric-card">
                <div class="metric-icon"><i class="fas fa-database"></i></div>
                <div class="metric-value">${metricas.total_validaciones}</div>
                <div class="metric-label">Validaciones</div>
            </div>
        </div>

        <div class="metrics-footer">
            <p><i class="fas fa-info-circle"></i> Modelo validado contra ${partidosReales.length} partidos reales</p>
        </div>
    `;

    panelMetricas.style.display = 'block';
}

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    cargarDatosHistoricos();
});

// Exportar funciones
window.validarPrediccion = validarPrediccion;
window.mostrarPanelValidacion = mostrarPanelValidacion;
window.mostrarMetricasModelo = mostrarMetricasModelo;
window.buscarPartidosSimilares = buscarPartidosSimilares;
window.calcularMetricasModelo = calcularMetricasModelo;
