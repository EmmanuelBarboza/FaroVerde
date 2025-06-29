// Configuración
const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT5JdQ0hQ3AiNJ17s7LDeEZkNFCsMKX_dHQFs5fnx51UdBR8rhDybY4WrjEDoER2Ewo-XmlThNzQZRY/pub?gid=1927773597&single=true&output=csv';

// Funciones utilitarias
function formatDate(dateString) {
    if (!dateString) return 'Fecha no definida';
    try {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('es-ES', options);
    } catch {
        return dateString;
    }
}

function parseCSV(text) {
    const [headerLine, ...rows] = text.trim().split('\n');
    const keys = headerLine.split(',').map(k => k.trim());
    return rows.map(row => {
        const values = row.split(',');
        const obj = {};
        keys.forEach((key, i) => {
            obj[key] = values[i] ? values[i].trim() : '';
        });
        return obj;
    });
}

function isUpcoming(evento) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (!evento.FechaEvento) return false;
    
    try {
        // Convierte formatos DD/MM/YYYY a YYYY-MM-DD
        const dateStr = evento.FechaEvento.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1');
        const eventDate = new Date(dateStr);
        return !isNaN(eventDate.getTime()) && eventDate >= now;
    } catch (e) {
        console.error('Fecha inválida:', evento.FechaEvento);
        return false;
    }
}

// Funciones principales
async function cargarEventos() {
    const container = document.getElementById('eventos');
    if (!container) {
        console.error('Elemento #eventos no encontrado');
        return;
    }
    
    container.textContent = 'Cargando eventos...';
    
    try {
        const response = await fetch(`${sheetUrl}&nocache=${Date.now()}`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        
        const text = await response.text();
        const eventos = parseCSV(text).filter(isUpcoming);
        
        if (eventos.length === 0) {
            container.innerHTML = `
                <div class="no-eventos">
                    <h3>Próximamente más actividades</h3>
                    <p>Actualmente no hay eventos próximos programados.</p>
                    <p>Vuelve pronto para enterarte de nuevas actividades.</p>
                </div>`;
            return;
        }
        
        container.innerHTML = '';
        eventos.forEach((evento, idx) => {
            const card = document.createElement('div');
            card.className = 'event-card';
            card.dataset.idx = idx;
            card.innerHTML = `
                <div class="event-info">
                    <h3>${evento.NombreEvento || 'Evento sin nombre'}</h3>
                    <p class="event-location"><i class="fas fa-map-marker-alt"></i> ${evento.LugarEvento || 'Lugar no especificado'}</p>
                    <p class="event-date"><i class="fas fa-calendar-alt"></i> ${formatDate(evento.FechaEvento)}</p>
                    <p class="event-description">${evento.DescripcionEvento || 'Sin descripción disponible'}</p>
                    <div class="event-actions">
                        <button class="btn-participar" onclick="openModal()">Participar</button>
                        <button class="btn-mas">Ver detalles</button>
                    </div>
                </div>`;
            container.appendChild(card);
        });
        
        setupModal(eventos);
    } catch (error) {
        console.error('Error al cargar eventos:', error);
        container.innerHTML = `
            <p class="error-message">Error al cargar eventos: ${error.message}</p>
            <p><small>Por favor intenta recargar la página.</small></p>`;
    }
}

function setupModal(eventos) {
    const modal = document.getElementById('eventoModal');
    if (!modal) return;

    const closeBtn = modal.querySelector('.close-btn');
    
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-mas')) {
            const idx = e.target.closest('.event-card').dataset.idx;
            const ev = eventos[idx];
            
            document.getElementById('modalTitle').textContent = ev.NombreEvento || 'Evento sin nombre';
            document.getElementById('modalPlace').textContent = ev.LugarEvento || 'Lugar no especificado';
            document.getElementById('modalDate').textContent = formatDate(ev.FechaEvento);
            document.getElementById('modalDesc').textContent = ev.DescripcionEvento || 'Sin descripción disponible';
            document.getElementById('modalEmail').innerHTML = ev.CorreoEvento 
                ? `<a href="mailto:${ev.CorreoEvento}">${ev.CorreoEvento}</a>`
                : 'No hay correo proporcionado';
            
            modal.style.display = 'flex';
        }
    });

    if (closeBtn) {
        closeBtn.onclick = () => modal.style.display = 'none';
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarEventos();
    
    // Manejo de formularios
    const formOrganizar = document.getElementById('formOrganizarEvento');
    if (formOrganizar) {
        formOrganizar.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Gracias por tu interés en organizar un evento. Nos pondremos en contacto contigo pronto.');
            formOrganizar.reset();
        });
    }
    
    const formParticipacion = document.getElementById('formParticipacion');
    if (formParticipacion) {
        formParticipacion.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Gracias por tu interés en participar. Hemos recibido tu información.');
            formParticipacion.reset();
            closeModal();
        });
    }
});