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

    // Mostrar explicación de IA
    explanationBtn.addEventListener('click', showAIExplanation);
    
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
    
    // Opcional: mostrar mensaje en la terminal si está visible
    const terminal = document.getElementById('terminal-content');
    if (terminal && document.getElementById('results-section').style.display !== 'none') {
        terminal.innerHTML = '<div class="line">$ Todos los campos han sido limpiados.</div>';
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
    
    // Guardar resultados para la API
    currentResults = {
        team1: {
            name: team1,
            stats: stats1,
            lambda: lambda1,
            probScores: (probTeam1Scores * 100).toFixed(2),
            detailedCalculation: detailedCalc1
        },
        team2: {
            name: team2,
            stats: stats2,
            lambda: lambda2,
            probScores: (probTeam2Scores * 100).toFixed(2),
            detailedCalculation: detailedCalc2
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

    // Nota informativa según diferencia de modelos
    let noteText = "";
    if (diffModels < 10) {
        noteText = "Los modelos coinciden con alta precisión. Alta confianza en la predicción.";
    } else if (diffModels < 20) {
        noteText = "Los modelos muestran diferencias moderadas. Confianza media.";
    } else {
        noteText = "Los modelos difieren significativamente. Se recomienda analizar con cuidado.";
    }

    const modelNoteElem = document.getElementById('model-note');
    if (modelNoteElem) modelNoteElem.textContent = noteText;

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
        const timeoutId = setTimeout(() => controller.abort(), 30000);

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
        explanationDiv.innerHTML = '';

        // Dividir la explicación en párrafos
        const paragraphs = data.explanation.split('\n\n');
        
        // Efecto de escritura para cada párrafo
        for (const paragraph of paragraphs) {
            const p = document.createElement('p');
            explanationDiv.appendChild(p);
            
            // Escribir el texto caracter por caracter
            for (let i = 0; i < paragraph.length; i++) {
                p.textContent += paragraph[i];
                explanationDiv.scrollTop = explanationDiv.scrollHeight;
                // Velocidad más rápida para la explicación
                await new Promise(resolve => setTimeout(resolve, typingSpeed / 2));
            }
            
            // Pausa entre párrafos
            await new Promise(resolve => setTimeout(resolve, 200));
        }

    } catch (error) {
        loadingIndicator.style.display = 'none';
        explanationDiv.innerHTML = `
            <div class="alert alert-danger">
                <strong>Error al cargar la explicación</strong>
                <p>${error.message || 'Se produjo un error inesperado'}</p>
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
                        <div id="simulacion-carga" class="text-center p-4">
                            <h4 class="mb-4">Simulando partido en vivo</h4>
                            <div class="progress mb-4" style="height: 10px;">
                                <div id="barra-progreso" class="progress-bar progress-bar-striped progress-bar-animated bg-success" 
                                    role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <p id="texto-carga" class="text-muted">Preparando simulación...</p>
                        </div>
                        
                        <div id="simulacion-resultado" style="display:none;">
                            <!-- Cabecera del partido -->
                            <div class="p-3 border-bottom border-secondary">
                                <div class="text-center mb-2">
                                    <span class="text-muted">Partido simulado Hoy</span>
                                    <span class="badge bg-success ms-2">Finalizado</span>
                                </div>
                                <div class="row align-items-center text-center">
                                    <div class="col-4 text-end">
                                        <h3 id="equipo-local" class="text-info"></h3>
                                    </div>
                                    <div class="col-4">
                                        <div class="display-4 fw-bold">
                                            <span id="goles-local" class="text-info"></span>
                                            <span class="text-white">-</span>
                                            <span id="goles-visitante" class="text-danger"></span>
                                        </div>
                                    </div>
                                    <div class="col-4 text-start">
                                        <h3 id="equipo-visitante" class="text-danger"></h3>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Contenedor principal -->
                            <div class="row mx-0">
                                <!-- Estadísticas equipo local -->
                                <div class="col-md-4 p-3 border-end border-secondary">
                                    <h6 class="text-center mb-3">Estadísticas</h6>
                                    <div id="stats-local">
                                        <!-- Se llenará dinámicamente -->
                                    </div>
                                </div>
                                
                                <!-- Línea de tiempo -->
                                <div class="col-md-4 p-3">
                                    <h6 class="text-center mb-3">Momentos Clave</h6>
                                    <div id="momentos-partido" class="timeline">
                                        <!-- Los momentos se llenarán dinámicamente -->
                                    </div>
                                </div>
                                
                                <!-- Estadísticas equipo visitante -->
                                <div class="col-md-4 p-3 border-start border-secondary">
                                    <h6 class="text-center mb-3">Estadísticas</h6>
                                    <div id="stats-visitante">
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
        
        // Agregar estilos CSS para la línea de tiempo
        const estilosTimeline = document.createElement('style');
        estilosTimeline.textContent = `
            .timeline {
                position: relative;
                max-height: 400px;
                overflow-y: auto;
                padding: 0 10px;
            }
            .timeline:before {
                content: '';
                position: absolute;
                top: 0;
                bottom: 0;
                left: 50%;
                width: 2px;
                background: rgba(255,255,255,0.2);
                transform: translateX(-50%);
            }
            .momento-partido {
                position: relative;
                margin-bottom: 15px;
                padding-left: 40px;
            }
            .momento-partido .minuto {
                position: absolute;
                left: 0;
                top: 0;
                width: 30px;
                height: 30px;
                background: #343a40;
                border: 2px solid #6c757d;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 0.8rem;
            }
            .momento-partido .contenido {
                background: #2c3136;
                padding: 10px;
                border-radius: 5px;
            }
            .momento-partido.gol .minuto {
                background: #dc3545;
                border-color: #dc3545;
            }
            .momento-partido.gol .contenido {
                background: rgba(220, 53, 69, 0.2);
            }
            .stat-item {
                margin-bottom: 15px;
            }
            .stat-name {
                font-size: 0.9rem;
                color: #adb5bd;
            }
            .stat-value {
                font-weight: bold;
            }
            .stat-bar {
                height: 6px;
                background: rgba(255,255,255,0.1);
                margin-top: 5px;
                border-radius: 3px;
                overflow: hidden;
            }
            .stat-bar-fill {
                height: 100%;
                border-radius: 3px;
            }
        `;
        document.head.appendChild(estilosTimeline);
        
        // Agregar evento para nueva simulación
        document.getElementById('nueva-simulacion-btn').addEventListener('click', function() {
            simularPartido();
        });
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
    
    for (let i = 0; i <= 100; i += 4) {
        barraProgreso.style.width = i + '%';
        barraProgreso.setAttribute('aria-valuenow', i);
        
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

function simularPartidoAvanzado(team1, team2, lambda1, lambda2, stats1, stats2) {
    // Estado inicial del partido
    let goles1 = 0;
    let goles2 = 0;
    let momentos = [];
    let jugadores1Expulsados = 0;
    let jugadores2Expulsados = 0;

    // Ajuste dinámico de lambdas según el estado del partido
    let lambda1Actual = lambda1;
    let lambda2Actual = lambda2;

    // Momentum (inercia del partido) - influye en las probabilidades
    let momentum = 0; // -1 favorece team2, +1 favorece team1

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

    // Simulación minuto a minuto (90 minutos + descuento)
    const minutosTotal = 90 + Math.floor(Math.random() * 6); // 90-95 minutos

    for (let minuto = 1; minuto <= minutosTotal; minuto++) {
        // Ajustar lambdas según el estado del partido
        const diferencia = goles1 - goles2;

        // Si un equipo va ganando, tiende a jugar más defensivo
        if (diferencia > 0) {
            lambda1Actual = lambda1 * 0.85; // Equipo 1 se defiende un poco
            lambda2Actual = lambda2 * 1.2;  // Equipo 2 ataca más
            momentum -= 0.1;
        } else if (diferencia < 0) {
            lambda1Actual = lambda1 * 1.2;  // Equipo 1 ataca más
            lambda2Actual = lambda2 * 0.85; // Equipo 2 se defiende un poco
            momentum += 0.1;
        } else {
            // Partido igualado, lambdas normales
            lambda1Actual = lambda1;
            lambda2Actual = lambda2;
        }

        // Efecto de expulsiones
        if (jugadores1Expulsados > 0) {
            lambda1Actual *= (1 - jugadores1Expulsados * 0.25); // -25% por cada expulsado
            lambda2Actual *= (1 + jugadores1Expulsados * 0.15); // +15% al rival
        }
        if (jugadores2Expulsados > 0) {
            lambda2Actual *= (1 - jugadores2Expulsados * 0.25);
            lambda1Actual *= (1 + jugadores2Expulsados * 0.15);
        }

        // Fatiga en minutos finales (más goles en últimos 15 minutos)
        if (minuto > 75) {
            lambda1Actual *= 1.15;
            lambda2Actual *= 1.15;
        }

        // Probabilidad de gol por minuto (lambda / 90)
        const probGol1PorMinuto = Math.min(lambda1Actual / 90, 0.08); // Máximo 8% por minuto
        const probGol2PorMinuto = Math.min(lambda2Actual / 90, 0.08);

        // Aplicar momentum
        const probGol1Ajustada = Math.max(0, probGol1PorMinuto * (1 + momentum * 0.3));
        const probGol2Ajustada = Math.max(0, probGol2PorMinuto * (1 - momentum * 0.3));

        // Determinar si hay gol en este minuto
        const rand = Math.random();

        if (rand < probGol1Ajustada) {
            // ¡GOL DEL EQUIPO 1!
            goles1++;
            tirosPuertaLocal++;
            tirosLocal++;
            momentum = Math.min(1, momentum + 0.3);

            momentos.push({
                minuto,
                equipo: team1,
                descripcion: generarDescripcionGol(),
                tipo: 'gol'
            });
        } else if (rand < probGol1Ajustada + probGol2Ajustada) {
            // ¡GOL DEL EQUIPO 2!
            goles2++;
            tirosPuertaVisitante++;
            tirosVisitante++;
            momentum = Math.max(-1, momentum - 0.3);

            momentos.push({
                minuto,
                equipo: team2,
                descripcion: generarDescripcionGol(),
                tipo: 'gol'
            });
        }

        // Eventos adicionales en cada minuto (tiros, faltas, córners, tarjetas)
        const probEvento = 0.15; // 15% de evento por minuto

        if (Math.random() < probEvento) {
            const tipoEvento = Math.random();
            const equipoEvento = Math.random() < (0.5 + momentum * 0.2) ? team1 : team2;
            const esLocal = equipoEvento === team1;

            if (tipoEvento < 0.35) {
                // Tiro a puerta
                if (esLocal) {
                    tirosLocal++;
                    tirosPuertaLocal++;
                } else {
                    tirosVisitante++;
                    tirosPuertaVisitante++;
                }

                if (Math.random() < 0.3) { // 30% de tiros notables se registran
                    momentos.push({
                        minuto,
                        equipo: equipoEvento,
                        descripcion: generarDescripcionTiro(),
                        tipo: 'tiro'
                    });
                }
            } else if (tipoEvento < 0.55) {
                // Tiro fuera
                if (esLocal) tirosLocal++;
                else tirosVisitante++;
            } else if (tipoEvento < 0.70) {
                // Córner
                if (esLocal) cornersLocal++;
                else cornersVisitante++;

                if (Math.random() < 0.25) {
                    momentos.push({
                        minuto,
                        equipo: equipoEvento,
                        descripcion: 'Córner a favor',
                        tipo: 'corner'
                    });
                }
            } else if (tipoEvento < 0.90) {
                // Falta
                if (esLocal) faltasLocal++;
                else faltasVisitante++;

                if (Math.random() < 0.20) {
                    momentos.push({
                        minuto,
                        equipo: equipoEvento,
                        descripcion: generarDescripcionFalta(),
                        tipo: 'falta'
                    });
                }
            } else if (tipoEvento < 0.97) {
                // Tarjeta amarilla
                if (esLocal) tarjetasAmarillasLocal++;
                else tarjetasAmarillasVisitante++;

                momentos.push({
                    minuto,
                    equipo: equipoEvento,
                    descripcion: 'Tarjeta amarilla por juego brusco',
                    tipo: 'tarjeta'
                });
            } else {
                // Tarjeta roja (muy raro, 3% de los eventos)
                if (esLocal) {
                    jugadores1Expulsados++;
                    momentos.push({
                        minuto,
                        equipo: team1,
                        descripcion: '🔴 TARJETA ROJA - Expulsión',
                        tipo: 'tarjeta-roja'
                    });
                } else {
                    jugadores2Expulsados++;
                    momentos.push({
                        minuto,
                        equipo: team2,
                        descripcion: '🔴 TARJETA ROJA - Expulsión',
                        tipo: 'tarjeta-roja'
                    });
                }
            }
        }

        // Decay del momentum (se va disipando)
        momentum *= 0.98;
    }

    // Calcular posesión basada en estadísticas originales + momentum
    const posesionBase1 = parseFloat(stats1.possession) || 50;
    const posesionBase2 = parseFloat(stats2.possession) || 50;
    const totalPosesion = posesionBase1 + posesionBase2;

    let posesionLocal = Math.round((posesionBase1 / totalPosesion) * 100 + momentum * 5);
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
        }
    };

    return {
        goles1,
        goles2,
        momentos,
        estadisticas
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

// Funciones para generar descripciones aleatorias
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

