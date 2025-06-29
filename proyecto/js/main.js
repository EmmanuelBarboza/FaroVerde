const noticiasSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT5JdQ0hQ3AiNJ17s7LDeEZkNFCsMKX_dHQFs5fnx51UdBR8rhDybY4WrjEDoER2Ewo-XmlThNzQZRY/pub?output=csv';

function parseCSV(text) {
    text = text.replace(/\r/g, '').trim();
    const lines = text.split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).map((line) => {
        const obj = {};
        let currentPosition = 0;
        let inQuotes = false;
        let currentValue = '';

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                obj[headers[currentPosition]] = currentValue.trim();
                currentValue = '';
                currentPosition++;
            } else {
                currentValue += char;
            }
        }
        obj[headers[currentPosition]] = currentValue.trim();
        return obj;
    });
}

function formatFecha(fechaStr) {
    try {
        const date = new Date(fechaStr);
        return date.toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
        return fechaStr;
    }
}

async function cargarNoticiasInicio() {
    const container = document.querySelector('.news-section .noticias');
    if (!container) return;

    container.innerHTML = '<p class="loading">Cargando noticias...</p>';

    try {
        const res = await fetch(`${noticiasSheetUrl}&t=${Date.now()}`);
        const csv = await res.text();
        let noticias = parseCSV(csv);

        // Validar y ordenar por fecha descendente
        noticias = noticias
            .filter(n =>
                n.Titulo && n.Fecha && n.Imagen &&
                n.Imagen.trim().startsWith('http'))
            .sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha))
            .slice(0, 3); // Solo 3 noticias

        if (noticias.length === 0) {
            container.innerHTML = '<p>No hay noticias disponibles.</p>';
            return;
        }

        container.innerHTML = noticias.map(noticia => `
            <div class="noticia">
                <div class="noticia-img" style="background-image: url('${noticia.Imagen.trim()}');"></div>
                <div class="noticia-contenido">
                    <p class="fecha">${formatFecha(noticia.Fecha)}</p>
                    <h3 class="titulo">${noticia.Titulo}</h3>
                    <p class="descripcion">${noticia.Descripcion}</p>
                    <div class="iconos">
                        <div class="iconos-left">
                        </div>
                        <div class="iconos-right">
                            <span class="bi bi-share icono-compartir"></span>
                            <span class="bi bi-bookmark"></span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error al cargar noticias:', error);
        container.innerHTML = '<p>Error al cargar noticias. Intenta más tarde.</p>';
    }
}

document.addEventListener('DOMContentLoaded', cargarNoticiasInicio);
