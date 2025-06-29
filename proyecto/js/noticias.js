const noticiasSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT5JdQ0hQ3AiNJ17s7LDeEZkNFCsMKX_dHQFs5fnx51UdBR8rhDybY4WrjEDoER2Ewo-XmlThNzQZRY/pub?output=csv';

function parseCSV(text) {
    text = text.replace(/\r/g, '').trim();
    const lines = text.split('\n');
    
    if (lines.length < 2) return []; 

    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map((line, index) => {
        const obj = {};
        let currentPosition = 0;
        let inQuotes = false;
        let currentValue = '';
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                if (headers[currentPosition]) {
                    obj[headers[currentPosition]] = currentValue.trim();
                }
                currentValue = '';
                currentPosition++;
            } else {
                currentValue += char;
            }
        }
        
        if (headers[currentPosition]) {
            obj[headers[currentPosition]] = currentValue.trim();
        }
        
        console.log(`Línea ${index + 1}:`, obj);
        return obj;
    });
}

// Formatea fecha a formato amigable
function formatFecha(fechaStr) {
    try {
        const date = new Date(fechaStr);
        return date.toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
        return fechaStr;
    }
}

// Carga y muestra las noticias
async function cargarNoticias() {
    const container = document.querySelector('.noticias');
    if (!container) return;

    container.innerHTML = '<p class="loading">Cargando noticias...</p>';

    try {
        const res = await fetch(`${noticiasSheetUrl}&t=${Date.now()}`);
        const csv = await res.text();
        let noticias = parseCSV(csv);

        // Filtrar por fecha descendente (más recientes primero)
        noticias = noticias
            .filter(n => 
            n.Titulo && n.Titulo.trim() !== '"' &&  // Elimina títulos corruptos
            n.Fecha && 
            n.Imagen && n.Imagen.trim().startsWith('http') );

        if (noticias.length === 0) {
            container.innerHTML = '<p>No hay noticias disponibles.</p>';
            return;
        }

        container.innerHTML = noticias.map(noticia => `
            <article class="noticia">
                <div class="noticia-img" style="background-image: url('${noticia.Imagen.trim()}')"></div>
                <div class="noticia-contenido">
                    <p class="fecha">Fecha: ${formatFecha(noticia.Fecha)}</p>
                    <h3 class="titulo">${noticia.Titulo}</h3>
                    <p class="descripcion">${noticia.Descripcion}</p>
                    <div class="iconos">
                    <div class="iconos-left">
                        <span class="icono-favorito"><i class="bi bi-star"></i></span>
                        <span class="icono-ocultar"><i class="bi bi-eye-slash"></i></span>
                        <span class="icono-compartir"><i class="bi bi-link-45deg"></i></span>
                    </div>
                    <div class="iconos-right">
                        <span class="icono-like"><i class="bi bi-hand-thumbs-up"></i> <span class="contador">0</span></span>
                        <span class="icono-dislike"><i class="bi bi-hand-thumbs-down"></i> <span class="contador">0</span></span>
                        <span class="icono-corazon"><i class="bi bi-heart"></i> <span class="contador">0</span></span>
                    </div>
                </div>
                </div>
            </article>
        `).join('');
    } catch (error) {
        console.error('Error al cargar noticias:', error);
        container.innerHTML = '<p>Error al cargar noticias. Intenta más tarde.</p>';
    }

    

    // Funcionalidad para los iconos
document.querySelectorAll('.noticia').forEach(noticia => {

    let haDadoLike = false;
    let haDadoDislike = false;
    let haDadoCorazon = false;

    // Favorito 
    noticia.querySelector('.icono-favorito').addEventListener('click', function() {
        this.classList.toggle('active');
        console.log('Noticia marcada como favorita');
    });
    
    // Ocultar y mostrar
   noticia.querySelector('.icono-ocultar').addEventListener('click', function() {
    noticia.classList.toggle('oculta');
    console.log('Noticia', noticia.classList.contains('oculta') ? 'ocultada' : 'mostrada');
});
    
    // Compartir
   noticia.querySelector('.icono-compartir').addEventListener('click', function() {
    const titulo = noticia.querySelector('.titulo').textContent;
    const url = window.location.href;
    navigator.clipboard.writeText(`${titulo} - ${url}`);
    this.classList.add('copiado');
    setTimeout(() => this.classList.remove('copiado'), 1000);
});
    
     // like/dislike
    noticia.querySelector('.icono-like').addEventListener('click', function() {
        const contadorLike = this.querySelector('.contador');
        const iconoDislike = noticia.querySelector('.icono-dislike');
        const contadorDislike = iconoDislike.querySelector('.contador');
        
        if (!haDadoLike) {
            // Dar like
            contadorLike.textContent = parseInt(contadorLike.textContent) + 1;
            this.classList.add('activo');
            haDadoLike = true;
            
            // Si tenía dislike, quitarlo
            if (haDadoDislike) {
                contadorDislike.textContent = parseInt(contadorDislike.textContent) - 1;
                iconoDislike.classList.remove('activo');
                haDadoDislike = false;
            }
        } else {
            // Quitar like
            contadorLike.textContent = parseInt(contadorLike.textContent) - 1;
            this.classList.remove('activo');
            haDadoLike = false;
        }
    });

    noticia.querySelector('.icono-dislike').addEventListener('click', function() {
        const contadorDislike = this.querySelector('.contador');
        const iconoLike = noticia.querySelector('.icono-like');
        const contadorLike = iconoLike.querySelector('.contador');
        
        if (!haDadoDislike) {
            // Dar dislike
            contadorDislike.textContent = parseInt(contadorDislike.textContent) + 1;
            this.classList.add('activo');
            haDadoDislike = true;
            
            // Si tenía like, quitarlo
            if (haDadoLike) {
                contadorLike.textContent = parseInt(contadorLike.textContent) - 1;
                iconoLike.classList.remove('activo');
                haDadoLike = false;
            }
        } else {
            // Quitar dislike
            contadorDislike.textContent = parseInt(contadorDislike.textContent) - 1;
            this.classList.remove('activo');
            haDadoDislike = false;
        }
    });
    
    // Corazón
     noticia.querySelector('.icono-corazon').addEventListener('click', function() {
        const contador = this.querySelector('.contador');
        
        if (!haDadoCorazon) {
            // Dar corazón
            contador.textContent = parseInt(contador.textContent) + 1;
            this.classList.add('activo');
            haDadoCorazon = true;
        } else {
            // Quitar corazón
            contador.textContent = parseInt(contador.textContent) - 1;
            this.classList.remove('activo');
            haDadoCorazon = false;
        }
    });
});
}

// Ejecutar al cargar el DOM
document.addEventListener('DOMContentLoaded', cargarNoticias);
