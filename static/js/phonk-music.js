// Controlador de música phonk para XplainBet

class PhonkMusicPlayer {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        
        // Probar múltiples rutas posibles para encontrar el archivo
        this.playlist = [
            window.location.origin + '/static/audio/phonk_music.mp3',
            '/static/audio/phonk_music.mp3',
            './static/audio/phonk_music.mp3',
            '../static/audio/phonk_music.mp3',
            '../../static/audio/phonk_music.mp3',
            '/audio/phonk_music.mp3',
            'phonk_music.mp3',
            'c:/xplainbet-git/demo-xplainbet/static/audio/phonk_music.mp3'
        ];
        
        this.debug = true; // Habilitar mensajes de depuración
        
        if (this.debug) {
            console.log('URLs a probar:', this.playlist);
            console.log('Ubicación actual:', window.location.href);
            console.log('Origen:', window.location.origin);
        }
        
        this.initialize();
    }

    initialize() {
        // Crear elemento de audio y configurarlo directamente
        this.audio = new Audio();
        
        // Canción phonk específica solicitada por el usuario - probando diferentes formatos de ruta
        this.playlist = [
            '/static/audio/phonk_music.mp3', // Ruta absoluta desde la raíz del servidor
            './static/audio/phonk_music.mp3', // Ruta relativa
            window.location.origin + '/static/audio/phonk_music.mp3', // Ruta absoluta completa
            'http://127.0.0.1:5000/static/audio/phonk_music.mp3' // URL directa
        ];

        // Configurar el audio para que se reproduzca en bucle
        this.audio.loop = true;
        
        // Establecer volumen inicial
        this.audio.volume = 0.5;
        
        // Intentar precargar el audio
        try {
            this.audio.src = this.playlist[0];
            this.audio.load();
            console.log('Audio precargado con la ruta:', this.playlist[0]);
            
            // Agregar un evento de clic en el documento para habilitar la reproducción de audio
            // Esto es necesario porque los navegadores modernos requieren interacción del usuario
            // antes de permitir la reproducción automática de audio
            document.addEventListener('click', function unlockAudio() {
                // Crear un contexto de audio temporal y reproducir un sonido silencioso
                // para desbloquear la reproducción de audio en el navegador
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const silentBuffer = audioContext.createBuffer(1, 1, 22050);
                const source = audioContext.createBufferSource();
                source.buffer = silentBuffer;
                source.connect(audioContext.destination);
                source.start(0);

                console.log('Audio desbloqueado después de la interacción del usuario');
            }, { once: true });
            
        } catch (error) {
            console.error('Error al precargar el audio:', error);
        }
    }

    play() {
        console.log('Método play() llamado en PhonkMusicPlayer');
        if (!this.isPlaying) {
            console.log('La música no está reproduciéndose, intentando reproducir...');
            // Intentar reproducir con un pequeño retraso para asegurar que el navegador esté listo
            setTimeout(() => {
                this.tryPlayWithNextUrl(0);
            }, 100);
        } else {
            console.log('La música ya está reproduciéndose');
        }
    }
    
    // Método para intentar reproducir con diferentes URLs hasta que una funcione
    tryPlayWithNextUrl(index) {
        console.log(`tryPlayWithNextUrl llamado con índice: ${index}`);
        
        if (index >= this.playlist.length) {
            console.error('No se pudo reproducir el audio con ninguna de las URLs disponibles');
            alert('No se pudo reproducir el audio. Por favor, verifica que el archivo exista y sea accesible.');
            return;
        }
        
        // Cancelar cualquier reproducción en curso para evitar errores de AbortError
        if (this.audio) {
            try {
                this.audio.pause();
                // Eliminar los event listeners anteriores para evitar problemas
                this.audio.oncanplaythrough = null;
                this.audio.onerror = null;
                this.audio.removeEventListener('error', null);
                this.audio.removeEventListener('canplay', null);
            } catch (e) {
                console.warn('Error al pausar audio anterior:', e);
            }
        }
        
        try {
            const songUrl = this.playlist[index];
            console.log(`Intento ${index + 1}/${this.playlist.length}: Reproduciendo desde URL:`, songUrl);
            console.log(`Ubicación actual: ${window.location.href}`);
            console.log(`Origen: ${window.location.origin}`);
            
            // Crear un nuevo elemento de audio para cada intento
            this.audio = new Audio();
            this.audio.src = songUrl;
            this.audio.volume = 0.5;
            this.audio.loop = true;
            
            // Variable para controlar si ya se ha manejado un error
            let errorHandled = false;
            
            // Manejar el evento de error para probar la siguiente URL
            this.audio.addEventListener('error', (e) => {
                if (!errorHandled) {
                    errorHandled = true;
                    console.error(`Error con URL ${index + 1}/${this.playlist.length}:`, e);
                    console.error('Código de error:', this.audio.error ? this.audio.error.code : 'desconocido');
                    console.error('Mensaje de error:', this.audio.error ? this.audio.error.message : 'desconocido');
                    
                    // Intentar con la siguiente URL con un pequeño retraso
                    setTimeout(() => {
                        this.tryPlayWithNextUrl(index + 1);
                    }, 500);
                }
            });
            
            // Manejar el evento de éxito
            this.audio.addEventListener('canplay', () => {
                console.log(`URL ${index + 1}/${this.playlist.length} está lista para reproducirse:`, songUrl);
            });
            
            // Asegurarse de que el audio esté cargado antes de intentar reproducirlo
            this.audio.oncanplaythrough = () => {
                console.log('Audio cargado y listo para reproducir');
                
                // Solo intentar reproducir si no se ha manejado un error previamente
                if (!errorHandled) {
                    // Intentar reproducir
                    this.audio.play()
                        .then(() => {
                            this.isPlaying = true;
                            console.log(`¡Éxito! Reproduciendo con URL ${index + 1}/${this.playlist.length}:`, songUrl);
                            
                            // Añadir clase visual para indicar que está sonando
                            const phonkControls = document.querySelector('.phonk-controls');
                            if (phonkControls) {
                                phonkControls.classList.add('playing');
                            }
                            
                            // Actualizar el botón de prueba si existe
                            const testPhonkBtn = document.getElementById('test-phonk-btn');
                            if (testPhonkBtn) {
                                testPhonkBtn.innerHTML = '<i class="fas fa-pause me-1"></i>Pausar Música Phonk';
                            }
                            
                            console.log('Música Phonk activada durante el cálculo');
                        })
                        .catch(error => {
                            if (!errorHandled) {
                                errorHandled = true;
                                console.error(`Error al reproducir con URL ${index + 1}/${this.playlist.length}:`, error);
                                
                                // Verificar si es un error de interacción del usuario
                                if (error.name === 'NotAllowedError') {
                                    console.warn('El navegador bloqueó la reproducción automática. Se requiere interacción del usuario.');
                                    
                                    // Intentar nuevamente después de un tiempo
                                    setTimeout(() => {
                                        this.tryPlayWithNextUrl(index);
                                    }, 1000);
                                } 
                                // Verificar si es un error de AbortError (reproducción interrumpida)
                                else if (error.name === 'AbortError') {
                                    console.warn('La reproducción fue interrumpida. Intentando nuevamente...');
                                    
                                    // Esperar un poco más antes de reintentar
                                    setTimeout(() => {
                                        this.tryPlayWithNextUrl(index);
                                    }, 1500);
                                } else {
                                    // Intentar con la siguiente URL
                                    setTimeout(() => {
                                        this.tryPlayWithNextUrl(index + 1);
                                    }, 500);
                                }
                            }
                        });
                }
            };
                
            // Iniciar la carga del audio
            this.audio.load();
        } catch (error) {
            console.error(`Error general con URL ${index + 1}/${this.playlist.length}:`, error);
            
            // Intentar con la siguiente URL
            setTimeout(() => {
                this.tryPlayWithNextUrl(index + 1);
            }, 500);
        }
    }

    pause() {
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
            console.log('Música phonk pausada');
            
            // Quitar clase visual cuando se pausa la música
            const phonkControls = document.querySelector('.phonk-controls');
            if (phonkControls) {
                phonkControls.classList.remove('playing');
            }
        }
    }

    setVolume(volume) {
        // Asegurar que el volumen esté entre 0 y 1
        const newVolume = Math.max(0, Math.min(1, volume));
        this.audio.volume = newVolume;
    }
}

// Exportar la clase para su uso en otros archivos
window.PhonkMusicPlayer = PhonkMusicPlayer;