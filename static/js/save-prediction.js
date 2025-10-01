// Funcionalidad para guardar predicción
document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.getElementById('save-prediction-btn');

    if (saveButton) {
        saveButton.addEventListener('click', async function() {
            if (!currentResults) {
                alert('No hay predicción para guardar');
                return;
            }

            saveButton.disabled = true;
            saveButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';

            try {
                const response = await fetch('/save_prediction', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(currentResults)
                });

                const data = await response.json();

                if (response.ok) {
                    saveButton.innerHTML = '<i class="fas fa-check me-2"></i>Guardado';
                    saveButton.classList.remove('btn-light');
                    saveButton.classList.add('btn-success');

                    setTimeout(() => {
                        saveButton.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Predicción';
                        saveButton.classList.remove('btn-success');
                        saveButton.classList.add('btn-light');
                        saveButton.disabled = false;
                    }, 2000);
                } else {
                    alert('Error al guardar: ' + data.error);
                    saveButton.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Predicción';
                    saveButton.disabled = false;
                }
            } catch (error) {
                alert('Error de conexión al guardar la predicción');
                saveButton.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Predicción';
                saveButton.disabled = false;
            }
        });
    }
});
