// Constantes para el modelo de Poisson (enfocado en goles esperados)
const LAMBDA_FACTORS = {
    goalsScored: 0.8,
    goalsConceded: -0.6,
    possession: 0.3,
    shotsOnTarget: 0.5,
    passingAccuracy: 0.4,
    fouls: -0.2,
    corners: 0.2,
    yellowCards: -0.15,
    redCards: -0.4
};

// Pesos para el modelo de Regresión Logística (BTTS - Both Teams To Score)
// Ajustados basándose en patrones reales de BTTS en ligas profesionales
// Objetivo: ~40-45% para partidos defensivos, ~60-70% para equipos ofensivos
const LOGISTIC_WEIGHTS = {
    intercept: -0.8,  // Sesgo base ajustado
    goalsScored1: 0.45,  // Capacidad ofensiva equipo 1 (peso aumentado)
    goalsScored2: 0.45,  // Capacidad ofensiva equipo 2 (peso aumentado)
    goalsConceded1: 0.35,  // Debilidad defensiva equipo 1 ayuda a equipo 2
    goalsConceded2: 0.35,  // Debilidad defensiva equipo 2 ayuda a equipo 1
    shotsOnTarget1: 0.08,  // Indicador de eficiencia ofensiva
    shotsOnTarget2: 0.08,
    avgGoalsPerMatch: 0.25,  // Factor importante para BTTS
    offensiveStrength: 0.15   // Ratio ofensiva combinada
};

// Variables globales
let chart = null;
let animationSpeed = 600; // Velocidad de las animaciones en ms
let calculationDelay = 800; // Retraso entre cálculos para la animación
let currentResults = null;
let typingSpeed = 20; // Velocidad de tipeo en ms por caracter
let isSpeedMode = false; // Modo de velocidad x2

// Evento al cargar el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Activar todos los tooltips de Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Referencia al formulario
    const form = document.getElementById('prediction-form');
    const demoButton = document.getElementById('demo-btn');
    const explanationBtn = document.getElementById('explanation-btn');
    const clearButton = document.getElementById('clear-btn');
    const speedToggleBtn = document.getElementById('speed-toggle-btn');

    // Botón x2 para acelerar cálculos
    console.log('Modo velocidad x2 disponible.');

    // Validación de campos numéricos
    document.querySelectorAll('.stats-input').forEach(input => {
        input.addEventListener('input', function() {
            validateInput(input);
        });
    });

    // Cargar datos de demostración
    demoButton.addEventListener('click', loadDemoData);

    // Limpiar formulario
    clearButton.addEventListener('click', clearFormData);

    // Mostrar explicación de IA (solo si existe el botón)
    if (explanationBtn) {
        explanationBtn.addEventListener('click', showAIExplanation);
    }

    // Manejador para el botón de velocidad x2
    if (speedToggleBtn) {
        speedToggleBtn.addEventListener('click', function() {
            isSpeedMode = !isSpeedMode;
            
            if (isSpeedMode) {
                // Activar modo velocidad x2
                speedToggleBtn.classList.add('active');
                speedToggleBtn.innerHTML = '<i class="fas fa-forward"></i> x2 ON';
                
                // Duplicar la velocidad reduciendo los tiempos a la mitad
                animationSpeed = 300; // De 600 a 300
                calculationDelay = 400; // De 800 a 400
                typingSpeed = 10; // De 20 a 10
                
                // Mostrar mensaje en la terminal si está visible
                const terminal = document.getElementById('terminal-content');
                if (terminal && terminal.children.length > 0) {
                    const line = document.createElement('div');
                    line.className = 'line';
                    line.innerHTML = '<span class="highlight">🚀 Modo velocidad x2 activado!</span>';
                    terminal.appendChild(line);
                    terminal.scrollTop = terminal.scrollHeight;
                }
            } else {
                // Desactivar modo velocidad x2
                speedToggleBtn.classList.remove('active');
                speedToggleBtn.innerHTML = '<i class="fas fa-forward"></i> x2';

                // Restaurar velocidades originales
                animationSpeed = 600;
                calculationDelay = 800;
                typingSpeed = 20;

                // Mostrar mensaje en la terminal si está visible
                const terminal = document.getElementById('terminal-content');
                if (terminal && terminal.children.length > 0) {
                    const line = document.createElement('div');
                    line.className = 'line';
                    line.innerHTML = '<span class="info">🐢 Velocidad normal restaurada.</span>';
                    terminal.appendChild(line);
                    terminal.scrollTop = terminal.scrollHeight;
                }
            }
        });
    }

    // Envío del formulario
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validar todos los campos antes de proceder
        let isValid = true;
        document.querySelectorAll('.stats-input').forEach(input => {
            if (!validateInput(input)) {
                isValid = false;
            }
        });
        
        if (isValid) {
            calculatePrediction();
        }
    });
});

// Función para validar los campos de entrada
function validateInput(input) {
    const value = input.value.trim();
    
    // Validar que sea un número
    if (isNaN(value) || value === '') {
        input.classList.add('is-invalid');
        return false;
    }
    
    // Para porcentajes, validar que estén entre 0 y 100
    if ((input.id.includes('possession') || input.id.includes('passingAccuracy')) && 
        (parseFloat(value) < 0 || parseFloat(value) > 100)) {
        input.classList.add('is-invalid');
        return false;
    }
    
    // Para el resto de campos, validar que sean mayores o iguales a 0
    if (parseFloat(value) < 0) {
        input.classList.add('is-invalid');
        return false;
    }
    
    input.classList.remove('is-invalid');
    return true;
}

// Función para cargar datos de demostración
function loadDemoData() {
    // Datos del Barcelona
    document.getElementById('team1').value = 'FC Barcelona';
    document.getElementById('goalsScored1').value = '2.6';
    document.getElementById('goalsConceded1').value = '0.9';
    document.getElementById('possession1').value = '65.4';
    document.getElementById('shotsOnTarget1').value = '7.2';
    document.getElementById('passingAccuracy1').value = '89.3';
    document.getElementById('fouls1').value = '10.8';
    document.getElementById('corners1').value = '6.5';
    document.getElementById('yellowCards1').value = '1.8';
    document.getElementById('redCards1').value = '0.1';
    
    // Datos del Real Madrid
    document.getElementById('team2').value = 'Real Madrid';
    document.getElementById('goalsScored2').value = '2.4';
    document.getElementById('goalsConceded2').value = '1.1';
    document.getElementById('possession2').value = '58.7';
    document.getElementById('shotsOnTarget2').value = '6.8';
    document.getElementById('passingAccuracy2').value = '86.5';
    document.getElementById('fouls2').value = '12.3';
    document.getElementById('corners2').value = '5.9';
    document.getElementById('yellowCards2').value = '2.1';
    document.getElementById('redCards2').value = '0.2';
}

// Función para limpiar datos del formulario
function clearFormData() {
    // Limpiar campos del equipo local
    document.getElementById('team1').value = '';
    document.getElementById('goalsScored1').value = '';
    document.getElementById('goalsConceded1').value = '';
    document.getElementById('possession1').value = '';
    document.getElementById('shotsOnTarget1').value = '';
    document.getElementById('passingAccuracy1').value = '';
    document.getElementById('fouls1').value = '';
    document.getElementById('corners1').value = '';
    document.getElementById('yellowCards1').value = '';
    document.getElementById('redCards1').value = '';
    
    // Limpiar campos del equipo visitante
    document.getElementById('team2').value = '';
    document.getElementById('goalsScored2').value = '';
    document.getElementById('goalsConceded2').value = '';
    document.getElementById('possession2').value = '';
    document.getElementById('shotsOnTarget2').value = '';
    document.getElementById('passingAccuracy2').value = '';
    document.getElementById('fouls2').value = '';
    document.getElementById('corners2').value = '';
    document.getElementById('yellowCards2').value = '';
    document.getElementById('redCards2').value = '';
    
    // Eliminar clases de invalidación si existen
    document.querySelectorAll('.stats-input').forEach(input => {
        input.classList.remove('is-invalid');
    });
    
    // Ocultar sección de resultados si está visible
    document.getElementById('results-section').style.display = 'none';
    
    // Eliminar gráfico si existe
    if (chart) {
        chart.destroy();
        chart = null;
    }
    
    // Reiniciar resultados actuales
    currentResults = null;

    // Limpiar la terminal completamente
    const terminal = document.getElementById('terminal-content');
    if (terminal) {
        terminal.innerHTML = '<div class="line">$ Todos los campos han sido limpiados.</div>';
    }

    // Limpiar el panel What-If si existe
    const whatIfContainer = document.getElementById('what-if-container');
    if (whatIfContainer) {
        whatIfContainer.innerHTML = '';
    }
}

// Función para calcular la distribución de Poisson
function poissonProbability(lambda, k) {
    // P(X = k) = (e^-lambda * lambda^k) / k!
    return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k);
}

// Función factorial para cálculos de Poisson
function factorial(n) {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

// Función sigmoide para regresión logística
function sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
}

// Función para calcular BTTS usando Regresión Logística
async function calculateLogisticBTTS(terminal, team1, team2, stats1, stats2) {
    await typeTerminalText(terminal, `\n$ Extrayendo características para el modelo logístico...`);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Normalizar características (escala 0-1 aproximadamente)
    // Valores típicos en fútbol profesional para referencia:
    // - Goles anotados: 0.5 - 3.0 por partido
    // - Goles recibidos: 0.5 - 2.5 por partido
    // - Tiros a puerta: 3 - 10 por partido

    const goalsScored1_norm = Math.min(stats1.goalsScored / 3.0, 1.5);  // Normalizar por 3 goles (alto)
    const goalsScored2_norm = Math.min(stats2.goalsScored / 3.0, 1.5);
    const goalsConceded1_norm = Math.min(stats2.goalsConceded / 2.5, 1.5); // Si rival concede mucho, equipo 1 marca
    const goalsConceded2_norm = Math.min(stats1.goalsConceded / 2.5, 1.5); // Si rival concede mucho, equipo 2 marca
    const shotsOnTarget1_norm = Math.min(stats1.shotsOnTarget / 8.0, 1.5);
    const shotsOnTarget2_norm = Math.min(stats2.shotsOnTarget / 8.0, 1.5);

    const avgGoalsPerMatch = (stats1.goalsScored + stats2.goalsScored) / 2;
    const avgGoalsNorm = Math.min(avgGoalsPerMatch / 2.5, 1.5); // Normalizado

    const offensiveStrength = (stats1.goalsScored + stats2.goalsScored) / (stats1.goalsConceded + stats2.goalsConceded + 0.5);
    const offStrengthNorm = Math.min(offensiveStrength / 2.0, 1.5); // Normalizado

    await typeTerminalText(terminal, `<span class="info">Goles promedio por partido:</span> ${avgGoalsPerMatch.toFixed(2)}`);
    await typeTerminalText(terminal, `<span class="info">Fuerza ofensiva combinada:</span> ${offensiveStrength.toFixed(2)}`);

    // Calcular z (combinación lineal de features normalizadas)
    let z = LOGISTIC_WEIGHTS.intercept;
    z += LOGISTIC_WEIGHTS.goalsScored1 * goalsScored1_norm;
    z += LOGISTIC_WEIGHTS.goalsScored2 * goalsScored2_norm;
    z += LOGISTIC_WEIGHTS.goalsConceded1 * goalsConceded1_norm;
    z += LOGISTIC_WEIGHTS.goalsConceded2 * goalsConceded2_norm;
    z += LOGISTIC_WEIGHTS.shotsOnTarget1 * shotsOnTarget1_norm;
    z += LOGISTIC_WEIGHTS.shotsOnTarget2 * shotsOnTarget2_norm;
    z += LOGISTIC_WEIGHTS.avgGoalsPerMatch * avgGoalsNorm;
    z += LOGISTIC_WEIGHTS.offensiveStrength * offStrengthNorm;

    await typeTerminalText(terminal, `<span class="info">Valor z (combinación lineal):</span> ${z.toFixed(3)}`);

    // Aplicar función sigmoide para obtener probabilidad
    const probability = sigmoid(z) * 100;

    await typeTerminalText(terminal, `<span class="result">Aplicando función sigmoide: σ(z) = 1/(1+e^-z)</span>`);

    return probability;
}

// Función para calcular la predicción usando Poisson
async function calculatePrediction() {
    
    // Mostrar sección de resultados
    document.getElementById('results-section').style.display = 'block';
    
    // Scroll a la sección de resultados
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
    
    // Limpiar terminal
    const terminal = document.getElementById('terminal-content');
    terminal.innerHTML = '';
    
    // Ocultar resultados anteriores si existen
    const predictionResults = document.getElementById('prediction-results');
    predictionResults.classList.remove('show');
    
    // Recolectar datos del formulario
    const team1 = document.getElementById('team1').value;
    const team2 = document.getElementById('team2').value;
    
    // Obtener todas las estadísticas para cada equipo
    const stats1 = {};
    const stats2 = {};
    
    for (const stat in LAMBDA_FACTORS) {
        stats1[stat] = parseFloat(document.getElementById(stat + '1').value);
        stats2[stat] = parseFloat(document.getElementById(stat + '2').value);
    }
    
    // Iniciar animación de cálculo en la terminal
    await typeTerminalText(terminal, `$ Iniciando cálculo de predicción con modelo de Poisson Bivariado...`);
    if (isSpeedMode) {
        await typeTerminalText(terminal, `$ <span class="highlight">⚡ Modo velocidad x2 activo...</span>`);
    } else {
        await typeTerminalText(terminal, `$ <span class="info">💡 Activa el modo x2 para acelerar el análisis.</span>`);
    }
    await typeTerminalText(terminal, `$ Analizando estadísticas para ${team1} y ${team2}...`);
    await new Promise(resolve => setTimeout(resolve, calculationDelay));
    
    // Calcular lambdas para cada equipo (tasa media de goles esperados)
    const [lambda1, detailedCalc1] = await calculateLambda(terminal, team1, stats1, stats2);
    const [lambda2, detailedCalc2] = await calculateLambda(terminal, team2, stats2, stats1);
    
    // ==========================================
    // MODELO 1: POISSON BIVARIADO PARA BTTS
    // ==========================================
    await typeTerminalText(terminal, '\n$ ========================================');
    await typeTerminalText(terminal, '$ MODELO 1: POISSON BIVARIADO');
    await typeTerminalText(terminal, '$ Calculando probabilidad de "Ambos Marcan"...');
    await typeTerminalText(terminal, '$ ========================================');
    await new Promise(resolve => setTimeout(resolve, calculationDelay));

    // Calcular P(Equipo1 >= 1 gol) = 1 - P(Equipo1 = 0 goles)
    const probTeam1Scores = 1 - poissonProbability(lambda1, 0);
    const probTeam2Scores = 1 - poissonProbability(lambda2, 0);

    await typeTerminalText(terminal, `\n<span class="info">P(${team1} anota ≥ 1 gol):</span> <span class="result">${(probTeam1Scores * 100).toFixed(2)}%</span>`);
    await typeTerminalText(terminal, `<span class="info">P(${team2} anota ≥ 1 gol):</span> <span class="result">${(probTeam2Scores * 100).toFixed(2)}%</span>`);

    // Calcular parámetro de correlación rho basado en estadísticas defensivas
    // rho representa la correlación entre los goles de ambos equipos
    // Valores típicos: 0.05 a 0.15 en partidos profesionales
    const avgDefensiveVulnerability = (stats1.goalsConceded + stats2.goalsConceded) / 2;
    const rho = Math.min(0.05 + (avgDefensiveVulnerability / 50), 0.20); // Entre 0.05 y 0.20

    await typeTerminalText(terminal, `<span class="info">Parámetro de correlación (ρ):</span> <span class="result">${rho.toFixed(3)}</span>`);

    // Calcular P(X=0, Y=0) con correlación usando Poisson Bivariado
    // P(X=0, Y=0) = exp(-lambda1 - lambda2 - rho)
    const probBothZero = Math.exp(-lambda1 - lambda2 - rho);

    // Calcular P(X=0) y P(Y=0)
    const probTeam1Zero = poissonProbability(lambda1, 0);
    const probTeam2Zero = poissonProbability(lambda2, 0);

    // P(Ambos marcan) = 1 - P(X=0) - P(Y=0) + P(X=0, Y=0)
    // Esta es la fórmula correcta del Poisson Bivariado
    const bttsPoisson = (1 - probTeam1Zero - probTeam2Zero + probBothZero) * 100;
    const noBttsPoisson = 100 - bttsPoisson;

    await typeTerminalText(terminal, `<span class="info">P(ambos = 0 goles con correlación):</span> <span class="result">${(probBothZero * 100).toFixed(2)}%</span>`);
    await typeTerminalText(terminal, `\n<span class="highlight">P(Ambos Marcan) - Poisson Bivariado:</span> <span class="result">${bttsPoisson.toFixed(2)}%</span>`);
    await typeTerminalText(terminal, `<span class="info">P(NO Ambos Marcan):</span> <span class="result">${noBttsPoisson.toFixed(2)}%</span>`);

    // ==========================================
    // MODELO 2: REGRESIÓN LOGÍSTICA PARA BTTS
    // ==========================================
    await typeTerminalText(terminal, '\n$ ========================================');
    await typeTerminalText(terminal, '$ MODELO 2: REGRESIÓN LOGÍSTICA');
    await typeTerminalText(terminal, '$ Calculando probabilidad de "Ambos Marcan"...');
    await typeTerminalText(terminal, '$ ========================================');
    await new Promise(resolve => setTimeout(resolve, calculationDelay));

    const bttsLogistic = await calculateLogisticBTTS(terminal, team1, team2, stats1, stats2);
    const noBttsLogistic = 100 - bttsLogistic;

    await typeTerminalText(terminal, `\n<span class="highlight">P(Ambos Marcan) - Regresión Logística:</span> <span class="result">${bttsLogistic.toFixed(2)}%</span>`);
    await typeTerminalText(terminal, `<span class="info">P(NO Ambos Marcan):</span> <span class="result">${noBttsLogistic.toFixed(2)}%</span>`);

    // ==========================================
    // COMPARACIÓN Y RESULTADO FINAL
    // ==========================================
    await typeTerminalText(terminal, '\n$ ========================================');
    await typeTerminalText(terminal, '$ COMPARACIÓN DE MODELOS');
    await typeTerminalText(terminal, '$ ========================================');
    await new Promise(resolve => setTimeout(resolve, calculationDelay));

    // Calcular promedio ponderado o seleccionar modelo más confiable
    const avgBTTS = (bttsPoisson + bttsLogistic) / 2;
    const diffModels = Math.abs(bttsPoisson - bttsLogistic);

    let recommendedModel = "";
    let finalBTTSProb = avgBTTS;
    let confidence = "Media";

    if (diffModels < 10) {
        recommendedModel = "Consenso (ambos modelos)";
        confidence = "Alta";
        finalBTTSProb = avgBTTS;
    } else if (bttsPoisson > bttsLogistic) {
        recommendedModel = "Poisson Bivariado";
        confidence = "Media";
        finalBTTSProb = bttsPoisson;
    } else {
        recommendedModel = "Regresión Logística";
        confidence = "Media";
        finalBTTSProb = bttsLogistic;
    }

    await typeTerminalText(terminal, `<span class="info">Diferencia entre modelos:</span> <span class="result">${diffModels.toFixed(2)}%</span>`);
    await typeTerminalText(terminal, `<span class="info">Modelo recomendado:</span> <span class="highlight">${recommendedModel}</span>`);
    await typeTerminalText(terminal, `<span class="info">Nivel de confianza:</span> <span class="highlight">${confidence}</span>`);
    await typeTerminalText(terminal, `\n$ <span class="highlight">PREDICCIÓN FINAL: ${finalBTTSProb.toFixed(2)}% de probabilidad de que AMBOS EQUIPOS MARQUEN</span>`);
    
    // Obtener URLs de los logos desde el caché
    const team1Logo = document.getElementById('team1-logo').src || null;
    const team2Logo = document.getElementById('team2-logo').src || null;

    // Guardar resultados para la API
    currentResults = {
        team1: {
            name: team1,
            stats: stats1,
            lambda: lambda1,
            probScores: (probTeam1Scores * 100).toFixed(2),
            detailedCalculation: detailedCalc1,
            logo: team1Logo
        },
        team2: {
            name: team2,
            stats: stats2,
            lambda: lambda2,
            probScores: (probTeam2Scores * 100).toFixed(2),
            detailedCalculation: detailedCalc2,
            logo: team2Logo
        },
        btts: {
            poisson: bttsPoisson.toFixed(2),
            logistic: bttsLogistic.toFixed(2),
            final: finalBTTSProb.toFixed(2),
            recommendedModel: recommendedModel,
            confidence: confidence,
            diffModels: diffModels.toFixed(2)
        }
    };

    // Mostrar resultados en la interfaz
    document.getElementById('win-probability').textContent = `${finalBTTSProb.toFixed(2)}%`;
    document.getElementById('recommended-model').textContent = `Modelo recomendado: ${recommendedModel} (Confianza: ${confidence})`;

    // Actualizar desglose de modelos (con verificación de existencia)
    const poissonResultElem = document.getElementById('poisson-result');
    const logisticResultElem = document.getElementById('logistic-result');

    if (poissonResultElem) poissonResultElem.textContent = `${bttsPoisson.toFixed(2)}%`;
    if (logisticResultElem) logisticResultElem.textContent = `${bttsLogistic.toFixed(2)}%`;

    // Animar barras de progreso
    setTimeout(() => {
        const poissonBar = document.getElementById('poisson-bar');
        const logisticBar = document.getElementById('logistic-bar');

        console.log('📊 Actualizando barras:', {
            poisson: bttsPoisson,
            logistic: bttsLogistic
        });

        if (poissonBar) {
            poissonBar.style.width = `${bttsPoisson}%`;
            poissonBar.textContent = `${bttsPoisson.toFixed(2)}%`;
            console.log('✅ Barra Poisson actualizada a:', bttsPoisson + '%');
        } else {
            console.error('❌ No se encontró elemento poisson-bar');
        }

        if (logisticBar) {
            logisticBar.style.width = `${bttsLogistic}%`;
            logisticBar.textContent = `${bttsLogistic.toFixed(2)}%`;
            console.log('✅ Barra Logistic actualizada a:', bttsLogistic + '%');
        } else {
            console.error('❌ No se encontró elemento logistic-bar');
        }
    }, 300);

    // Nota informativa según diferencia de modelos (mejorada)
    let noteText = "";
    let noteClass = "";

    if (diffModels < 5) {
        noteText = "✅ Ambos modelos coinciden. Alta confianza en la predicción.";
        noteClass = "text-success";
    } else if (diffModels < 15) {
        noteText = `⚠️ Diferencia moderada de ${diffModels.toFixed(1)}%. Confianza media - considera otros factores.`;
        noteClass = "text-warning";
    } else {
        noteText = `❌ Diferencia alta de ${diffModels.toFixed(1)}%. Los modelos no concuerdan - analiza con precaución.`;
        noteClass = "text-danger";
    }

    const modelNoteElem = document.getElementById('model-note');
    if (modelNoteElem) {
        modelNoteElem.textContent = noteText;
        modelNoteElem.className = noteClass + ' mt-2';
    }

    // Crear gráfico de comparación con animación
    createComparisonChart(team1, team2, stats1, stats2);
    
    // Mostrar sección de resultados con animación
    await new Promise(resolve => setTimeout(resolve, 500));
    predictionResults.classList.add('show');

    // Mostrar botón de guardar si existe
    const saveBtn = document.getElementById('save-prediction-btn');
    if (saveBtn) {
        saveBtn.style.display = 'inline-block';
    }

    // Inicializar panel "¿Qué pasaría si...?"
    if (typeof initWhatIfPanel === 'function') {
        initWhatIfPanel({
            team1Name: team1,
            team2Name: team2,
            goalsScored1: stats1.goalsScored,
            goalsConceded1: stats1.goalsConceded,
            shotsOnTarget1: stats1.shotsOnTarget,
            effectiveness1: stats1.passingAccuracy / 100, // Convertir a decimal
            possession1: stats1.possession,
            goalsScored2: stats2.goalsScored,
            goalsConceded2: stats2.goalsConceded,
            shotsOnTarget2: stats2.shotsOnTarget,
            effectiveness2: stats2.passingAccuracy / 100, // Convertir a decimal
            possession2: stats2.possession,
            bttsProb: finalBTTSProb
        });
    }

    // Mensaje final
    if (isSpeedMode) {
        await typeTerminalText(terminal, `$ <span class="highlight">✅ Cálculo completado en modo x2!</span>`);
    } else {
        await typeTerminalText(terminal, `$ <span class="info">✅ Cálculo completado.</span>`);
    }
}

// Función para calcular la lambda (tasa de goles esperados) para un equipo
async function calculateLambda(terminal, teamName, teamStats, opponentStats) {
    await typeTerminalText(terminal, `\n$ Calculando lambda (tasa de goles esperados) para <span class="highlight">${teamName}</span>...`);
    
    let lambda = 0;
    let detailedCalculation = [];
    
    // Base lambda - promedio de goles históricos del equipo
    const baseLambda = teamStats.goalsScored;
    lambda = baseLambda;
    detailedCalculation.push({stat: "Base (promedio goles)", value: baseLambda.toFixed(2), effect: baseLambda.toFixed(2)});
    
    await typeTerminalText(terminal, `<span class="highlight">Base lambda (promedio de goles):</span> ${baseLambda.toFixed(2)}`);
    
    // Ajustar lambda con las estadísticas del equipo y del oponente
    for (const [stat, factor] of Object.entries(LAMBDA_FACTORS)) {
        if (stat === 'goalsScored') continue; // Ya considerado en la base
        
        let adjustment = 0;
        let statValue = teamStats[stat];
        
        // Para estadísticas relativas, considerar la diferencia con el oponente
        if (stat === 'possession' || stat === 'passingAccuracy') {
            const diff = (teamStats[stat] - opponentStats[stat]) / 100;
            adjustment = diff * factor;
        } 
        // Para goles concedidos, usar los del oponente
        else if (stat === 'goalsConceded') {
            const diff = (opponentStats.goalsScored - teamStats.goalsConceded) / 2;
            adjustment = diff * factor;
            statValue = `${teamStats[stat]} vs ${opponentStats.goalsScored}`;
        }
        // Para el resto de estadísticas
        else {
            adjustment = (teamStats[stat] / 10) * factor;
        }
        
        lambda += adjustment;
        
        let color = "info";
        let icon = "📊";
        if (adjustment > 0) {
            color = "highlight";
            icon = "✅";
        }
        if (adjustment < 0) {
            color = "warning";
            icon = "⚠️";
        }

        detailedCalculation.push({stat, value: statValue, factor, adjustment: adjustment.toFixed(3)});

        // Texto con icono y barra de progreso visual
        const adjustmentText = adjustment >= 0 ? `+${adjustment.toFixed(3)}` : adjustment.toFixed(3);
        const barWidth = Math.min(Math.abs(adjustment) * 20, 100);
        const barColor = adjustment > 0 ? '#00ff88' : '#ff6b6b';

        await typeTerminalText(terminal, `<span class="${color}">${icon} ${stat}:</span> ${statValue} → ajuste: <span class="number-animated" style="color: ${barColor}; font-weight: bold;">${adjustmentText}</span>`);

        // Agregar mini barra de progreso visual después del texto
        const progressBar = document.createElement('div');
        progressBar.className = 'calculation-progress-bar';
        progressBar.innerHTML = `<div class="progress-fill" style="width: 0%; background: ${barColor};"></div>`;
        terminal.lastChild.appendChild(progressBar);

        // Animar la barra
        setTimeout(() => {
            progressBar.querySelector('.progress-fill').style.width = barWidth + '%';
        }, 50);

        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Asegurar que lambda sea positiva
    lambda = Math.max(0.1, lambda);
    
    await typeTerminalText(terminal, `<span class="result">Lambda final para ${teamName}: ${lambda.toFixed(3)}</span>`);
    await typeTerminalText(terminal, `<span class="info">Interpretación:</span> Se espera que ${teamName} anote en promedio ${lambda.toFixed(2)} goles`);
    
    return [lambda, detailedCalculation];
}

// ==========================================
// SISTEMA DE EFECTOS DRAMÁTICOS Y DINÁMICOS
// ==========================================

function createParticleExplosion(container, x, y, color) {
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'epic-particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.background = color;

        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = 80 + Math.random() * 80;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;

        particle.style.setProperty('--vx', vx + 'px');
        particle.style.setProperty('--vy', vy + 'px');

        container.appendChild(particle);
        setTimeout(() => particle.remove(), 1200);
    }
}

function createShockwave(container, color) {
    const wave = document.createElement('div');
    wave.className = 'shockwave-effect';
    wave.style.borderColor = color;
    wave.style.boxShadow = `0 0 20px ${color}, inset 0 0 20px ${color}`;
    container.appendChild(wave);
    setTimeout(() => wave.remove(), 1000);
}

function createNumberClash(container, value1, value2, result) {
    const clash = document.createElement('div');
    clash.className = 'number-clash';
    clash.innerHTML = `
        <span class="clash-number left">${value1}</span>
        <span class="clash-impact">⚡</span>
        <span class="clash-number right">${value2}</span>
        <span class="clash-result">${result}</span>
    `;
    container.appendChild(clash);
    setTimeout(() => clash.remove(), 2000);
}

// Nueva función para escribir texto con EFECTOS DRAMÁTICOS ÉPICOS
async function typeTerminalText(terminal, text) {
    const line = document.createElement('div');
    line.className = 'line terminal-line-epic';
    line.style.position = 'relative';

    // Determinar si es un cálculo importante
    const isImportant = text.includes('Lambda final') || text.includes('P(Ambos Marcan)') || text.includes('PREDICCIÓN FINAL') || text.includes('====');
    const isCalculation = text.includes('ajuste:') || text.includes('→');
    const isHeader = text.includes('MODELO') || text.includes('====');

    // ENTRADA DRAMÁTICA SEGÚN TIPO
    if (isImportant) {
        // ENTRADA ÉPICA PARA RESULTADOS IMPORTANTES
        line.style.opacity = '0';
        line.style.transform = 'translateY(-50px) scale(1.5) rotateZ(10deg)';
        line.style.filter = 'blur(10px)';
        terminal.appendChild(line);

        // Explosión de partículas
        setTimeout(() => {
            const rect = line.getBoundingClientRect();
            const terminalRect = terminal.getBoundingClientRect();
            createParticleExplosion(terminal, rect.left - terminalRect.left + rect.width/2, rect.top - terminalRect.top, '#00ff88');
            createShockwave(terminal, '#00ff88');
        }, 100);

        setTimeout(() => {
            line.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            line.style.opacity = '1';
            line.style.transform = 'translateY(0) scale(1) rotateZ(0)';
            line.style.filter = 'blur(0)';
            line.style.textShadow = '0 0 20px #00ff88, 0 0 40px #00ff88, 0 0 60px #00ff88';
        }, 50);

    } else if (isHeader) {
        // ENTRADA PODEROSA PARA HEADERS
        line.style.opacity = '0';
        line.style.transform = 'translateX(-100%) rotateY(90deg)';
        terminal.appendChild(line);

        setTimeout(() => {
            line.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            line.style.opacity = '1';
            line.style.transform = 'translateX(0) rotateY(0)';
            createShockwave(terminal, '#00d4ff');
        }, 30);

    } else if (isCalculation) {
        // ENTRADA DINÁMICA PARA CÁLCULOS
        line.style.opacity = '0';
        line.style.transform = 'translateY(-30px) scale(0.5)';
        terminal.appendChild(line);

        setTimeout(() => {
            line.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            line.style.opacity = '1';
            line.style.transform = 'translateY(0) scale(1)';

            // Mini explosión para cálculos
            if (Math.random() > 0.5) {
                const rect = line.getBoundingClientRect();
                const terminalRect = terminal.getBoundingClientRect();
                const color = text.includes('+') ? '#00ff88' : '#ff6b6b';
                createParticleExplosion(terminal, rect.left - terminalRect.left, rect.top - terminalRect.top, color);
            }
        }, 20);

    } else {
        // ENTRADA NORMAL PERO CON ESTILO
        line.style.opacity = '0';
        line.style.transform = 'translateX(-20px) rotateX(45deg)';
        terminal.appendChild(line);

        setTimeout(() => {
            line.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            line.style.opacity = '1';
            line.style.transform = 'translateX(0) rotateX(0)';
        }, 10);
    }
    
    // Separar el texto en HTML y texto plano
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    
    if (text.includes('<span')) {
        // Si hay HTML, necesitamos preservar las etiquetas
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const content = doc.body.firstChild;
        
        // Identificar qué partes son HTML y cuáles son texto
        const walkAndType = async (node, parentElement) => {
            if (node.nodeType === Node.TEXT_NODE) {
                // Si es un nodo de texto, escribir caracter por caracter
                for (let i = 0; i < node.textContent.length; i++) {
                    parentElement.textContent += node.textContent[i];
                    await new Promise(resolve => setTimeout(resolve, typingSpeed));
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Si es un elemento, crear el elemento y procesar sus hijos
                const newElement = document.createElement(node.tagName);
                // Copiar todos los atributos
                for (let attr of node.attributes) {
                    newElement.setAttribute(attr.name, attr.value);
                }
                parentElement.appendChild(newElement);
                
                // Procesar hijos recursivamente
                for (let child of node.childNodes) {
                    await walkAndType(child, newElement);
                }
            }
        };
        
        // Comenzar a escribir desde los nodos del cuerpo
        for (let child of doc.body.childNodes) {
            await walkAndType(child, line);
        }
    } else {
        // Si es solo texto, escribir caracter por caracter
        for (let i = 0; i < text.length; i++) {
            line.textContent += text[i];
            await new Promise(resolve => setTimeout(resolve, typingSpeed));
        }
    }

    // Marcar línea como completa para quitar el cursor parpadeante
    line.classList.add('complete');

    // Scroll al final del terminal
    terminal.scrollTop = terminal.scrollHeight;
}

// Función para crear el gráfico de comparación con animación
function createComparisonChart(team1, team2, stats1, stats2) {
    // Destruir gráfico anterior si existe
    if (chart) {
        chart.destroy();
    }
    
    const ctx = document.getElementById('stats-chart').getContext('2d');
    
    // Preparar datos para la gráfica
    const labels = [
        'Goles anotados', 
        'Goles recibidos', 
        'Posesión', 
        'Tiros a puerta', 
        'Precisión pases'
    ];
    
    const data1 = [
        stats1.goalsScored,
        stats1.goalsConceded,
        stats1.possession,
        stats1.shotsOnTarget,
        stats1.passingAccuracy
    ];
    
    const data2 = [
        stats2.goalsScored,
        stats2.goalsConceded,
        stats2.possession,
        stats2.shotsOnTarget,
        stats2.passingAccuracy
    ];
    
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: team1,
                    data: data1,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: team2,
                    data: data2,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            animation: {
                duration: 1500, // Duración más larga para la animación
                easing: 'easeOutQuart' // Tipo de animación más suave
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#fff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#fff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#fff'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(2);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Función para mostrar la explicación de IA con efecto de tipeo
async function showAIExplanation() {
    if (!currentResults) {
        alert("Primero debes realizar una predicción antes de solicitar un análisis");
        return;
    }

    const explanationBtn = document.getElementById('explanation-btn');
    explanationBtn.disabled = true;

    const explanationModal = new bootstrap.Modal(document.getElementById('explanation-modal'));
    explanationModal.show();

    const loadingIndicator = document.getElementById('ai-loading');
    const explanationDiv = document.getElementById('ai-explanation');
    loadingIndicator.style.display = 'inline-block';
    explanationDiv.innerHTML = '<p class="text-info">Solicitando análisis, por favor espera...</p>';

    try {
        // Preparar datos BTTS para enviar al servidor
        const team1 = currentResults.team1.name;
        const team2 = currentResults.team2.name;

        const requestData = {
            team1: currentResults.team1,
            team2: currentResults.team2,
            btts: currentResults.btts,
            predictionType: "BTTS"  // Indicar que es predicción de Ambos Marcan
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutos

        const response = await fetch('/get_explanation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Error del servidor (${response.status}): Por favor, intenta nuevamente`);
        }

        const data = await response.json();

        if (!data.explanation && !data.error) {
            throw new Error('Formato de respuesta inesperado del servidor');
        }

        if (data.error) {
            throw new Error(data.error);
        }

        loadingIndicator.style.display = 'none';

        // Mostrar la explicación HTML directamente (la IA devuelve HTML formateado)
        explanationDiv.innerHTML = data.explanation;

        // Aplicar estilos mejorados para mejor visualización
        explanationDiv.style.lineHeight = '1.7';
        explanationDiv.style.fontSize = '1.05rem';
        explanationDiv.style.padding = '25px';
        explanationDiv.style.background = 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)';
        explanationDiv.style.borderRadius = '12px';
        explanationDiv.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.5)';

        // Scroll al inicio con animación suave
        explanationDiv.scrollTo({top: 0, behavior: 'smooth'});

    } catch (error) {
        loadingIndicator.style.display = 'none';

        let errorMessage = error.message || 'Se produjo un error inesperado';

        // Mensaje específico para timeout
        if (error.name === 'AbortError') {
            errorMessage = 'La solicitud tardó demasiado tiempo. Los modelos gratuitos de IA están muy ocupados. Por favor, intenta nuevamente en unos momentos.';
        }

        explanationDiv.innerHTML = `
            <div class="alert alert-danger">
                <strong>Error al cargar la explicación</strong>
                <p>${errorMessage}</p>
            </div>`;
    } finally {
        explanationBtn.disabled = false;
    }
}


// Función para simular el partido con estadísticas
async function simularPartido() {
    if (!currentResults) {
        alert("Primero debes realizar una predicción antes de simular un partido");
        return;
    }
    
    // Crear el HTML del modal si no existe
    if (!document.getElementById('simulacion-modal')) {
        const modalHTML = `
        <div class="modal fade" id="simulacion-modal" tabindex="-1" aria-labelledby="simulacionModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content bg-dark text-white">
                    <div class="modal-header border-0">
                        <h5 class="modal-title" id="simulacionModalLabel">
                            <i class="fas fa-futbol me-2"></i>Simulación de Partido
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-0">
                        <div id="simulacion-carga" class="sim-loading-container">
                            <div class="sim-loading-content">
                                <div class="sim-loading-animation">
                                    <div class="football-field">
                                        <div class="field-line"></div>
                                        <div class="center-circle"></div>
                                        <div class="football-ball">⚽</div>
                                    </div>
                                </div>
                                <h3 class="sim-loading-title">Simulando Partido en Vivo</h3>
                                <div class="sim-progress-wrapper">
                                    <div class="sim-progress-bar">
                                        <div id="barra-progreso" class="sim-progress-fill"></div>
                                    </div>
                                    <div class="sim-progress-text">
                                        <span id="progress-percentage">0%</span>
                                    </div>
                                </div>
                                <div class="sim-loading-status">
                                    <span id="texto-carga">Preparando simulación...</span>
                                </div>
                                <div class="sim-loading-stats">
                                    <div class="loading-stat">
                                        <i class="fas fa-tactics"></i>
                                        <span>Analizando tácticas</span>
                                    </div>
                                    <div class="loading-stat">
                                        <i class="fas fa-running"></i>
                                        <span>Calculando momentum</span>
                                    </div>
                                    <div class="loading-stat">
                                        <i class="fas fa-chart-line"></i>
                                        <span>Generando eventos</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div id="simulacion-resultado" style="display:none;">
                            <!-- Cabecera del partido mejorada -->
                            <div class="sim-result-header">
                                <div class="sim-match-info">
                                    <div class="match-badge">
                                        <i class="fas fa-calendar-day"></i>
                                        <span>Partido simulado Hoy</span>
                                    </div>
                                    <div class="match-status">
                                        <span class="status-badge">
                                            <i class="fas fa-check-circle"></i>
                                            FINALIZADO
                                        </span>
                                        <span class="match-time">90'</span>
                                    </div>
                                </div>
                                <div class="sim-scoreboard">
                                    <div class="team-section team-home">
                                        <img id="sim-logo-local" class="team-logo-sim" src="" alt="">
                                        <h3 id="equipo-local" class="team-name-sim"></h3>
                                    </div>
                                    <div class="score-section">
                                        <div class="final-score">
                                            <span id="goles-local" class="score-home"></span>
                                            <span class="score-separator">-</span>
                                            <span id="goles-visitante" class="score-away"></span>
                                        </div>
                                        <div class="score-label">RESULTADO FINAL</div>
                                    </div>
                                    <div class="team-section team-away">
                                        <img id="sim-logo-visitante" class="team-logo-sim" src="" alt="">
                                        <h3 id="equipo-visitante" class="team-name-sim"></h3>
                                    </div>
                                </div>
                            </div>

                            <!-- Contenedor principal mejorado -->
                            <div class="sim-content-grid">
                                <!-- Estadísticas equipo local -->
                                <div class="sim-stats-panel stats-home">
                                    <div class="stats-header">
                                        <i class="fas fa-chart-bar"></i>
                                        <h6>Estadísticas Local</h6>
                                    </div>
                                    <div id="stats-local" class="stats-content">
                                        <!-- Se llenará dinámicamente -->
                                    </div>
                                </div>

                                <!-- Línea de tiempo -->
                                <div class="sim-timeline-panel">
                                    <div class="timeline-header">
                                        <i class="fas fa-list-ul"></i>
                                        <h6>Momentos Clave</h6>
                                    </div>
                                    <div id="momentos-partido" class="timeline-content">
                                        <!-- Los momentos se llenarán dinámicamente -->
                                    </div>
                                </div>

                                <!-- Estadísticas equipo visitante -->
                                <div class="sim-stats-panel stats-away">
                                    <div class="stats-header">
                                        <i class="fas fa-chart-bar"></i>
                                        <h6>Estadísticas Visitante</h6>
                                    </div>
                                    <div id="stats-visitante" class="stats-content">
                                        <!-- Se llenará dinámicamente -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer border-0">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">CERRAR</button>
                        
                    </div>
                </div>
            </div>
        </div>`;
        
        // Agregar el modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Agregar estilos CSS mejorados
        const estilosSimulacion = document.createElement('style');
        estilosSimulacion.textContent = `
            /* ===== ESTILOS DE CARGA ===== */
            .sim-loading-container {
                padding: 60px 40px;
                background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
                min-height: 500px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .sim-loading-content {
                width: 100%;
                max-width: 500px;
                padding: 0 20px;
                margin: 0 auto;
            }

            .sim-loading-animation {
                margin-bottom: 30px;
                display: flex;
                justify-content: center;
            }

            .football-field {
                position: relative;
                width: 220px;
                height: 130px;
                background: linear-gradient(90deg, #1a4d2e 0%, #1e5f3a 50%, #1a4d2e 100%);
                border-radius: 12px;
                border: 3px solid rgba(255, 255, 255, 0.3);
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
            }

            .field-line {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 3px;
                height: 100%;
                background: rgba(255, 255, 255, 0.4);
            }

            .center-circle {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 60px;
                height: 60px;
                border: 2px solid rgba(255, 255, 255, 0.4);
                border-radius: 50%;
            }

            .football-ball {
                position: absolute;
                top: 50%;
                left: 20%;
                transform: translate(-50%, -50%);
                font-size: 36px;
                animation: ballMove 2s ease-in-out infinite;
                filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5));
            }

            @keyframes ballMove {
                0%, 100% { left: 20%; }
                50% { left: 80%; }
            }

            .sim-loading-title {
                text-align: center;
                font-size: 1.9rem;
                font-weight: 800;
                background: linear-gradient(135deg, #00a0e3, #ff6636);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 25px;
                letter-spacing: 0.5px;
            }

            .sim-progress-wrapper {
                margin-bottom: 20px;
            }

            .sim-progress-bar {
                height: 12px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                overflow: hidden;
                margin-bottom: 12px;
                border: 2px solid rgba(0, 160, 227, 0.3);
            }

            .sim-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #00a0e3, #00d4ff);
                border-radius: 10px;
                transition: width 0.3s ease;
                box-shadow: 0 0 15px rgba(0, 160, 227, 0.8);
            }

            .sim-progress-text {
                text-align: center;
                font-size: 1.3rem;
                font-weight: 800;
                color: #00d4ff;
                text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
            }

            .sim-loading-status {
                text-align: center;
                font-size: 1.05rem;
                color: #bbb;
                margin-bottom: 30px;
                font-weight: 500;
            }

            .sim-loading-stats {
                display: flex;
                justify-content: center;
                gap: 15px;
                flex-wrap: wrap;
            }

            .loading-stat {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                padding: 15px 12px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                border: 2px solid rgba(0, 160, 227, 0.2);
                flex: 1;
                min-width: 130px;
                max-width: 145px;
                transition: all 0.3s ease;
            }

            .loading-stat:hover {
                background: rgba(255, 255, 255, 0.08);
                border-color: rgba(0, 160, 227, 0.4);
                transform: translateY(-2px);
            }

            .loading-stat i {
                font-size: 28px;
                color: #00a0e3;
                filter: drop-shadow(0 0 8px rgba(0, 160, 227, 0.6));
            }

            .loading-stat span {
                font-size: 0.88rem;
                color: #bbb;
                text-align: center;
                font-weight: 600;
                line-height: 1.3;
            }

            /* ===== ESTILOS DE RESULTADO ===== */
            .sim-result-header {
                background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
                padding: 30px 20px;
                border-bottom: 3px solid rgba(0, 160, 227, 0.4);
            }

            .sim-match-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 35px;
            }

            .match-badge {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #bbb;
                font-size: 1.2rem;
                font-weight: 500;
            }

            .match-badge i {
                color: #00a0e3;
                font-size: 1.4rem;
            }

            .match-status {
                display: flex;
                align-items: center;
                gap: 20px;
            }

            .status-badge {
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                padding: 10px 24px;
                border-radius: 25px;
                font-size: 1.1rem;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
            }

            .match-time {
                background: rgba(255, 255, 255, 0.15);
                padding: 10px 20px;
                border-radius: 12px;
                font-weight: 700;
                color: #fff;
                font-size: 1.2rem;
            }

            .sim-scoreboard {
                display: grid;
                grid-template-columns: 1fr auto 1fr;
                gap: 30px;
                align-items: center;
            }

            .team-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
            }

            .team-logo-sim {
                width: 100px;
                height: 100px;
                object-fit: contain;
                filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4));
                display: none;
            }

            .team-logo-sim[src]:not([src=""]) {
                display: block;
            }

            .team-name-sim {
                font-size: 2rem;
                font-weight: 800;
                margin: 0;
                letter-spacing: 0.5px;
            }

            .team-home .team-name-sim {
                color: #00a0e3;
                text-shadow: 0 0 10px rgba(0, 160, 227, 0.3);
            }

            .team-away .team-name-sim {
                color: #ff6636;
                text-shadow: 0 0 10px rgba(255, 102, 54, 0.3);
            }

            .score-section {
                text-align: center;
            }

            .final-score {
                font-size: 6rem;
                font-weight: 900;
                line-height: 1;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 20px;
            }

            .score-home {
                color: #00a0e3;
            }

            .score-away {
                color: #ff6636;
            }

            .score-separator {
                color: rgba(255, 255, 255, 0.3);
                font-weight: 400;
            }

            .score-label {
                font-size: 1rem;
                color: #888;
                font-weight: 700;
                letter-spacing: 2px;
            }

            .sim-content-grid {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                background: #111;
            }

            .sim-stats-panel, .sim-timeline-panel {
                padding: 25px 20px;
            }

            .stats-home {
                border-right: 2px solid rgba(255, 255, 255, 0.1);
            }

            .stats-away {
                border-left: 2px solid rgba(255, 255, 255, 0.1);
            }

            .stats-header, .timeline-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 25px;
                padding-bottom: 15px;
                border-bottom: 3px solid rgba(0, 160, 227, 0.3);
            }

            .stats-header i, .timeline-header i {
                color: #00a0e3;
                font-size: 1.5rem;
            }

            .stats-header h6, .timeline-header h6 {
                margin: 0;
                font-weight: 700;
                color: #fff;
                font-size: 1.1rem;
                letter-spacing: 0.5px;
            }

            .stats-content {
                max-height: none;
                overflow-y: auto;
            }

            .timeline-content {
                max-height: none;
                overflow-y: auto;
                padding-right: 15px;
            }

            .stat-item {
                margin-bottom: 25px;
            }

            .stat-item .d-flex {
                margin-bottom: 10px;
            }

            .stat-name {
                font-size: 0.95rem;
                color: #bbb;
                font-weight: 500;
            }

            .stat-value {
                font-weight: 700;
                font-size: 1.1rem;
            }

            .stat-bar {
                height: 10px;
                background: rgba(255, 255, 255, 0.08);
                border-radius: 5px;
                overflow: hidden;
                box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
            }

            .stat-bar-fill {
                height: 100%;
                border-radius: 5px;
                transition: width 0.6s ease;
                box-shadow: 0 0 8px rgba(0, 160, 227, 0.4);
            }

            .stat-bar-fill.bg-info {
                background: linear-gradient(90deg, #00a0e3, #00d4ff) !important;
            }

            .stat-bar-fill.bg-danger {
                background: linear-gradient(90deg, #ff6636, #ff8956) !important;
            }

            .momento-partido {
                position: relative;
                margin-bottom: 30px;
                padding-left: 95px;
                padding-bottom: 25px;
                border-left: none;
            }

            .momento-partido:last-child {
                margin-bottom: 0;
            }

            .momento-partido .minuto {
                position: absolute;
                left: 10px;
                top: 0;
                width: 70px;
                height: 70px;
                background: #00a0e3;
                border: 6px solid #00d4ff;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 900;
                font-size: 1.6rem;
                color: #fff;
                box-shadow: 0 0 30px rgba(0, 160, 227, 1), 0 6px 20px rgba(0, 0, 0, 0.7);
                z-index: 10;
            }

            .momento-partido .contenido {
                background: rgba(255, 255, 255, 0.08);
                padding: 15px 20px;
                border-radius: 12px;
                border: 2px solid rgba(255, 255, 255, 0.15);
                font-size: 1.05rem;
                line-height: 1.6;
                font-weight: 600;
                color: #fff;
            }

            .momento-partido.gol .minuto {
                background: linear-gradient(135deg, #ff6636, #ff8956);
                border-color: #ffeb3b;
                box-shadow: 0 0 25px rgba(255, 102, 54, 1), 0 0 40px rgba(255, 235, 59, 0.6);
                animation: goalPulse 2s ease-in-out infinite;
            }

            @keyframes goalPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            .momento-partido.gol .contenido {
                background: rgba(255, 102, 54, 0.1);
                border-color: rgba(255, 102, 54, 0.3);
            }

            .momento-partido.tarjeta .minuto {
                background: linear-gradient(135deg, #ffc107, #ffeb3b);
                border-color: #ff9800;
                color: #000;
                box-shadow: 0 0 20px rgba(255, 193, 7, 0.8), 0 4px 12px rgba(0, 0, 0, 0.5);
                font-weight: 900;
            }

            .momento-partido.info .minuto {
                background: linear-gradient(135deg, #6c757d, #adb5bd);
                border-color: #dee2e6;
                box-shadow: 0 0 15px rgba(108, 117, 125, 0.6), 0 4px 12px rgba(0, 0, 0, 0.5);
            }

            /* Scrollbar personalizado */
            .stats-content::-webkit-scrollbar,
            .timeline-content::-webkit-scrollbar {
                width: 6px;
            }

            .stats-content::-webkit-scrollbar-track,
            .timeline-content::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
            }

            .stats-content::-webkit-scrollbar-thumb,
            .timeline-content::-webkit-scrollbar-thumb {
                background: rgba(0, 160, 227, 0.5);
                border-radius: 10px;
            }

            .stats-content::-webkit-scrollbar-thumb:hover,
            .timeline-content::-webkit-scrollbar-thumb:hover {
                background: rgba(0, 160, 227, 0.8);
            }

            /* Responsive */
            @media (max-width: 992px) {
                .sim-content-grid {
                    grid-template-columns: 1fr;
                }

                .stats-home, .stats-away {
                    border: none;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .sim-scoreboard {
                    grid-template-columns: 1fr;
                    gap: 20px;
                }

                .final-score {
                    font-size: 3rem;
                }
            }
        `;
        document.head.appendChild(estilosSimulacion);
        
        // Agregar evento para nueva simulación
        const nuevaSimBtn = document.getElementById('nueva-simulacion-btn');
        if (nuevaSimBtn) {
            nuevaSimBtn.addEventListener('click', function() {
                simularPartido();
            });
        }
    }
    
    // Obtener referencias
    const modalElement = document.getElementById('simulacion-modal');
    const barraProgreso = document.getElementById('barra-progreso');
    const textoCarga = document.getElementById('texto-carga');
    const simulacionCarga = document.getElementById('simulacion-carga');
    const simulacionResultado = document.getElementById('simulacion-resultado');
    
    // Reiniciar elementos
    barraProgreso.style.width = '0%';
    barraProgreso.setAttribute('aria-valuenow', '0');
    simulacionCarga.style.display = 'block';
    simulacionResultado.style.display = 'none';
    
    // Mostrar modal (usando el constructor directamente)
    const simulacionModal = new bootstrap.Modal(modalElement);
    simulacionModal.show();
    
    // Simular progreso
    const frases = [
        "Analizando estadísticas de los equipos...",
        "Calculando probabilidades de gol...",
        "Simulando jugadas clave...",
        "Generando eventos del partido...",
        "Aplicando factores aleatorios...",
        "Calculando resultado final..."
    ];
    
    const progressPercentage = document.getElementById('progress-percentage');

    for (let i = 0; i <= 100; i += 4) {
        barraProgreso.style.width = i + '%';
        barraProgreso.setAttribute('aria-valuenow', i);
        if (progressPercentage) progressPercentage.textContent = i + '%';

        if (i % 20 === 0 && i > 0 && i < 100) {
            textoCarga.textContent = frases[i/20];
        }
        if (i === 100) textoCarga.textContent = "¡Simulación completada!";

        await new Promise(resolve => setTimeout(resolve, 80));
    }
    
    // Esperar un momento antes de mostrar resultados
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Ocultar carga y mostrar resultados
    simulacionCarga.style.display = 'none';
    simulacionResultado.style.display = 'block';
    
    // Obtener datos de los equipos
    const team1 = currentResults.team1.name;
    const team2 = currentResults.team2.name;
    const lambda1 = currentResults.team1.lambda;
    const lambda2 = currentResults.team2.lambda;
    const stats1 = currentResults.team1.stats;
    const stats2 = currentResults.team2.stats;

    // SIMULACIÓN AVANZADA MINUTO A MINUTO
    const resultadoSimulacion = simularPartidoAvanzado(team1, team2, lambda1, lambda2, stats1, stats2);

    const goles1 = resultadoSimulacion.goles1;
    const goles2 = resultadoSimulacion.goles2;
    const momentos = resultadoSimulacion.momentos;
    const estadisticas = resultadoSimulacion.estadisticas;

    // Mostrar resultado
    document.getElementById('equipo-local').textContent = team1;
    document.getElementById('equipo-visitante').textContent = team2;
    document.getElementById('goles-local').textContent = goles1;
    document.getElementById('goles-visitante').textContent = goles2;

    // Agregar logos si están disponibles
    const simLogoLocal = document.getElementById('sim-logo-local');
    const simLogoVisitante = document.getElementById('sim-logo-visitante');

    if (currentResults.team1.logo && currentResults.team1.logo !== '') {
        simLogoLocal.src = currentResults.team1.logo;
        simLogoLocal.style.display = 'block';
    }

    if (currentResults.team2.logo && currentResults.team2.logo !== '') {
        simLogoVisitante.src = currentResults.team2.logo;
        simLogoVisitante.style.display = 'block';
    }
    
    // Mostrar estadísticas en los paneles laterales
    const statsLocal = document.getElementById('stats-local');
    const statsVisitante = document.getElementById('stats-visitante');
    
    statsLocal.innerHTML = '';
    statsVisitante.innerHTML = '';
    
    for (const [clave, valores] of Object.entries(estadisticas)) {
        // Crear elementos para estadísticas del equipo local
        const statItemLocal = document.createElement('div');
        statItemLocal.className = 'stat-item';
        statItemLocal.innerHTML = `
            <div class="d-flex justify-content-between">
                <span class="stat-value text-info">${valores.local}</span>
                <span class="stat-name">${valores.nombre}</span>
            </div>
            <div class="stat-bar">
                <div class="stat-bar-fill bg-info" style="width: ${getPercentage(valores.local, valores.visitante)}%"></div>
            </div>
        `;
        
        // Crear elementos para estadísticas del equipo visitante
        const statItemVisitante = document.createElement('div');
        statItemVisitante.className = 'stat-item';
        statItemVisitante.innerHTML = `
            <div class="d-flex justify-content-between">
                <span class="stat-name">${valores.nombre}</span>
                <span class="stat-value text-danger">${valores.visitante}</span>
            </div>
            <div class="stat-bar">
                <div class="stat-bar-fill bg-danger" style="width: ${100 - getPercentage(valores.local, valores.visitante)}%"></div>
            </div>
        `;
        
        statsLocal.appendChild(statItemLocal);
        statsVisitante.appendChild(statItemVisitante);
    }
    
    // Mostrar momentos en la UI
    
    // Mostrar momentos
    const momentosPartido = document.getElementById('momentos-partido');
    momentosPartido.innerHTML = '';
    
    // Verificar que se hayan generado momentos
    if (momentos.length === 0) {
        momentosPartido.innerHTML = '<div class="text-center text-muted">No hay momentos destacados para mostrar</div>';
    } else {
        // Ordenar momentos por minuto
        momentos.sort((a, b) => a.minuto - b.minuto);
        
        // Crear elementos para cada momento
        momentos.forEach(momento => {
            const elementoMomento = document.createElement('div');
            elementoMomento.className = 'momento-partido';
            
            // Añadir clase adicional si es un gol
            if (momento.tipo === 'gol') {
                elementoMomento.classList.add('gol');
            }
            
            elementoMomento.innerHTML = `
                <div class="minuto">${momento.minuto}'</div>
                <div class="contenido">
                    <strong>${momento.equipo}:</strong> ${momento.descripcion}
                    ${momento.tipo === 'gol' ? '<span class="badge bg-danger ms-1">GOL</span>' : ''}
                </div>
            `;
            
            momentosPartido.appendChild(elementoMomento);
        });
    }
    
    // Hacer scroll al inicio de los momentos
    momentosPartido.scrollTop = 0;
}

// ==========================================
// SIMULACIÓN AVANZADA MINUTO A MINUTO
// ==========================================

// ==========================================
// MOTOR DE SIMULACIÓN REALISTA - VERSIÓN PROFESIONAL
// ==========================================

/**
 * Clase para gestionar el momentum con memoria de eventos
 */
class MomentumEngine {
    constructor() {
        this.eventosRecientes = [];
        this.momentum = 0;
    }

    agregarEvento(tipo, equipo, impacto, minuto) {
        this.eventosRecientes.push({
            tipo,
            equipo,
            impacto,
            minuto
        });

        // Mantener solo últimos 15 eventos
        if (this.eventosRecientes.length > 15) {
            this.eventosRecientes.shift();
        }

        this.recalcular(minuto);
    }

    recalcular(minutoActual) {
        let suma = 0;
        const totalEventos = this.eventosRecientes.length;

        this.eventosRecientes.forEach((evento, idx) => {
            // Eventos más recientes pesan más
            const pesoRecencia = (idx + 1) / totalEventos;

            // Decay temporal: eventos hace más de 10 minutos pesan menos
            const edadMinutos = minutoActual - evento.minuto;
            const decayTemporal = Math.max(0.3, Math.exp(-edadMinutos / 10));

            suma += evento.impacto * pesoRecencia * decayTemporal;
        });

        this.momentum = Math.max(-1, Math.min(1, suma / 3));
    }

    getMomentum(minuto) {
        this.recalcular(minuto);
        return this.momentum;
    }
}

/**
 * Clase para gestionar fatiga de equipos
 */
class FatigaManager {
    constructor() {
        this.fatigaEquipo1 = 0;
        this.fatigaEquipo2 = 0;
    }

    actualizarFatiga(minuto, estilo1, estilo2, expulsiones1, expulsiones2) {
        const baseFatiga = Math.pow(minuto / 90, 1.5); // Crece exponencialmente

        // Estilos agresivos cansan más
        const factor1 = (estilo1 === 'PRESIÓN' || estilo1 === 'FÍSICO') ? 1.3 : 1.0;
        const factor2 = (estilo2 === 'PRESIÓN' || estilo2 === 'FÍSICO') ? 1.3 : 1.0;

        // Con menos jugadores, más fatiga
        const fatigaExpulsiones1 = 1 + (expulsiones1 * 0.2);
        const fatigaExpulsiones2 = 1 + (expulsiones2 * 0.2);

        this.fatigaEquipo1 = Math.min(1, baseFatiga * factor1 * fatigaExpulsiones1);
        this.fatigaEquipo2 = Math.min(1, baseFatiga * factor2 * fatigaExpulsiones2);
    }

    getFactor(equipo) {
        const fatiga = equipo === 1 ? this.fatigaEquipo1 : this.fatigaEquipo2;

        return {
            defensivo: 1 - (fatiga * 0.3), // -30% max defensa
            ofensivo: 1 + (fatiga * 0.20), // +20% max ataque (más espacios)
            precision: 1 - (fatiga * 0.15)  // -15% max precisión
        };
    }
}

/**
 * Obtiene el multiplicador de probabilidad según el minuto
 */
function getProbabilidadPorMinuto(minuto) {
    if (minuto <= 15) return 0.75;   // Inicio táctico
    if (minuto <= 30) return 1.05;   // Se abre el partido
    if (minuto <= 45) return 1.35;   // Pre-descanso (más goles estadísticamente)
    if (minuto <= 50) return 0.65;   // Post-descanso (reajuste)
    if (minuto <= 60) return 0.95;   // Normalización
    if (minuto <= 75) return 1.10;   // Aumenta intensidad
    if (minuto <= 90) return 1.45;   // Minutos finales (más goles)
    return 1.70;                      // Tiempo añadido (desesperación)
}

/**
 * Infiere la táctica de un equipo desde sus estadísticas
 */
function inferirTactica(stats) {
    const posesion = parseFloat(stats.possession) || 50;
    const tiros = parseFloat(stats.shotsOnTarget) || 4;
    const pases = parseFloat(stats.passingAccuracy) || 75;
    const faltas = parseFloat(stats.fouls) || 12;

    if (posesion > 56 && pases > 82) {
        return {
            nombre: "POSESIÓN",
            defensivo: 0.88,
            ofensivo: 1.12,
            contraataques: 0.55,
            descripcion: "Dominio de balón"
        };
    } else if (posesion < 44 && tiros > 4.5) {
        return {
            nombre: "CONTRAATAQUE",
            defensivo: 1.05,
            ofensivo: 0.92,
            contraataques: 1.85,
            descripcion: "Juego directo"
        };
    } else if (faltas > 14) {
        return {
            nombre: "FÍSICO/PRESIÓN",
            defensivo: 1.08,
            ofensivo: 0.95,
            contraataques: 1.25,
            descripcion: "Alta intensidad"
        };
    } else if (posesion > 50 && tiros < 4) {
        return {
            nombre: "CONTROL",
            defensivo: 0.95,
            ofensivo: 0.98,
            contraataques: 0.80,
            descripcion: "Juego conservador"
        };
    } else {
        return {
            nombre: "EQUILIBRADO",
            defensivo: 1.0,
            ofensivo: 1.0,
            contraataques: 1.0,
            descripcion: "Juego balanceado"
        };
    }
}

/**
 * Calcula xG (Expected Goals) para una ocasión
 */
function calcularXG(tipoJugada, calidadOfensiva, calidadDefensiva, fatiga) {
    let xgBase = 0;

    // xG base según tipo de jugada (basado en datos reales)
    switch(tipoJugada) {
        case 'penalti':         xgBase = 0.79; break;
        case 'uno_vs_uno':      xgBase = 0.38; break;
        case 'dentro_area':     xgBase = 0.19; break;
        case 'borde_area':      xgBase = 0.08; break;
        case 'fuera_area':      xgBase = 0.04; break;
        case 'corner':          xgBase = 0.03; break;
        case 'tiro_libre':      xgBase = 0.06; break;
        case 'contragolpe':     xgBase = 0.24; break;
        case 'rechace':         xgBase = 0.12; break;
        case 'cabezazo':        xgBase = 0.09; break;
        default:                xgBase = 0.10; break;
    }

    // Ajustar por calidad ofensiva (0.5 - 2.0)
    const factorOfensivo = calidadOfensiva / 5.0;

    // Ajustar por calidad defensiva (0.5 - 1.5)
    const factorDefensivo = Math.max(0.5, 1.5 - (calidadDefensiva / 5.0));

    // Ajustar por fatiga (precisión baja)
    const factorFatiga = fatiga.precision;

    // NUEVO: Factor de variabilidad realista (±30%)
    // Simula "días inspirados" o "días malos" - hace resultados menos predecibles
    const variabilidadRealista = 0.7 + Math.random() * 0.6; // 0.7 a 1.3

    // xG final con variabilidad
    let xgFinal = xgBase * factorOfensivo * factorDefensivo * factorFatiga * variabilidadRealista;

    // Clamp entre 0.01 y 0.95 (aumentado de 0.92 para permitir más goles)
    return Math.max(0.01, Math.min(0.95, xgFinal));
}

/**
 * Calcula la presión ofensiva de un equipo en un momento dado
 */
function calcularPresionOfensiva(lambda, stats, minuto, diferencia, momentum, tactica, fatiga) {
    let presion = lambda * 2.2;

    // Factor estadístico ofensivo
    const factorTiros = Math.max(0.6, Math.min(2.0, stats.shotsOnTarget / 4.5));
    const factorPosesion = stats.possession / 50;
    presion *= (factorTiros * 0.6 + factorPosesion * 0.4);

    // Ajuste por diferencia de goles (MÁS AGRESIVO para permitir goleadas y remontadas)
    if (diferencia < -2) {
        presion *= 1.85; // Perdiendo por 3+: desesperación total (permite remontadas locas)
    } else if (diferencia < -1) {
        presion *= 1.65; // Perdiendo por 2: ataque total
    } else if (diferencia < 0) {
        presion *= 1.35; // Perdiendo por 1: presionar más
    } else if (diferencia > 2) {
        presion *= 0.55; // Ganando por 3+: ultra conservador (pero permite goleadas)
    } else if (diferencia > 1) {
        presion *= 0.70; // Ganando por 2+: conservador
    } else if (diferencia > 0) {
        presion *= 0.82; // Ganando por 1: algo conservador
    }

    // Ajuste por momentum (MÁS IMPACTO para rachas goleadoras)
    presion *= (1 + momentum * 0.45);

    // Ajuste por táctica
    presion *= tactica.ofensivo;

    // Ajuste por fatiga (más espacios = más ocasiones)
    presion *= fatiga.ofensivo;

    // NUEVO: Factor de rendimiento del día (±25%)
    // Simula "días inspirados" donde un equipo puede golear
    const rendimientoDia = 0.75 + Math.random() * 0.5; // 0.75 a 1.25
    presion *= rendimientoDia;

    // Minutos críticos (MÁS AGRESIVO)
    if (minuto > 75 && diferencia < 0) {
        const factorDesesperacion = 1 + ((minuto - 75) / 15) * 0.8;
        presion *= factorDesesperacion;
    }

    // Minutos clave (justo antes de descanso/final)
    if ([44, 45, 89, 90].includes(minuto)) {
        presion *= 1.25;
    }

    return Math.max(0.1, presion);
}

/**
 * Genera una ocasión de gol con tipo específico
 */
function generarTipoOcasion(presion, tactica, esContraataque) {
    const rand = Math.random();

    if (esContraataque) {
        return Math.random() < 0.7 ? 'contragolpe' : 'uno_vs_uno';
    }

    // Distribución realista de tipos de ocasión
    if (rand < 0.02) return 'penalti';
    if (rand < 0.15) return 'uno_vs_uno';
    if (rand < 0.35) return 'dentro_area';
    if (rand < 0.50) return 'borde_area';
    if (rand < 0.65) return 'fuera_area';
    if (rand < 0.75) return 'corner';
    if (rand < 0.82) return 'tiro_libre';
    if (rand < 0.90) return 'rechace';
    return 'cabezazo';
}

/**
 * Simulación de partido ULTRA REALISTA
 *
 * MEJORAS DE REALISMO (v2.0):
 * - Variabilidad en xG (±30%): Simula "días inspirados" vs "días malos"
 * - Factor de rendimiento (±25%): Permite goleadas inesperadas
 * - Mayor agresividad en diferencias grandes: Posibilita remontadas épicas y goleadas
 * - Probabilidad de ocasión aumentada: Más goles, resultados más variados
 * - Momentum amplificado: Rachas goleadoras más realistas
 *
 * Resultados posibles: 0-0, 1-0, 4-3, 5-1, etc. (como en fútbol real)
 */
function simularPartidoAvanzado(team1, team2, lambda1, lambda2, stats1, stats2) {
    // Inicialización
    let goles1 = 0;
    let goles2 = 0;
    let momentos = [];
    let jugadores1Expulsados = 0;
    let jugadores2Expulsados = 0;

    // Motores avanzados
    const momentumEngine = new MomentumEngine();
    const fatigaManager = new FatigaManager();

    // Tácticas inferidas
    let tactica1 = inferirTactica(stats1);
    let tactica2 = inferirTactica(stats2);

    // Aplicar modificadores de configuración a las tácticas si existe configuración
    if (configuracionSimulacion) {
        const modTeam1 = aplicarModificadoresConfiguracion(
            configuracionSimulacion.team1, 0, 0, 0, '', 1, 0, tactica1
        );
        const modTeam2 = aplicarModificadoresConfiguracion(
            configuracionSimulacion.team2, 0, 0, 0, '', 1, 0, tactica2
        );

        // Aplicar modificadores a las tácticas
        tactica1.defensivo *= modTeam1.defensivo;
        tactica1.ofensivo *= modTeam1.ofensivo;
        tactica1.contraataques *= modTeam1.contraataques;

        tactica2.defensivo *= modTeam2.defensivo;
        tactica2.ofensivo *= modTeam2.ofensivo;
        tactica2.contraataques *= modTeam2.contraataques;
    }

    // Calidad ofensiva/defensiva
    const calidadOfensiva1 = (parseFloat(stats1.shotsOnTarget) + parseFloat(stats1.goalsScored)) / 2;
    const calidadOfensiva2 = (parseFloat(stats2.shotsOnTarget) + parseFloat(stats2.goalsScored)) / 2;
    const calidadDefensiva1 = 5 - parseFloat(stats1.goalsConceded);
    const calidadDefensiva2 = 5 - parseFloat(stats2.goalsConceded);

    // Estadísticas acumuladas del partido
    let tirosLocal = 0;
    let tirosVisitante = 0;
    let tirosPuertaLocal = 0;
    let tirosPuertaVisitante = 0;
    let cornersLocal = 0;
    let cornersVisitante = 0;
    let faltasLocal = 0;
    let faltasVisitante = 0;
    let tarjetasAmarillasLocal = 0;
    let tarjetasAmarillasVisitante = 0;

    // xG acumulado
    let xgTotal1 = 0;
    let xgTotal2 = 0;

    // Simulación minuto a minuto (90 minutos + descuento)
    const minutosTotal = 90 + Math.floor(Math.random() * 6); // 90-95 minutos

    // Log inicial de tácticas
    momentos.push({
        minuto: 0,
        equipo: 'INFO',
        descripcion: `${team1} (${tactica1.nombre}: ${tactica1.descripcion}) vs ${team2} (${tactica2.nombre}: ${tactica2.descripcion})`,
        tipo: 'info'
    });

    for (let minuto = 1; minuto <= minutosTotal; minuto++) {
        const diferencia = goles1 - goles2;

        // Actualizar fatiga
        fatigaManager.actualizarFatiga(minuto, tactica1.nombre, tactica2.nombre,
                                       jugadores1Expulsados, jugadores2Expulsados);

        const fatiga1 = fatigaManager.getFactor(1);
        const fatiga2 = fatigaManager.getFactor(2);

        // Obtener momentum actual
        const momentum = momentumEngine.getMomentum(minuto);

        // Multiplicador temporal
        const factorTemporal = getProbabilidadPorMinuto(minuto);

        // Calcular presión ofensiva de ambos equipos
        let presion1 = calcularPresionOfensiva(lambda1, stats1, minuto, diferencia,
                                                  momentum, tactica1, fatiga1);
        let presion2 = calcularPresionOfensiva(lambda2, stats2, minuto, -diferencia,
                                                  -momentum, tactica2, fatiga2);

        // Aplicar modificadores de configuración a la presión
        if (configuracionSimulacion) {
            const modTeam1 = aplicarModificadoresConfiguracion(
                configuracionSimulacion.team1, presion1, 0, 0, '', minuto, diferencia, tactica1
            );
            const modTeam2 = aplicarModificadoresConfiguracion(
                configuracionSimulacion.team2, presion2, 0, 0, '', minuto, -diferencia, tactica2
            );

            presion1 *= modTeam1.presion;
            presion2 *= modTeam2.presion;
        }

        // Presión total en este minuto
        const presionTotal = (presion1 + presion2) * factorTemporal;

        // Probabilidad de ocasión en este minuto (aumentado de 0.35 a 0.42 para más ocasiones)
        const probOcasion = Math.min(0.42, presionTotal / 170);

        if (Math.random() < probOcasion) {
            // Determinar qué equipo genera la ocasión
            const esEquipo1 = Math.random() < (presion1 / (presion1 + presion2));

            if (esEquipo1) {
                // OCASIÓN EQUIPO 1
                const esContraataque = tactica1.nombre === 'CONTRAATAQUE' && Math.random() < tactica1.contraataques / 2;
                const tipoOcasion = generarTipoOcasion(presion1, tactica1, esContraataque);
                let xg = calcularXG(tipoOcasion, calidadOfensiva1, calidadDefensiva2, fatiga1);

                // Aplicar modificadores de configuración al xG
                if (configuracionSimulacion) {
                    const modTeam1 = aplicarModificadoresConfiguracion(
                        configuracionSimulacion.team1, presion1, xg, fatiga1, tipoOcasion, minuto, diferencia, tactica1
                    );
                    xg *= modTeam1.xg;
                }

                xgTotal1 += xg;
                tirosLocal++;

                // ¿Convierte en gol?
                if (Math.random() < xg) {
                    // ¡GOL!
                    goles1++;
                    tirosPuertaLocal++;
                    momentumEngine.agregarEvento('gol', 1, 0.6, minuto);

                    const descripcionGol = generarDescripcionGolRealista(tipoOcasion, team1);
                    momentos.push({
                        minuto,
                        equipo: team1,
                        descripcion: descripcionGol,
                        tipo: 'gol',
                        xg: xg.toFixed(2)
                    });
                } else if (xg > 0.20) {
                    // Ocasión clara fallada
                    tirosPuertaLocal++;
                    momentumEngine.agregarEvento('ocasion', 1, 0.15, minuto);

                    if (Math.random() < 0.4) {
                        momentos.push({
                            minuto,
                            equipo: team1,
                            descripcion: generarDescripcionOcasionFallada(tipoOcasion),
                            tipo: 'ocasion'
                        });
                    }
                }
            } else {
                // OCASIÓN EQUIPO 2
                const esContraataque = tactica2.nombre === 'CONTRAATAQUE' && Math.random() < tactica2.contraataques / 2;
                const tipoOcasion = generarTipoOcasion(presion2, tactica2, esContraataque);
                let xg = calcularXG(tipoOcasion, calidadOfensiva2, calidadDefensiva1, fatiga2);

                // Aplicar modificadores de configuración al xG
                if (configuracionSimulacion) {
                    const modTeam2 = aplicarModificadoresConfiguracion(
                        configuracionSimulacion.team2, presion2, xg, fatiga2, tipoOcasion, minuto, -diferencia, tactica2
                    );
                    xg *= modTeam2.xg;
                }

                xgTotal2 += xg;
                tirosVisitante++;

                // ¿Convierte en gol?
                if (Math.random() < xg) {
                    // ¡GOL!
                    goles2++;
                    tirosPuertaVisitante++;
                    momentumEngine.agregarEvento('gol', 2, -0.6, minuto);

                    const descripcionGol = generarDescripcionGolRealista(tipoOcasion, team2);
                    momentos.push({
                        minuto,
                        equipo: team2,
                        descripcion: descripcionGol,
                        tipo: 'gol',
                        xg: xg.toFixed(2)
                    });
                } else if (xg > 0.20) {
                    // Ocasión clara fallada
                    tirosPuertaVisitante++;
                    momentumEngine.agregarEvento('ocasion', 2, -0.15, minuto);

                    if (Math.random() < 0.4) {
                        momentos.push({
                            minuto,
                            equipo: team2,
                            descripcion: generarDescripcionOcasionFallada(tipoOcasion),
                            tipo: 'ocasion'
                        });
                    }
                }
            }
        }

        // Eventos menores (corners, faltas, tarjetas)
        if (Math.random() < 0.12) {
            const tipoEvento = Math.random();
            const equipoEvento = Math.random() < 0.5 ? team1 : team2;
            const esLocal = equipoEvento === team1;

            if (tipoEvento < 0.45) {
                // Corner
                if (esLocal) cornersLocal++;
                else cornersVisitante++;
            } else if (tipoEvento < 0.85) {
                // Falta
                if (esLocal) faltasLocal++;
                else faltasVisitante++;
            } else if (tipoEvento < 0.97) {
                // Tarjeta amarilla
                if (esLocal) tarjetasAmarillasLocal++;
                else tarjetasAmarillasVisitante++;

                if (Math.random() < 0.25) {
                    momentos.push({
                        minuto,
                        equipo: equipoEvento,
                        descripcion: 'Tarjeta amarilla por falta',
                        tipo: 'tarjeta'
                    });
                }
            } else {
                // Tarjeta roja (muy raro)
                if (esLocal) {
                    jugadores1Expulsados++;
                    momentumEngine.agregarEvento('expulsion', 1, -0.8, minuto);
                    momentos.push({
                        minuto,
                        equipo: team1,
                        descripcion: '🔴 EXPULSIÓN - Juego peligroso',
                        tipo: 'tarjeta-roja'
                    });
                } else {
                    jugadores2Expulsados++;
                    momentumEngine.agregarEvento('expulsion', 2, 0.8, minuto);
                    momentos.push({
                        minuto,
                        equipo: team2,
                        descripcion: '🔴 EXPULSIÓN - Juego peligroso',
                        tipo: 'tarjeta-roja'
                    });
                }
            }
        }
    }

    // Calcular posesión basada en estadísticas originales + momentum final
    const momentumFinal = momentumEngine.getMomentum(minutosTotal);
    const posesionBase1 = parseFloat(stats1.possession) || 50;
    const posesionBase2 = parseFloat(stats2.possession) || 50;
    const totalPosesion = posesionBase1 + posesionBase2;

    let posesionLocal = Math.round((posesionBase1 / totalPosesion) * 100 + momentumFinal * 5);
    posesionLocal = Math.max(30, Math.min(70, posesionLocal));
    const posesionVisitante = 100 - posesionLocal;

    // Ajustar tiros según posesión
    tirosLocal = Math.max(tirosLocal, Math.round(posesionLocal / 10));
    tirosVisitante = Math.max(tirosVisitante, Math.round(posesionVisitante / 10));

    tirosPuertaLocal = Math.max(tirosPuertaLocal, Math.round(tirosLocal * 0.4));
    tirosPuertaVisitante = Math.max(tirosPuertaVisitante, Math.round(tirosVisitante * 0.4));

    // Precisión de pases con variación
    const pasesLocal = Math.round(stats1.passingAccuracy + (Math.random() - 0.5) * 6);
    const pasesVisitante = Math.round(stats2.passingAccuracy + (Math.random() - 0.5) * 6);

    // Generar estadísticas finales
    const estadisticas = {
        posesion: {
            nombre: "Posesión",
            local: posesionLocal + "%",
            visitante: posesionVisitante + "%"
        },
        tirosAPuerta: {
            nombre: "Tiros a puerta",
            local: tirosPuertaLocal,
            visitante: tirosPuertaVisitante
        },
        tirosTotales: {
            nombre: "Tiros totales",
            local: tirosLocal,
            visitante: tirosVisitante
        },
        pases: {
            nombre: "Precisión de pases",
            local: Math.max(60, Math.min(95, pasesLocal)) + "%",
            visitante: Math.max(60, Math.min(95, pasesVisitante)) + "%"
        },
        faltas: {
            nombre: "Faltas",
            local: Math.max(5, Math.min(20, faltasLocal)),
            visitante: Math.max(5, Math.min(20, faltasVisitante))
        },
        corners: {
            nombre: "Córners",
            local: Math.max(0, Math.min(12, cornersLocal)),
            visitante: Math.max(0, Math.min(12, cornersVisitante))
        },
        tarjetasAmarillas: {
            nombre: "Tarjetas amarillas",
            local: tarjetasAmarillasLocal,
            visitante: tarjetasAmarillasVisitante
        },
        tarjetasRojas: {
            nombre: "Tarjetas rojas",
            local: jugadores1Expulsados,
            visitante: jugadores2Expulsados
        },
        xG: {
            nombre: "xG (Expected Goals)",
            local: xgTotal1.toFixed(2),
            visitante: xgTotal2.toFixed(2)
        }
    };

    return {
        goles1,
        goles2,
        momentos,
        estadisticas,
        xgTotal1: xgTotal1.toFixed(2),
        xgTotal2: xgTotal2.toFixed(2)
    };
}

// Función auxiliar para calcular porcentaje para barras de progreso
function getPercentage(val1, val2) {
    // Eliminar símbolos de porcentaje si existen
    if (typeof val1 === 'string') val1 = val1.replace('%', '');
    if (typeof val2 === 'string') val2 = val2.replace('%', '');
    
    // Convertir a números
    val1 = parseFloat(val1);
    val2 = parseFloat(val2);
    
    // Calcular porcentaje (mínimo 20%, máximo 80% para que siempre se vea algo)
    const total = val1 + val2;
    if (total === 0) return 50;
    
    const percentage = (val1 / total) * 100;
    return Math.min(Math.max(percentage, 20), 80);
}

// Función para simular goles usando Poisson (más realista)
function simularGoles(lambda) {
    // Ajustar lambda para que sea más realista (limitar valores extremos)
    lambda = Math.max(0.3, Math.min(lambda, 3.5)); // Limitar entre 0.3 y 3.5 goles

    let L = Math.exp(-lambda);
    let p = 1.0;
    let k = 0;

    do {
        k++;
        p *= Math.random();
    } while (p > L);

    // Limitar máximo de goles a 7 para ser realista
    return Math.min(k - 1, 7);
}

// Función para generar estadísticas realistas del partido
function generarEstadisticasPartido(stats1, stats2) {
    // Posesión realista: añadir variación pero que sume 100%
    const posesionBase1 = parseFloat(stats1.possession) || 50;
    const posesionBase2 = parseFloat(stats2.possession) || 50;
    const totalPosesion = posesionBase1 + posesionBase2;

    // Normalizar posesión para que sume 100 con variación aleatoria ±5%
    const variacion = (Math.random() - 0.5) * 10; // -5% a +5%
    let posesionLocal = Math.round((posesionBase1 / totalPosesion) * 100 + variacion);
    posesionLocal = Math.max(30, Math.min(70, posesionLocal)); // Entre 30% y 70%
    const posesionVisitante = 100 - posesionLocal;

    // Tiros a puerta realistas (correlacionados con posesión y calidad)
    const factorLocal = (posesionLocal / 50) * ((stats1.goalsScored || 1) / 1.5);
    const factorVisitante = (posesionVisitante / 50) * ((stats2.goalsScored || 1) / 1.5);

    const tirosLocal = Math.round(3 + factorLocal * 2 + Math.random() * 3);
    const tirosVisitante = Math.round(3 + factorVisitante * 2 + Math.random() * 3);

    // Tiros totales (incluyendo fuera del marco): 2-3 veces los tiros a puerta
    const tirosTotalesLocal = Math.round(tirosLocal * (2 + Math.random()));
    const tirosTotalesVisitante = Math.round(tirosVisitante * (2 + Math.random()));

    // Precisión de pases con variación ±3%
    const pasesLocal = Math.round(stats1.passingAccuracy + (Math.random() - 0.5) * 6);
    const pasesVisitante = Math.round(stats2.passingAccuracy + (Math.random() - 0.5) * 6);

    // Faltas realistas (10-20 por equipo)
    const faltasBase1 = parseFloat(stats1.fouls) || 12;
    const faltasBase2 = parseFloat(stats2.fouls) || 12;
    const faltasLocal = Math.round(faltasBase1 * (0.7 + Math.random() * 0.6));
    const faltasVisitante = Math.round(faltasBase2 * (0.7 + Math.random() * 0.6));

    // Córners realistas (correlacionados con posesión, 0-10 por equipo)
    const cornersBase1 = parseFloat(stats1.corners) || 5;
    const cornersBase2 = parseFloat(stats2.corners) || 5;
    const cornersLocal = Math.round(cornersBase1 * (0.6 + Math.random() * 0.8));
    const cornersVisitante = Math.round(cornersBase2 * (0.6 + Math.random() * 0.8));

    // Tarjetas amarillas realistas (0-4 por equipo)
    const tarjetasBase1 = parseFloat(stats1.yellowCards) || 2;
    const tarjetasBase2 = parseFloat(stats2.yellowCards) || 2;
    const tarjetasLocal = Math.round(tarjetasBase1 * (0.5 + Math.random() * 1));
    const tarjetasVisitante = Math.round(tarjetasBase2 * (0.5 + Math.random() * 1));

    // Tarjetas rojas (muy ocasionales, máximo 1 por equipo)
    const rojaLocal = Math.random() < 0.08 ? 1 : 0; // 8% probabilidad
    const rojaVisitante = Math.random() < 0.08 ? 1 : 0;

    return {
        posesion: {
            nombre: "Posesión",
            local: posesionLocal + "%",
            visitante: posesionVisitante + "%"
        },
        tirosAPuerta: {
            nombre: "Tiros a puerta",
            local: tirosLocal,
            visitante: tirosVisitante
        },
        tirosTotales: {
            nombre: "Tiros totales",
            local: tirosTotalesLocal,
            visitante: tirosTotalesVisitante
        },
        pases: {
            nombre: "Precisión de pases",
            local: Math.max(60, Math.min(95, pasesLocal)) + "%",
            visitante: Math.max(60, Math.min(95, pasesVisitante)) + "%"
        },
        faltas: {
            nombre: "Faltas",
            local: Math.max(5, Math.min(20, faltasLocal)),
            visitante: Math.max(5, Math.min(20, faltasVisitante))
        },
        corners: {
            nombre: "Córners",
            local: Math.max(0, Math.min(12, cornersLocal)),
            visitante: Math.max(0, Math.min(12, cornersVisitante))
        },
        tarjetasAmarillas: {
            nombre: "Tarjetas amarillas",
            local: Math.max(0, Math.min(5, tarjetasLocal)),
            visitante: Math.max(0, Math.min(5, tarjetasVisitante))
        },
        tarjetasRojas: {
            nombre: "Tarjetas rojas",
            local: rojaLocal,
            visitante: rojaVisitante
        }
    };
}

// Función para generar momentos clave del partido
function generarMomentosPartido(equipo1, equipo2, goles1, goles2) {
    const momentos = [];
    const totalMomentos = goles1 + goles2 + Math.floor(Math.random() * 6) + 3; // Goles + algunos momentos adicionales
    
    // Generar minutos para los goles
    const minutosGoles1 = generarMinutosAleatorios(goles1);
    const minutosGoles2 = generarMinutosAleatorios(goles2);
    
    // Agregar goles del equipo 1
    minutosGoles1.forEach(minuto => {
        momentos.push({
            minuto: minuto,
            equipo: equipo1,
            descripcion: `¡GOL! ${generarDescripcionGol()}`,
            tipo: 'gol'
        });
    });
    
    // Agregar goles del equipo 2
    minutosGoles2.forEach(minuto => {
        momentos.push({
            minuto: minuto,
            equipo: equipo2,
            descripcion: `¡GOL! ${generarDescripcionGol()}`,
            tipo: 'gol'
        });
    });
    
    // Agregar otros momentos (tiros, faltas, etc.)
    const momentosAdicionales = totalMomentos - goles1 - goles2;
    const tiposMomentos = ['tiro', 'falta', 'corner', 'tarjeta'];
    
    for (let i = 0; i < momentosAdicionales; i++) {
        const minuto = Math.floor(Math.random() * 90) + 1;
        const equipo = Math.random() < 0.5 ? equipo1 : equipo2;
        const tipoMomento = tiposMomentos[Math.floor(Math.random() * tiposMomentos.length)];
        
        let descripcion = '';
        switch (tipoMomento) {
            case 'tiro':
                descripcion = `${generarDescripcionTiro()}`;
                break;
            case 'falta':
                descripcion = `${generarDescripcionFalta()}`;
                break;
            case 'corner':
                descripcion = `Córner a favor`;
                break;
            case 'tarjeta':
                descripcion = `Tarjeta amarilla`;
                break;
        }
        
        momentos.push({
            minuto: minuto,
            equipo: equipo,
            descripcion: descripcion,
            tipo: tipoMomento
        });
    }
    
    // Ordenar por minuto
    momentos.sort((a, b) => a.minuto - b.minuto);
    
    return momentos;
}

// Función para generar minutos realistas para los goles
function generarMinutosAleatorios(cantidad) {
    const minutos = [];
    for (let i = 0; i < cantidad; i++) {
        // Distribución realista de goles por periodo:
        // 1-15 min: 15% | 16-30: 20% | 31-45: 25% (45+ incluido)
        // 46-60: 20% | 61-75: 25% | 76-90: 30% (90+ incluido)

        const rand = Math.random();
        let minuto;

        if (rand < 0.45) { // 45% primera parte
            const randPrimera = Math.random();
            if (randPrimera < 0.15) {
                minuto = Math.floor(Math.random() * 15) + 1; // 1-15
            } else if (randPrimera < 0.35) {
                minuto = Math.floor(Math.random() * 15) + 16; // 16-30
            } else {
                minuto = Math.floor(Math.random() * 15) + 31; // 31-45
                if (Math.random() < 0.1) minuto = 45 + Math.floor(Math.random() * 3) + 1; // 45+1 a 45+3
            }
        } else { // 55% segunda parte
            const randSegunda = Math.random();
            if (randSegunda < 0.20) {
                minuto = Math.floor(Math.random() * 15) + 46; // 46-60
            } else if (randSegunda < 0.45) {
                minuto = Math.floor(Math.random() * 15) + 61; // 61-75
            } else {
                minuto = Math.floor(Math.random() * 15) + 76; // 76-90
                if (Math.random() < 0.15) minuto = 90 + Math.floor(Math.random() * 5) + 1; // 90+1 a 90+5
            }
        }

        minutos.push(minuto);
    }
    return minutos;
}

// ==========================================
// FUNCIONES GENERADORAS DE DESCRIPCIONES REALISTAS
// ==========================================

/**
 * Genera descripción de gol según el tipo de jugada
 */
function generarDescripcionGolRealista(tipoJugada, equipo) {
    const descripciones = {
        'penalti': [
            '⚽ ¡GOL DE PENALTI! Conversión impecable desde los 11 metros',
            '⚽ ¡GOL! Penalti ejecutado con frialdad',
            '⚽ ¡GOL! Penalti colocado imposible para el portero'
        ],
        'uno_vs_uno': [
            '⚽ ¡GOLAZO! Define con clase en el mano a mano',
            '⚽ ¡GOL! Supera al portero con una vaselina magistral',
            '⚽ ¡GOL! Definición perfecta tras quedar solo ante el portero'
        ],
        'dentro_area': [
            '⚽ ¡GOL! Remate dentro del área que no perdona',
            '⚽ ¡GOL! Disparo cruzado que se cuela en la red',
            '⚽ ¡GOL! Remate a bocajarro imparable'
        ],
        'borde_area': [
            '⚽ ¡GOL! Disparo desde el borde del área que bate al portero',
            '⚽ ¡GOL! Remate desde la frontal colocado a la escuadra',
            '⚽ ¡GOL! Tiro potente desde fuera del área'
        ],
        'fuera_area': [
            '⚽ ¡GOLAZO! Cañonazo desde fuera del área',
            '⚽ ¡GOL! Disparo lejano que sorprende al guardameta',
            '⚽ ¡GOL! Bombazo desde 25 metros'
        ],
        'corner': [
            '⚽ ¡GOL! Cabezazo tras el saque de esquina',
            '⚽ ¡GOL! Corner aprovechado al primer toque',
            '⚽ ¡GOL! Remate tras el córner que se cuela'
        ],
        'tiro_libre': [
            '⚽ ¡GOL DE FALTA! Tiro libre directo magistral',
            '⚽ ¡GOLAZO! Falta directa por toda la escuadra',
            '⚽ ¡GOL! Tiro libre perfecto que supera la barrera'
        ],
        'contragolpe': [
            '⚽ ¡GOL! Contraataque letal que termina en gol',
            '⚽ ¡GOL! Contragolpe fulminante',
            '⚽ ¡GOL! Robo y contra que finaliza en la red'
        ],
        'rechace': [
            '⚽ ¡GOL! Aprovecha el rechace y no falla',
            '⚽ ¡GOL! Remate tras el rebote del portero',
            '⚽ ¡GOL! Balón suelto en el área que empuja a la red'
        ],
        'cabezazo': [
            '⚽ ¡GOL! Cabezazo imparable tras el centro',
            '⚽ ¡GOL! Remate de cabeza perfecto',
            '⚽ ¡GOL! Cabeceazo en el segundo palo'
        ]
    };

    const opciones = descripciones[tipoJugada] || descripciones['dentro_area'];
    return opciones[Math.floor(Math.random() * opciones.length)];
}

/**
 * Genera descripción de ocasión fallada
 */
function generarDescripcionOcasionFallada(tipoJugada) {
    const descripciones = {
        'penalti': [
            '❌ ¡PENALTI FALLADO! El portero adivina la dirección',
            '❌ Penalti desperdiciado, se va fuera',
            '❌ ¡AL PALO! El penalti se estrella en el poste'
        ],
        'uno_vs_uno': [
            '💨 ¡OCASIÓN CLARÍSIMA! El portero salva con una gran parada',
            '💨 Mano a mano desperdiciado, tiro desviado',
            '💨 ¡QUÉ FALLO! Solo ante el portero y la envía fuera'
        ],
        'dentro_area': [
            '💨 Ocasión clara en el área que se marcha desviada',
            '💨 Remate a bocajarro que despeja el portero',
            '💨 ¡AL PALO! El balón se estrella en el poste'
        ],
        'borde_area': [
            '💨 Disparo desde la frontal que se va alto',
            '💨 Tiro potente que detiene el portero',
            '💨 Remate desde el borde que sale desviado'
        ],
        'fuera_area': [
            '💨 Disparo lejano que se va por encima',
            '💨 Cañonazo desde fuera que atrapa el portero',
            '💨 Tiro de larga distancia que sale desviado'
        ],
        'corner': [
            '💨 Corner peligroso que despeja la defensa',
            '💨 Remate de cabeza tras corner que se va fuera',
            '💨 Corner que nadie logra rematar'
        ],
        'tiro_libre': [
            '💨 Falta directa que atrapa el portero',
            '💨 Tiro libre que se va por encima de la barrera',
            '💨 Falta peligrosa que despeja el guardameta'
        ],
        'contragolpe': [
            '💨 Contraataque que no finalizan correctamente',
            '💨 Contra que frena la defensa in extremis',
            '💨 Contragolpe desperdiciado con mal pase final'
        ],
        'rechace': [
            '💨 Rechace en el área que no logran aprovechar',
            '💨 Balón suelto que despeja la defensa',
            '💨 Rebote que rematan fuera'
        ],
        'cabezazo': [
            '💨 Cabezazo que se va por encima',
            '💨 Remate de cabeza que atrapa el portero',
            '💨 Cabeceo que sale desviado'
        ]
    };

    const opciones = descripciones[tipoJugada] || descripciones['dentro_area'];
    return opciones[Math.floor(Math.random() * opciones.length)];
}

// Funciones para generar descripciones aleatorias (legacy - mantener para compatibilidad)
function generarDescripcionGol() {
    const descripciones = [
        `¡GOL! Remate potente desde fuera del área que bate al portero`,
        `¡GOL! Cabezazo imparable tras un centro preciso desde la banda`,
        `¡GOL! Disparo cruzado que se cuela por la escuadra`,
        `¡GOL! Penalti convertido con categoría`,
        `¡GOL! Contraataque fulminante que termina en gol`,
        `¡GOL! Gran jugada colectiva que termina en la red`,
        `¡GOL! Aprovecha el error defensivo y no perdona`,
        `¡GOL! Tiro libre directo que se mete junto al poste`,
        `¡GOL! Remate de primera que supera al guardameta`,
        `¡GOL! Definición perfecta mano a mano con el portero`,
        `¡GOL! Vaselina magistral sobre el portero adelantado`,
        `¡GOL! Rechace en el área que remata a la red`,
        `¡GOL! De volea desde el borde del área`,
        `¡GOL! Cabalgada individual que termina en gol`,
        `¡GOL! Finaliza una jugada de estrategia perfecta`
    ];
    return descripciones[Math.floor(Math.random() * descripciones.length)];
}

function generarDescripcionTiro() {
    const descripciones = [
        `Disparo potente que se va por encima del travesaño`,
        `Gran intervención del portero para detener el balón`,
        `¡Al palo! El balón se estrella en el poste`,
        `Remate desde la frontal que se va desviado`,
        `El portero vuela para desviar el disparo a córner`,
        `Tiro cruzado que pasa rozando el palo`,
        `Ocasión clara que despeja la defensa in extremis`,
        `Remate de cabeza que se va fuera por poco`,
        `Disparo a bocajarro que detiene milagrosamente el portero`,
        `Tiro desde fuera del área que sale alto`,
        `Centro peligroso que nadie logra rematar`,
        `Mano a mano que salva espectacularmente el guardameta`
    ];
    return descripciones[Math.floor(Math.random() * descripciones.length)];
}

function generarDescripcionFalta() {
    const descripciones = [
        `Falta peligrosa en la frontal del área`,
        `Entrada fuerte que el árbitro no perdona`,
        `Mano que sanciona el colegiado`,
        `Falta táctica para cortar el contraataque`,
        `Toque mínimo que el árbitro interpreta como falta`,
        `Juego brusco sancionado con falta`,
        `Pisotón involuntario que es señalado`,
        `Carga ilegal en disputa aérea`
    ];
    return descripciones[Math.floor(Math.random() * descripciones.length)];
}

// Asociar función al botón de simular
document.addEventListener('DOMContentLoaded', function() {
    const simularBtn = document.getElementById('simular-btn');
    if (simularBtn) {
        simularBtn.addEventListener('click', simularPartido);
    } else {
        console.error("No se encontró el botón de simulación");
    }

    // Manejador para el botón "Ver Cómo se Calculó"
    const procesoBtn = document.getElementById('proceso-btn');
    if (procesoBtn) {
        procesoBtn.addEventListener('click', function() {
            if (currentResults) {
                // Enviar datos al servidor para mostrar el proceso
                fetch('/como-funciona', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(currentResults)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Abrir la página del proceso en una nueva pestaña
                        window.open('/proceso-calculo', '_blank');
                    } else {
                        alert('Error al cargar el proceso de cálculo');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error al cargar el proceso de cálculo');
                });
            } else {
                alert('No hay resultados de predicción disponibles. Por favor, realiza un cálculo primero.');
            }
        });
    }
});

// Clase para el modelo de Regresión Logística
class LogisticRegressionModel {
    constructor() {
        // Coeficientes del modelo (simulados)
        this.coefficients = {
            goalsScored: 0.65,
            goalsConceded: -0.55,
            possession: 0.40,
            shotsOnTarget: 0.45,
            passingAccuracy: 0.35,
            fouls: -0.15,
            corners: 0.25,
            yellowCards: -0.10,
            redCards: -0.30
        };
    }
    
    predict(stats1, stats2) {
        // Calcular puntuación para cada equipo
        let score1 = 0;
        let score2 = 0;
        
        for (const [stat, coef] of Object.entries(this.coefficients)) {
            // Normalizar estadísticas porcentuales
            if (stat === 'possession' || stat === 'passingAccuracy') {
                score1 += (stats1[stat] / 100) * coef;
                score2 += (stats2[stat] / 100) * coef;
            } else {
                score1 += stats1[stat] * coef;
                score2 += stats2[stat] * coef;
            }
        }
        
        // Calcular probabilidades con función logística
        const diff = score1 - score2;
        const team1Win = 100 / (1 + Math.exp(-diff * 1.5));
        const team2Win = 100 / (1 + Math.exp(diff * 1.5));
        
        // Ajustar para que sumen 100% con la probabilidad de empate
        const total = team1Win + team2Win;
        const normalizedTeam1Win = (team1Win / total) * 85; // Dejamos 15% para empate
        const normalizedTeam2Win = (team2Win / total) * 85;
        const draw = 100 - normalizedTeam1Win - normalizedTeam2Win;
        
        return {
            team1Win: normalizedTeam1Win,
            team2Win: normalizedTeam2Win,
            draw: draw
        };
    }
}

// Clase para el modelo XGBoost
class XGBoostModel {
    constructor() {
        // Simulación de árboles de decisión
        this.trees = [
            {
                feature: 'goalsScored',
                threshold: 2.0,
                weight: 0.8,
                leftNode: { value: -0.3 },
                rightNode: { value: 0.5 }
            },
            {
                feature: 'goalsConceded',
                threshold: 1.0,
                weight: 0.7,
                leftNode: { value: 0.4 },
                rightNode: { value: -0.2 }
            },
            {
                feature: 'possession',
                threshold: 60,
                weight: 0.5,
                leftNode: { value: -0.1 },
                rightNode: { value: 0.3 }
            },
            {
                feature: 'shotsOnTarget',
                threshold: 5.5,
                weight: 0.6,
                leftNode: { value: -0.2 },
                rightNode: { value: 0.4 }
            },
            {
                feature: 'passingAccuracy',
                threshold: 85,
                weight: 0.4,
                leftNode: { value: -0.1 },
                rightNode: { value: 0.2 }
            }
        ];
    }
    
    predict(stats1, stats2) {
        // Preparar características combinadas
        const features = {
            goalsScored: (stats1.goalsScored - stats2.goalsScored) / 5,
            goalsConceded: (stats2.goalsConceded - stats1.goalsConceded) / 5,
            possession: (stats1.possession - stats2.possession) / 100,
            shotsOnTarget: (stats1.shotsOnTarget - stats2.shotsOnTarget) / 5,
            passingAccuracy: (stats1.passingAccuracy - stats2.passingAccuracy) / 100,
            combinedAttack: ((stats1.shotsOnTarget + stats1.corners) - (stats2.shotsOnTarget + stats2.corners)) / 5,
            discipline: ((stats2.yellowCards + stats2.redCards * 3) - (stats1.yellowCards + stats1.redCards * 3)) / 5
        };
        
        // Calcular puntuación base
        let score = 0;
        
        // Aplicar cada árbol
        for (const tree of this.trees) {
            const featureValue = features[tree.feature] || 0;
            if (featureValue <= tree.threshold) {
                score += tree.leftNode.value * tree.weight;
            } else {
                score += tree.rightNode.value * tree.weight;
            }
        }
        
        // Convertir puntuación a probabilidades
        const team1Win = 100 / (1 + Math.exp(-score * 2));
        const team2Win = 100 - team1Win;
        
        // Ajustar para incluir empate
        const adjustedTeam1Win = team1Win * 0.85;
        const adjustedTeam2Win = team2Win * 0.85;
        const draw = 100 - adjustedTeam1Win - adjustedTeam2Win;
        
        return {
            team1Win: adjustedTeam1Win,
            team2Win: adjustedTeam2Win,
            draw: draw
        };
    }
}

// Función para determinar el modelo más confiable según el escenario
function determineReliableModel(stats1, stats2, poissonProb, logisticProb, xgboostProb) {
    // Detectar escenarios específicos
    const isHighScoring = stats1.goalsScored > 2.5 && stats2.goalsScored > 2.5;
    const isLowScoring = stats1.goalsScored < 1.5 && stats2.goalsScored < 1.5;
    const isBalanced = Math.abs(stats1.goalsScored - stats2.goalsScored) < 0.5;
    const isUnbalanced = Math.abs(stats1.goalsScored - stats2.goalsScored) > 1.5;
    
    let reliableModel = "Poisson";
    let scenario = "Estándar";
    
    // Determinar escenario y modelo más confiable
    if (isHighScoring) {
        scenario = "Equipos de alto rendimiento ofensivo";
        reliableModel = "XGBoost";
    } else if (isLowScoring) {
        scenario = "Equipos defensivos";
        reliableModel = "Regresión Logística";
    } else if (isBalanced) {
        scenario = "Equipos equilibrados";
        reliableModel = "Consenso";
    } else if (isUnbalanced) {
        scenario = "Diferencia significativa entre equipos";
        reliableModel = "Poisson";
    }
    
    // Calcular probabilidades de consenso (promedio ponderado)
    const consensusProb = {
        team1Win: (poissonProb.team1Win * 0.4 + logisticProb.team1Win * 0.3 + xgboostProb.team1Win * 0.3),
        draw: (poissonProb.draw * 0.4 + logisticProb.draw * 0.3 + xgboostProb.draw * 0.3),
        team2Win: (poissonProb.team2Win * 0.4 + logisticProb.team2Win * 0.3 + xgboostProb.team2Win * 0.3)
    };
    
    return {
        scenario,
        reliableModel,
        consensusProb
    };
}

// Función para crear gráfico comparativo de modelos
function createModelComparisonChart(team1, team2, poissonProb, logisticProb, xgboostProb) {
    // Destruir gráfico anterior si existe
    if (chart) {
        chart.destroy();
    }
    
    const ctx = document.getElementById('stats-chart').getContext('2d');
    
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [`Victoria ${team1}`, 'Empate', `Victoria ${team2}`],
            datasets: [
                {
                    label: 'Poisson',
                    data: [poissonProb.team1Win, poissonProb.draw, poissonProb.team2Win],
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Regresión Logística',
                    data: [logisticProb.team1Win, logisticProb.draw, logisticProb.team2Win],
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                },
                {
                    label: 'XGBoost',
                    data: [xgboostProb.team1Win, xgboostProb.draw, xgboostProb.team2Win],
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#fff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#fff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#fff'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(2) + '%';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Función para actualizar el modelo recomendado en la interfaz
function updateRecommendedModel() {
    if (!currentResults || !currentResults.logisticRegression || !currentResults.xgboost) {
        return; // No hay resultados de los tres modelos todavía
    }
    
    const team1 = currentResults.team1.name;
    const team2 = currentResults.team2.name;
    const favoriteTeam = currentResults.favoriteTeam;
    
    // Obtener probabilidades para el equipo favorito de cada modelo
    let poissonProb, logisticProb, xgboostProb;
    
    if (favoriteTeam === team1) {
        poissonProb = parseFloat(currentResults.team1.winProbability);
        logisticProb = parseFloat(currentResults.logisticRegression.team1Win);
        xgboostProb = parseFloat(currentResults.xgboost.team1Win);
    } else if (favoriteTeam === team2) {
        poissonProb = parseFloat(currentResults.team2.winProbability);
        logisticProb = parseFloat(currentResults.logisticRegression.team2Win);
        xgboostProb = parseFloat(currentResults.xgboost.team2Win);
    } else {
        // Si el favorito es empate
        poissonProb = parseFloat(currentResults.drawProbability);
        logisticProb = parseFloat(currentResults.logisticRegression.draw);
        xgboostProb = parseFloat(currentResults.xgboost.draw);
    }
    
    // Determinar el modelo con la probabilidad más alta
    let bestModel = "Poisson";
    let highestProb = poissonProb;
    
    if (logisticProb > highestProb) {
        bestModel = "Regresión Logística";
        highestProb = logisticProb;
    }
    
    if (xgboostProb > highestProb) {
        bestModel = "XGBoost";
        highestProb = xgboostProb;
    }
    
    // Actualizar el elemento HTML que muestra el modelo recomendado
    const recommendedModelElement = document.getElementById('recommended-model');
    if (recommendedModelElement) {
        recommendedModelElement.textContent = `Modelo recomendado: ${bestModel}`;
    }
    
    // Actualizar la probabilidad de victoria con el valor más alto
    const winProbabilityElement = document.getElementById('win-probability');
    if (winProbabilityElement) {
        winProbabilityElement.textContent = `${highestProb.toFixed(2)}%`;
    }
}


// ==========================================
// MÓDULO DE MACHINE LEARNING PARA TÁCTICAS
// ==========================================

// Dataset ficticio para entrenamiento de modelos
let ml_dataset = [];
let ml_model = null;
let ml_modelType = '';
let ml_accuracy = 0;
let currentTeam1 = null;
let currentTeam2 = null;

// Función para generar dataset ficticio
function generarDatasetTacticas(numRegistros = 500) {
    const dataset = [];
    const tacticas = [
        'Mantener 4-3-3 ofensivo',
        'Cambiar a 4-4-2 defensivo',
        'Presión alta y líneas adelantadas',
        'Jugar al contragolpe',
        'Bajar ritmo y mantener posesión',
        'Atacar por bandas',
        'Defensa con cinco jugadores'
    ];
    
    // Generar registros aleatorios
    for (let i = 0; i < numRegistros; i++) {
        // Generar estadísticas aleatorias realistas
        const goalsScored = Math.random() * 3 + 0.5; // 0.5 a 3.5
        const goalsConceded = Math.random() * 2.5 + 0.2; // 0.2 a 2.7
        const possession = Math.random() * 40 + 30; // 30 a 70
        const shotsOnTarget = Math.random() * 8 + 2; // 2 a 10
        const passingAccuracy = Math.random() * 20 + 70; // 70 a 90
        const fouls = Math.random() * 10 + 5; // 5 a 15
        const corners = Math.random() * 8 + 2; // 2 a 10
        const yellowCards = Math.random() * 3 + 0.5; // 0.5 a 3.5
        const redCards = Math.random() * 0.3; // 0 a 0.3
        
        // Asignar táctica basada en patrones realistas
        let tacticaIndex;
        
        // Equipos ofensivos con buena posesión
        if (goalsScored > 2.5 && possession > 60 && passingAccuracy > 85) {
            tacticaIndex = Math.random() > 0.5 ? 0 : 4; // 4-3-3 ofensivo o mantener posesión
        }
        // Equipos defensivos
        else if (goalsConceded < 1 && shotsOnTarget < 5) {
            tacticaIndex = Math.random() > 0.5 ? 1 : 6; // 4-4-2 defensivo o defensa con 5
        }
        // Equipos de presión
        else if (fouls > 12 && yellowCards > 2) {
            tacticaIndex = 2; // Presión alta
        }
        // Equipos de contragolpe
        else if (possession < 45 && goalsScored > 1.5) {
            tacticaIndex = 3; // Contragolpe
        }
        // Equipos de bandas
        else if (corners > 6) {
            tacticaIndex = 5; // Atacar por bandas
        }
        else {
            // Asignar aleatoriamente para el resto
            tacticaIndex = Math.floor(Math.random() * tacticas.length);
        }
        
        // Añadir registro al dataset
        dataset.push({
            features: [goalsScored, goalsConceded, possession, shotsOnTarget, 
                      passingAccuracy, fouls, corners, yellowCards, redCards],
            tactica: tacticas[tacticaIndex]
        });
    }
    
    return dataset;
}

// Función para normalizar datos
function normalizarDatos(datos) {
    // Calcular min y max para cada característica
    const numFeatures = datos[0].features.length;
    const mins = Array(numFeatures).fill(Infinity);
    const maxs = Array(numFeatures).fill(-Infinity);
    
    // Encontrar min y max
    for (const dato of datos) {
        for (let i = 0; i < numFeatures; i++) {
            mins[i] = Math.min(mins[i], dato.features[i]);
            maxs[i] = Math.max(maxs[i], dato.features[i]);
        }
    }
    
    // Normalizar datos
    const datosNormalizados = datos.map(dato => {
        const featuresNormalizados = dato.features.map((val, i) => {
            // Evitar división por cero
            return maxs[i] === mins[i] ? 0.5 : (val - mins[i]) / (maxs[i] - mins[i]);
        });
        
        return {
            features: featuresNormalizados,
            tactica: dato.tactica
        };
    });
    
    return {
        datosNormalizados,
        mins,
        maxs
    };
}

// ==========================================
// MONTE CARLO SIMULATION
// ==========================================

/**
 * Ejecuta simulación Monte Carlo y muestra resultados
 */
async function runMonteCarloSimulation() {
    const modal = new bootstrap.Modal(document.getElementById('montecarlo-modal'));
    modal.show();

    // Mostrar loading y resetear valores
    document.getElementById('mc-loading').style.display = 'block';
    document.getElementById('mc-results').style.display = 'none';

    // Resetear contador y barra de progreso
    document.getElementById('mc-progress-count').textContent = '0';
    document.getElementById('mc-progress-bar').style.width = '0%';
    document.getElementById('mc-progress-percentage').textContent = '0%';
    document.getElementById('mc-status-text').textContent = 'Inicializando simulación...';

    // Animar contador de simulaciones
    animateSimulationCount();

    try {
        // Obtener datos de los equipos del formulario
        const team1Data = {
            name: document.getElementById('team1').value,
            goalsScored: parseFloat(document.getElementById('goalsScored1').value),
            goalsConceded: parseFloat(document.getElementById('goalsConceded1').value),
            possession: parseFloat(document.getElementById('possession1').value),
            shotsOnTarget: parseFloat(document.getElementById('shotsOnTarget1').value),
            passingAccuracy: parseFloat(document.getElementById('passingAccuracy1').value),
            fouls: parseFloat(document.getElementById('fouls1').value),
            corners: parseFloat(document.getElementById('corners1').value),
            yellowCards: parseFloat(document.getElementById('yellowCards1').value),
            redCards: parseFloat(document.getElementById('redCards1').value)
        };

        const team2Data = {
            name: document.getElementById('team2').value,
            goalsScored: parseFloat(document.getElementById('goalsScored2').value),
            goalsConceded: parseFloat(document.getElementById('goalsConceded2').value),
            possession: parseFloat(document.getElementById('possession2').value),
            shotsOnTarget: parseFloat(document.getElementById('shotsOnTarget2').value),
            passingAccuracy: parseFloat(document.getElementById('passingAccuracy2').value),
            fouls: parseFloat(document.getElementById('fouls2').value),
            corners: parseFloat(document.getElementById('corners2').value),
            yellowCards: parseFloat(document.getElementById('yellowCards2').value),
            redCards: parseFloat(document.getElementById('redCards2').value)
        };

        // Llamar al backend y esperar respuesta
        const responsePromise = fetch('/monte_carlo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                team1: team1Data,
                team2: team2Data,
                simulations: 1000000
            })
        });

        // Esperar mínimo 3.5 segundos para que se vean las animaciones
        const minDelay = new Promise(resolve => setTimeout(resolve, 3500));

        // Esperar ambos: la respuesta del servidor Y el delay mínimo
        const [response] = await Promise.all([responsePromise, minDelay]);
        const data = await response.json();

        if (data.success) {
            // Ocultar loading
            document.getElementById('mc-loading').style.display = 'none';
            document.getElementById('mc-results').style.display = 'block';

            // Poblar resultados
            populateMonteCarloResults(data, team1Data.name, team2Data.name);
        } else {
            throw new Error(data.error || 'Error en la simulación');
        }

    } catch (error) {
        console.error('Error en Monte Carlo:', error);
        document.getElementById('mc-loading').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error al ejecutar la simulación: ${error.message}
            </div>
        `;
    }
}

/**
 * Anima el contador de simulaciones durante la carga con barra de progreso
 */
function animateSimulationCount() {
    let count = 0;
    const target = 1000000;
    const duration = 3500; // 3.5 segundos para dar tiempo a ver la animación
    const steps = 100;
    const increment = target / steps;
    const interval = duration / steps;

    // Mensajes de estado que van cambiando
    const statusMessages = [
        'Inicializando simulación...',
        'Generando distribuciones de Poisson...',
        'Calculando lambdas de goles...',
        'Ejecutando simulaciones...',
        'Analizando marcadores...',
        'Calculando probabilidades BTTS...',
        'Procesando resultados...',
        'Finalizando análisis...'
    ];

    let messageIndex = 0;
    const messageInterval = duration / statusMessages.length;

    // Actualizar mensaje de estado
    const messageTimer = setInterval(() => {
        if (messageIndex < statusMessages.length) {
            document.getElementById('mc-status-text').textContent = statusMessages[messageIndex];
            messageIndex++;
        }
    }, messageInterval);

    // Animación de contador y barra de progreso
    const counter = setInterval(() => {
        count += increment;
        if (count >= target) {
            count = target;
            clearInterval(counter);
            clearInterval(messageTimer);
            document.getElementById('mc-status-text').textContent = '¡Simulación completada!';
        }

        // Actualizar contador con formato de miles
        const displayCount = Math.floor(count).toLocaleString('es-ES');
        document.getElementById('mc-progress-count').textContent = displayCount;

        // Actualizar barra de progreso
        const percentage = (count / target) * 100;
        document.getElementById('mc-progress-bar').style.width = percentage + '%';
        document.getElementById('mc-progress-percentage').textContent = Math.floor(percentage) + '%';
    }, interval);
}

/**
 * Genera el contenido del escenario más probable
 */
function populateScenarioMasProbable(data, bttsProb, team1Name, team2Name) {
    const verdictDiv = document.getElementById('mc-scenario-verdict');
    const detailsDiv = document.getElementById('mc-scenario-details');

    // Calcular número de simulaciones con BTTS
    const totalSimulations = data.simulations || 1000000;
    const bttsCount = Math.round((bttsProb / 100) * totalSimulations);
    const noBttsCount = totalSimulations - bttsCount;

    // Actualizar contadores
    document.getElementById('mc-btts-count').textContent = bttsCount.toLocaleString('es-ES');
    document.getElementById('mc-no-btts-count').textContent = noBttsCount.toLocaleString('es-ES');

    // Determinar veredicto
    const isBttsMoreLikely = bttsProb >= 50;
    const confidence = isBttsMoreLikely ? bttsProb : (100 - bttsProb);

    // Generar veredicto visual
    if (isBttsMoreLikely) {
        verdictDiv.innerHTML = `
            <div class="scenario-verdict-icon">✅</div>
            <div class="scenario-verdict-title btts-yes">
                AMBOS EQUIPOS MARCARÁN
            </div>
            <p style="color: var(--text-secondary); font-size: 1.1rem;">
                Probabilidad: ${bttsProb.toFixed(2)}%
            </p>
        `;
    } else {
        verdictDiv.innerHTML = `
            <div class="scenario-verdict-icon">❌</div>
            <div class="scenario-verdict-title btts-no">
                AL MENOS UN EQUIPO NO MARCARÁ
            </div>
            <p style="color: var(--text-secondary); font-size: 1.1rem;">
                Probabilidad: ${(100 - bttsProb).toFixed(2)}%
            </p>
        `;
    }

    // Generar detalles del escenario
    const topScoreline = data.top_scorelines[0];
    const expectedGoalsT1 = data.goals.team1_avg;
    const expectedGoalsT2 = data.goals.team2_avg;
    const totalExpectedGoals = data.goals.total_avg;

    // Determinar tendencia de resultado
    let resultTendency = '';
    if (data.results.team1_win > data.results.team2_win && data.results.team1_win > data.results.draw) {
        resultTendency = `victoria de <span class="scenario-detail-highlight">${team1Name}</span>`;
    } else if (data.results.team2_win > data.results.team1_win && data.results.team2_win > data.results.draw) {
        resultTendency = `victoria de <span class="scenario-detail-highlight">${team2Name}</span>`;
    } else if (data.results.draw > data.results.team1_win && data.results.draw > data.results.team2_win) {
        resultTendency = `<span class="scenario-detail-highlight">empate</span>`;
    } else {
        resultTendency = 'resultado muy ajustado';
    }

    // Generar explicación detallada
    let explanation = '';

    if (isBttsMoreLikely) {
        explanation = `
            <p class="scenario-detail-text">
                📊 De las <span class="scenario-detail-highlight">${totalSimulations.toLocaleString('es-ES')}</span> simulaciones realizadas,
                <span class="scenario-detail-highlight">${bttsCount.toLocaleString('es-ES')}</span> mostraron que ambos equipos anotan al menos un gol.
            </p>
            <p class="scenario-detail-text">
                ⚽ El marcador más probable es <span class="scenario-detail-highlight">${topScoreline.score}</span>
                con una probabilidad del <span class="scenario-detail-highlight">${topScoreline.probability.toFixed(2)}%</span>.
            </p>
            <p class="scenario-detail-text">
                📈 Se espera un total de <span class="scenario-detail-highlight">${totalExpectedGoals.toFixed(2)}</span> goles
                (${team1Name}: ${expectedGoalsT1.toFixed(2)}, ${team2Name}: ${expectedGoalsT2.toFixed(2)}).
            </p>
            <p class="scenario-detail-text">
                🏆 La tendencia apunta hacia ${resultTendency}.
            </p>
        `;
    } else {
        const zeroZeroProb = data.top_scorelines.find(s => s.score === '0-0')?.probability || 0;
        const oneTeamScores = 100 - bttsProb;

        explanation = `
            <p class="scenario-detail-text">
                📊 De las <span class="scenario-detail-highlight">${totalSimulations.toLocaleString('es-ES')}</span> simulaciones realizadas,
                <span class="scenario-detail-highlight">${noBttsCount.toLocaleString('es-ES')}</span> mostraron que al menos un equipo NO anota.
            </p>
            <p class="scenario-detail-text">
                ⚽ El marcador más probable es <span class="scenario-detail-highlight">${topScoreline.score}</span>
                con una probabilidad del <span class="scenario-detail-highlight">${topScoreline.probability.toFixed(2)}%</span>.
            </p>
            <p class="scenario-detail-text">
                📈 Se espera un total de <span class="scenario-detail-highlight">${totalExpectedGoals.toFixed(2)}</span> goles,
                indicando un partido ${totalExpectedGoals < 2 ? 'cerrado' : 'con pocos goles para uno de los equipos'}.
            </p>
            <p class="scenario-detail-text">
                🏆 La tendencia apunta hacia ${resultTendency}.
            </p>
        `;
    }

    detailsDiv.innerHTML = explanation;
}

/**
 * Puebla los resultados de Monte Carlo en el modal
 */
function populateMonteCarloResults(data, team1Name, team2Name) {
    // BTTS
    const bttsProb = data.btts.probability;
    document.getElementById('mc-btts-prob').textContent = bttsProb.toFixed(2);
    document.getElementById('mc-btts-ci-lower').textContent = data.btts.confidence_interval.lower.toFixed(2);
    document.getElementById('mc-btts-ci-upper').textContent = data.btts.confidence_interval.upper.toFixed(2);

    // Calcular escenario más probable
    populateScenarioMasProbable(data, bttsProb, team1Name, team2Name);

    // Resultados
    document.getElementById('mc-team1-win').textContent = data.results.team1_win.toFixed(2) + '%';
    document.getElementById('mc-draw').textContent = data.results.draw.toFixed(2) + '%';
    document.getElementById('mc-team2-win').textContent = data.results.team2_win.toFixed(2) + '%';

    // Goles esperados
    document.getElementById('mc-team1-name').textContent = team1Name;
    document.getElementById('mc-team2-name').textContent = team2Name;
    document.getElementById('mc-team1-goals').textContent = data.goals.team1_avg.toFixed(2);
    document.getElementById('mc-team1-std').textContent = data.goals.team1_std.toFixed(2);
    document.getElementById('mc-team2-goals').textContent = data.goals.team2_avg.toFixed(2);
    document.getElementById('mc-team2-std').textContent = data.goals.team2_std.toFixed(2);
    document.getElementById('mc-total-goals').textContent = data.goals.total_avg.toFixed(2);

    // Agregar logos si están disponibles
    const mcTeam1Logo = document.getElementById('mc-team1-logo');
    const mcTeam2Logo = document.getElementById('mc-team2-logo');

    if (currentResults.team1.logo && currentResults.team1.logo !== '') {
        mcTeam1Logo.src = currentResults.team1.logo;
        mcTeam1Logo.style.display = 'block';
    }

    if (currentResults.team2.logo && currentResults.team2.logo !== '') {
        mcTeam2Logo.src = currentResults.team2.logo;
        mcTeam2Logo.style.display = 'block';
    }

    // Over/Under
    document.getElementById('mc-over-25').textContent = data.over_under.over_2_5.toFixed(2) + '%';
    document.getElementById('mc-under-25').textContent = data.over_under.under_2_5.toFixed(2) + '%';

    // Top marcadores
    const scoresContainer = document.getElementById('mc-top-scorelines');
    scoresContainer.innerHTML = '';
    data.top_scorelines.forEach((scoreline, index) => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'mc-scoreline-item';
        scoreItem.innerHTML = `
            <span class="mc-scoreline-rank">#${index + 1}</span>
            <span class="mc-scoreline-score">${scoreline.score}</span>
            <div class="mc-scoreline-bar">
                <div class="mc-scoreline-bar-fill" style="width: ${scoreline.probability}%"></div>
            </div>
            <span class="mc-scoreline-prob">${scoreline.probability.toFixed(2)}%</span>
        `;
        scoresContainer.appendChild(scoreItem);
    });

    // Distribución de goles
    const distContainer = document.getElementById('mc-goals-distribution');
    distContainer.innerHTML = '';
    const maxProb = Math.max(...data.total_goals_distribution.map(d => d.probability));
    data.total_goals_distribution.forEach(dist => {
        const distItem = document.createElement('div');
        distItem.className = 'mc-dist-item';
        const barWidth = (dist.probability / maxProb) * 100;
        distItem.innerHTML = `
            <span class="mc-dist-label">${dist.goals} goles</span>
            <div class="mc-dist-bar">
                <div class="mc-dist-bar-fill" style="width: ${barWidth}%"></div>
            </div>
            <span class="mc-dist-prob">${dist.probability.toFixed(2)}%</span>
        `;
        distContainer.appendChild(distItem);
    });

    // Volatilidad
    document.getElementById('mc-vol-icon').textContent = data.volatility.icon;
    document.getElementById('mc-vol-label').textContent = data.volatility.label;
    document.getElementById('mc-vol-desc').textContent = data.volatility.description;
    document.getElementById('mc-vol-std').textContent = data.volatility.value.toFixed(2);
    document.getElementById('mc-vol-cv').textContent = data.volatility.coefficient.toFixed(2);
}

// Event listener para el botón de Monte Carlo
document.addEventListener('DOMContentLoaded', function() {
    const mcButton = document.getElementById('montecarlo-btn');
    if (mcButton) {
        mcButton.addEventListener('click', runMonteCarloSimulation);
    }
});

/* ============================================
   SISTEMA DE CONFIGURACIÓN DE SIMULACIÓN
   ============================================ */

// Variable global para almacenar la configuración
let configuracionSimulacion = null;

// Función para validar selecciones de fortalezas (máximo 2)
function validarFortalezas(teamId) {
    const checkboxes = document.querySelectorAll(`#fortalezas-team${teamId} input[type="checkbox"]:checked`);
    if (checkboxes.length > 2) {
        // Desmarcar el último seleccionado
        checkboxes[checkboxes.length - 1].checked = false;
        mostrarAlertaConfig('Máximo 2 fortalezas por equipo', 'warning');
    }
}

// Función para validar selecciones de debilidades (1-2)
function validarDebilidades(teamId) {
    const checkboxes = document.querySelectorAll(`#debilidades-team${teamId} input[type="checkbox"]:checked`);
    if (checkboxes.length > 2) {
        // Desmarcar el último seleccionado
        checkboxes[checkboxes.length - 1].checked = false;
        mostrarAlertaConfig('Máximo 2 debilidades por equipo', 'warning');
    }
}

// Función para mostrar alertas en el modal de configuración
function mostrarAlertaConfig(mensaje, tipo = 'info') {
    const alertHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert" style="margin-bottom: 1rem;">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    const modalBody = document.querySelector('#config-simulacion-modal .modal-body');
    const existingAlert = modalBody.querySelector('.alert');
    if (existingAlert) existingAlert.remove();
    modalBody.insertAdjacentHTML('afterbegin', alertHTML);
    setTimeout(() => {
        const alert = modalBody.querySelector('.alert');
        if (alert) alert.remove();
    }, 3000);
}

// Función para recolectar la configuración del formulario
function recolectarConfiguracion() {
    // Validar que haya al menos una debilidad por equipo
    const debilidades1 = document.querySelectorAll('#debilidades-team1 input[type="checkbox"]:checked');
    const debilidades2 = document.querySelectorAll('#debilidades-team2 input[type="checkbox"]:checked');

    if (debilidades1.length === 0 || debilidades2.length === 0) {
        mostrarAlertaConfig('Cada equipo debe tener al menos 1 debilidad', 'danger');
        return null;
    }

    const config = {
        team1: {
            estilo: document.getElementById('estilo-team1').value,
            fortalezas: Array.from(document.querySelectorAll('#fortalezas-team1 input[type="checkbox"]:checked'))
                .map(cb => cb.value),
            debilidades: Array.from(debilidades1).map(cb => cb.value),
            mentalidad: document.getElementById('mentalidad-team1').value
        },
        team2: {
            estilo: document.getElementById('estilo-team2').value,
            fortalezas: Array.from(document.querySelectorAll('#fortalezas-team2 input[type="checkbox"]:checked'))
                .map(cb => cb.value),
            debilidades: Array.from(debilidades2).map(cb => cb.value),
            mentalidad: document.getElementById('mentalidad-team2').value
        },
        condiciones: {
            clima: document.getElementById('clima').value,
            campo: document.getElementById('campo').value,
            presion: document.getElementById('presion').value,
            importancia: document.getElementById('importancia').value
        }
    };

    return config;
}

// Función para resetear el formulario de configuración
function resetearConfiguracion() {
    // Resetear estilos de juego
    document.getElementById('estilo-team1').selectedIndex = 0;
    document.getElementById('estilo-team2').selectedIndex = 0;

    // Resetear mentalidad
    document.getElementById('mentalidad-team1').selectedIndex = 0;
    document.getElementById('mentalidad-team2').selectedIndex = 0;

    // Desmarcar todas las fortalezas y debilidades
    document.querySelectorAll('#fortalezas-team1 input[type="checkbox"], #debilidades-team1 input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('#fortalezas-team2 input[type="checkbox"], #debilidades-team2 input[type="checkbox"]').forEach(cb => cb.checked = false);

    // Resetear condiciones del partido
    document.getElementById('clima').selectedIndex = 0;
    document.getElementById('campo').selectedIndex = 0;
    document.getElementById('presion').selectedIndex = 0;
    document.getElementById('importancia').selectedIndex = 0;
}

// Función para aplicar modificadores basados en la configuración
function aplicarModificadoresConfiguracion(config, presion, xg, fatiga, tipoJugada, minuto, diferencia, tactica) {
    let modificadores = {
        presion: 1.0,
        xg: 1.0,
        fatiga: 1.0,
        posesion: 1.0,
        contraataques: 1.0,
        defensivo: 1.0,
        ofensivo: 1.0
    };

    // ========== ESTILO DE JUEGO ==========
    const estiloModificadores = {
        'tiki-taka': { posesion: 1.30, contraataques: 0.50, ofensivo: 1.15, fatiga: 0.95 },
        'gegenpressing': { presion: 1.35, fatiga: 1.30, ofensivo: 1.25, xg: 1.10 },
        'catenaccio': { defensivo: 1.40, contraataques: 1.30, posesion: 0.70, ofensivo: 0.75 },
        'juego-directo': { contraataques: 1.40, xg: 0.90, presion: 1.15, posesion: 0.85 },
        'total-football': { ofensivo: 1.20, presion: 1.20, posesion: 1.15, fatiga: 1.20 },
        'contraataque': { contraataques: 1.50, defensivo: 1.25, presion: 0.70, posesion: 0.75 },
        'equilibrado': { /* Sin modificadores especiales */ }
    };

    if (estiloModificadores[config.estilo]) {
        Object.assign(modificadores, estiloModificadores[config.estilo]);
    }

    // ========== FORTALEZAS ==========
    config.fortalezas.forEach(fortaleza => {
        switch(fortaleza) {
            case 'jugadas-estrategia':
                if (['corner', 'tiro_libre', 'penalti'].includes(tipoJugada)) {
                    modificadores.xg *= 1.35;
                }
                break;
            case 'delantero-letal':
                if (['dentro_area', 'uno_vs_uno', 'cabezazo'].includes(tipoJugada)) {
                    modificadores.xg *= 1.30;
                }
                break;
            case 'portero-clase-mundial':
                modificadores.defensivo *= 1.35;
                break;
            case 'defensa-solida':
                modificadores.defensivo *= 1.25;
                if (tipoJugada === 'contragolpe') modificadores.xg *= 0.70;
                break;
            case 'mediocampo-creativo':
                modificadores.posesion *= 1.20;
                modificadores.presion *= 1.15;
                break;
            case 'velocidad-punta':
                if (tipoJugada === 'contragolpe') modificadores.xg *= 1.40;
                modificadores.contraataques *= 1.30;
                break;
            case 'fisico-imponente':
                modificadores.fatiga *= 0.80;
                if (tipoJugada === 'cabezazo') modificadores.xg *= 1.25;
                break;
        }
    });

    // ========== DEBILIDADES ==========
    config.debilidades.forEach(debilidad => {
        switch(debilidad) {
            case 'defensa-vulnerable':
                if (tipoJugada === 'contragolpe') modificadores.xg *= 1.35;
                modificadores.defensivo *= 0.75;
                break;
            case 'mal-finalizador':
                if (['dentro_area', 'borde_area', 'fuera_area'].includes(tipoJugada)) {
                    modificadores.xg *= 0.70;
                }
                break;
            case 'portero-inseguro':
                modificadores.xg *= 1.25;
                modificadores.defensivo *= 0.80;
                break;
            case 'indisciplina':
                // Más probabilidad de expulsiones (se maneja en la simulación principal)
                if (minuto > 70) modificadores.presion *= 0.85;
                break;
            case 'baja-estamina':
                if (minuto > 60) {
                    modificadores.fatiga *= 1.40;
                    modificadores.presion *= 0.80;
                }
                break;
            case 'lento-inicio':
                if (minuto <= 20) {
                    modificadores.presion *= 0.70;
                    modificadores.xg *= 0.85;
                }
                break;
            case 'panico-presion':
                if (diferencia < -1) {
                    modificadores.xg *= 0.75;
                    modificadores.presion *= 0.85;
                }
                break;
        }
    });

    // ========== MENTALIDAD ==========
    switch(config.mentalidad) {
        case 'ganar-todo-costa':
            modificadores.presion *= 1.30;
            modificadores.ofensivo *= 1.25;
            modificadores.defensivo *= 0.80;
            modificadores.fatiga *= 1.15;
            break;
        case 'buscar-victoria':
            modificadores.presion *= 1.15;
            modificadores.ofensivo *= 1.10;
            break;
        case 'no-perder':
            modificadores.defensivo *= 1.20;
            modificadores.presion *= 0.85;
            modificadores.contraataques *= 1.15;
            break;
        case 'gestionar-resultado':
            if (diferencia > 0) {
                modificadores.defensivo *= 1.25;
                modificadores.presion *= 0.75;
            }
            break;
    }

    return modificadores;
}

// Función principal para mostrar el modal de configuración antes de simular
function mostrarModalConfiguracion() {
    const modal = new bootstrap.Modal(document.getElementById('config-simulacion-modal'));
    modal.show();
}

// Event listeners para el modal de configuración
document.addEventListener('DOMContentLoaded', function() {
    // Botón de resetear configuración
    const resetBtn = document.getElementById('config-reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetearConfiguracion);
    }

    // Botón de iniciar simulación con configuración
    const simularConfigBtn = document.getElementById('config-simular-btn');
    if (simularConfigBtn) {
        simularConfigBtn.addEventListener('click', function() {
            const config = recolectarConfiguracion();
            if (config) {
                configuracionSimulacion = config;
                const modal = bootstrap.Modal.getInstance(document.getElementById('config-simulacion-modal'));
                modal.hide();

                // Ejecutar la simulación del partido con la configuración
                simularPartido();
            }
        });
    }

    // Validación de fortalezas - Team 1
    const fortalezasTeam1 = document.querySelectorAll('#fortalezas-team1 input[type="checkbox"]');
    fortalezasTeam1.forEach(cb => {
        cb.addEventListener('change', () => validarFortalezas(1));
    });

    // Validación de fortalezas - Team 2
    const fortalezasTeam2 = document.querySelectorAll('#fortalezas-team2 input[type="checkbox"]');
    fortalezasTeam2.forEach(cb => {
        cb.addEventListener('change', () => validarFortalezas(2));
    });

    // Validación de debilidades - Team 1
    const debilidadesTeam1 = document.querySelectorAll('#debilidades-team1 input[type="checkbox"]');
    debilidadesTeam1.forEach(cb => {
        cb.addEventListener('change', () => validarDebilidades(1));
    });

    // Validación de debilidades - Team 2
    const debilidadesTeam2 = document.querySelectorAll('#debilidades-team2 input[type="checkbox"]');
    debilidadesTeam2.forEach(cb => {
        cb.addEventListener('change', () => validarDebilidades(2));
    });

    // Interceptar el botón "Simular Partido" para mostrar primero el modal de configuración
    const simularBtn = document.getElementById('simular-btn');
    if (simularBtn) {
        // Remover listeners existentes y añadir el nuevo
        const newSimularBtn = simularBtn.cloneNode(true);
        simularBtn.parentNode.replaceChild(newSimularBtn, simularBtn);

        newSimularBtn.addEventListener('click', function() {
            mostrarModalConfiguracion();
        });
    }
});