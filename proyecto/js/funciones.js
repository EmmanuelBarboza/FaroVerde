// Configuración
const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT5JdQ0hQ3AiNJ17s7LDeEZkNFCsMKX_dHQFs5fnx51UdBR8rhDybY4WrjEDoER2Ewo-XmlThNzQZRY/pub?gid=1927773597&single=true&output=csv';

// Función para parsear CSV avanzado
function parseCSV(text) {
    const lines = [];
    let currentLine = [];
    let inQuotedField = false;
    let currentField = '';
    let rowCount = 0;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (char === '"') {
            if (inQuotedField && text[i+1] === '"') {
                currentField += '"';
                i++; // Saltar comilla escapada
            } else {
                inQuotedField = !inQuotedField;
            }
        } else if (char === ',' && !inQuotedField) {
            currentLine.push(currentField.trim());
            currentField = '';
        } else if ((char === '\n' || char === '\r') && !inQuotedField) {
            if (char === '\n') rowCount++;
            if (currentField !== '' || currentLine.length > 0) {
                currentLine.push(currentField.trim());
                lines.push(currentLine);
                currentLine = [];
                currentField = '';
            }
        } else {
            currentField += char;
        }
    }

    // Añadir última línea
    if (currentField.trim() !== '' || currentLine.length > 0) {
        currentLine.push(currentField.trim());
        lines.push(currentLine);
    }

    // Convertir a objetos
    if (lines.length === 0) return [];
    
    const headers = lines[0].map(h => h.trim());
    return lines.slice(1).map(line => {
        const obj = {};
        headers.forEach((header, i) => {
            obj[header] = (line[i] || '').replace(/^"|"$/g, '');
        });
        return obj;
    });
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return 'Fecha no definida';
    try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? dateString : 
               date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return dateString;
    }
}

// Filtrar eventos futuros
function isUpcoming(evento) {
    if (!evento.FechaEvento) return false;
    
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const eventDate = new Date(evento.FechaEvento);
        return eventDate >= today;
    } catch (e) {
        console.warn('Fecha inválida:', evento.FechaEvento, e);
        return false;
    }
}

// Cargar y mostrar eventos
async function cargarEventos() {
    const container = document.getElementById('eventos');
    if (!container) {
        console.error('Contenedor #eventos no encontrado');
        return;
    }

    container.innerHTML = '<div class="loading">Cargando eventos...</div>';

    try {
        const response = await fetch(`${sheetUrl}&t=${Date.now()}`);
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        
        const text = await response.text();
        const eventos = parseCSV(text).filter(isUpcoming);

        console.log('Eventos procesados:', eventos); // Para debug

        if (eventos.length === 0) {
            container.innerHTML = `
                <div class="no-eventos">
                    <i class="fas fa-calendar-plus"></i>
                    <h3>Próximamente más actividades</h3>
                    <p>No hay eventos programados actualmente.</p>
                </div>`;
            return;
        }

        container.innerHTML = eventos.map(evento => `
            <div class="evento-card">
                <div class="evento-header">
                    <h3>${evento.NombreEvento || 'Evento sin título'}</h3>
                    <span class="evento-date">
                        <i class="fas fa-calendar-alt"></i>
                        ${formatDate(evento.FechaEvento)}
                    </span>
                </div>
                <div class="evento-body">
                    <p class="evento-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${evento.LugarEvento || 'Ubicación no especificada'}
                    </p>
                    <p class="evento-description">
                        ${evento.DescripcionEvento || 'Descripción no disponible'}
                    </p>
                    ${evento.CorreoEvento ? `
                    <div class="evento-contacto">
                        <a href="mailto:${evento.CorreoEvento}" class="btn-contacto">
                            <i class="fas fa-envelope"></i> Contactar
                        </a>
                    </div>` : ''}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error al cargar eventos:', error);
        container.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error al cargar eventos</h3>
                <p>${error.message}</p>
                <button onclick="cargarEventos()" class="btn-reintentar">
                    <i class="fas fa-sync-alt"></i> Reintentar
                </button>
            </div>`;
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', cargarEventos);