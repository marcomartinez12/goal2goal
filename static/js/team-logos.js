// API Key de Serper para búsqueda de logos
const SERPER_API_KEY = '2932db6ed8c0585c66052d48ecf0ff8c35d57143';
const SERPER_API_URL = 'https://google.serper.dev/images';

// Caché para evitar búsquedas repetidas
const logoCache = {};

// Timeout para búsquedas (debounce)
let searchTimeout1 = null;
let searchTimeout2 = null;

/**
 * Busca el logo de un equipo usando la API de Serper
 * @param {string} teamName - Nombre del equipo
 * @returns {Promise<string|null>} URL del logo o null si no se encuentra
 */
async function searchTeamLogo(teamName) {
    if (!teamName || teamName.trim().length < 3) {
        return null;
    }

    // Verificar si ya está en caché
    if (logoCache[teamName]) {
        return logoCache[teamName];
    }

    try {
        const searchQuery = `${teamName} football club logo`;

        const response = await fetch(SERPER_API_URL, {
            method: 'POST',
            headers: {
                'X-API-KEY': SERPER_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                q: searchQuery,
                num: 5  // Obtener las primeras 5 imágenes
            })
        });

        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status}`);
        }

        const data = await response.json();

        // Buscar una imagen que parezca ser un logo
        if (data.images && data.images.length > 0) {
            // Preferir imágenes de dominios oficiales o conocidos
            const preferredDomains = ['wikipedia.org', 'wikimedia.org', 'fifa.com', 'uefa.com'];

            // Intentar encontrar un logo de un dominio preferido
            for (const domain of preferredDomains) {
                const image = data.images.find(img =>
                    img.imageUrl && img.imageUrl.includes(domain)
                );
                if (image) {
                    logoCache[teamName] = image.imageUrl;
                    return image.imageUrl;
                }
            }

            // Si no se encuentra en dominios preferidos, usar la primera imagen
            const firstImage = data.images[0];
            if (firstImage && firstImage.imageUrl) {
                logoCache[teamName] = firstImage.imageUrl;
                return firstImage.imageUrl;
            }
        }

        return null;
    } catch (error) {
        console.error('Error al buscar logo:', error);
        return null;
    }
}

/**
 * Actualiza el logo de un equipo en la interfaz
 * @param {number} teamNumber - Número del equipo (1 o 2)
 * @param {string} logoUrl - URL del logo
 */
function updateTeamLogo(teamNumber, logoUrl) {
    const logoContainer = document.getElementById(`team${teamNumber}-logo-container`);
    const logoImg = document.getElementById(`team${teamNumber}-logo`);
    const statusElement = document.getElementById(`team${teamNumber}-search-status`);

    if (logoUrl) {
        logoImg.src = logoUrl;
        logoContainer.style.display = 'block';
        statusElement.textContent = '✓ Logo encontrado';
        statusElement.style.color = '#28a745';
    } else {
        logoContainer.style.display = 'none';
        logoImg.src = '';
        statusElement.textContent = '';
    }
}

/**
 * Maneja el evento de búsqueda de logo para un equipo
 * @param {number} teamNumber - Número del equipo (1 o 2)
 * @param {string} teamName - Nombre del equipo ingresado
 */
async function handleTeamLogoSearch(teamNumber, teamName) {
    const statusElement = document.getElementById(`team${teamNumber}-search-status`);

    // Limpiar el logo anterior
    updateTeamLogo(teamNumber, null);

    if (!teamName || teamName.trim().length < 3) {
        return;
    }

    // Mostrar estado de búsqueda
    statusElement.textContent = 'Buscando logo...';
    statusElement.style.color = '#6c757d';

    try {
        const logoUrl = await searchTeamLogo(teamName.trim());

        if (logoUrl) {
            updateTeamLogo(teamNumber, logoUrl);
        } else {
            statusElement.textContent = '✗ Logo no encontrado';
            statusElement.style.color = '#dc3545';
            // Limpiar mensaje después de 3 segundos
            setTimeout(() => {
                statusElement.textContent = '';
            }, 3000);
        }
    } catch (error) {
        console.error('Error al buscar logo:', error);
        statusElement.textContent = '✗ Error al buscar logo';
        statusElement.style.color = '#dc3545';
        setTimeout(() => {
            statusElement.textContent = '';
        }, 3000);
    }
}

// Inicializar los listeners cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    const team1Input = document.getElementById('team1');
    const team2Input = document.getElementById('team2');

    // Listener para Equipo 1
    if (team1Input) {
        team1Input.addEventListener('input', function(e) {
            const teamName = e.target.value;

            // Limpiar timeout anterior
            if (searchTimeout1) {
                clearTimeout(searchTimeout1);
            }

            // Esperar 1 segundo después de que el usuario deje de escribir
            searchTimeout1 = setTimeout(() => {
                handleTeamLogoSearch(1, teamName);
            }, 1000);
        });

        // Búsqueda inmediata al perder el foco
        team1Input.addEventListener('blur', function(e) {
            if (searchTimeout1) {
                clearTimeout(searchTimeout1);
            }
            const teamName = e.target.value;
            if (teamName && teamName.trim().length >= 3) {
                handleTeamLogoSearch(1, teamName);
            }
        });
    }

    // Listener para Equipo 2
    if (team2Input) {
        team2Input.addEventListener('input', function(e) {
            const teamName = e.target.value;

            // Limpiar timeout anterior
            if (searchTimeout2) {
                clearTimeout(searchTimeout2);
            }

            // Esperar 1 segundo después de que el usuario deje de escribir
            searchTimeout2 = setTimeout(() => {
                handleTeamLogoSearch(2, teamName);
            }, 1000);
        });

        // Búsqueda inmediata al perder el foco
        team2Input.addEventListener('blur', function(e) {
            if (searchTimeout2) {
                clearTimeout(searchTimeout2);
            }
            const teamName = e.target.value;
            if (teamName && teamName.trim().length >= 3) {
                handleTeamLogoSearch(2, teamName);
            }
        });
    }

    console.log('🔍 Búsqueda automática de logos activada');
});
