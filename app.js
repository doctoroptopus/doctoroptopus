document.addEventListener('DOMContentLoaded', () => {
    const originalFileInput = document.getElementById('originalFile');
    const editedFileInput = document.getElementById('editedFile');
    const originalFileNameSpan = document.getElementById('originalFileName');
    const editedFileNameSpan = document.getElementById('editedFileName');
    const restoreButton = document.getElementById('restoreButton');
    const statusDiv = document.getElementById('status');
    const downloadLink = document.getElementById('downloadLink');

    let originalFile = null;
    let editedFile = null;
    let originalTags = null;

    const updateUI = () => {
        originalFileNameSpan.textContent = originalFile ? originalFile.name : 'Ningún archivo seleccionado';
        editedFileNameSpan.textContent = editedFile ? editedFile.name : 'Ningún archivo seleccionado';
        restoreButton.disabled = !originalFile || !editedFile;
    };

    originalFileInput.addEventListener('change', (e) => {
        originalFile = e.target.files[0];
        if (originalFile) {
            readTags(originalFile, (tags) => {
                originalTags = tags;
                updateUI();
                statusDiv.textContent = 'Metadatos del archivo original cargados.';
            });
        }
    });

    editedFileInput.addEventListener('change', (e) => {
        editedFile = e.target.files[0];
        updateUI();
    });

    restoreButton.addEventListener('click', () => {
        if (originalFile && editedFile && originalTags) {
            restoreMetadata();
        }
    });

    const readTags = (file, callback) => {
        jsmediatags.read(file, {
            onSuccess: (tag) => {
                callback(tag.tags);
            },
            onError: (error) => {
                console.error("Error al leer los metadatos:", error);
                statusDiv.textContent = "Error al leer los metadatos del archivo original. Asegúrate de que el archivo es válido.";
                callback(null);
            }
        });
    };

    const restoreMetadata = () => {
        statusDiv.textContent = "Restaurando metadatos...";
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const writer = new ID3Writer(e.target.result);
                
                // Aplicar los tags
                if (originalTags.title) writer.setFrame('TIT2', originalTags.title);
                if (originalTags.artist) writer.setFrame('TPE1', originalTags.artist);
                if (originalTags.album) writer.setFrame('TALB', originalTags.album);
                if (originalTags.year) writer.setFrame('TYER', originalTags.year);
                if (originalTags.genre) writer.setFrame('TCON', originalTags.genre);
                if (originalTags.track) writer.setFrame('TRCK', originalTags.track);

                writer.addTag();

                const blob = writer.getBlob();
                const url = URL.createObjectURL(blob);
                
                downloadLink.href = url;
                downloadLink.download = `restaurado_${editedFile.name}`;
                downloadLink.style.display = 'block';
                downloadLink.click();

                statusDiv.textContent = "¡Metadatos restaurados! El archivo se está descargando.";
            } catch (error) {
                statusDiv.textContent = "Error al restaurar el archivo. Por favor, inténtalo de nuevo.";
                console.error(error);
            }
        };
        reader.readAsArrayBuffer(editedFile);
    };
});
