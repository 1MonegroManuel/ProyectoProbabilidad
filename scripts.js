// Constantes del juego
const VALORES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const PALOS = [
  { simbolo: '♥', color: '#e74c3c', nombre: 'Corazones' },
  { simbolo: '♣', color: '#2c3e50', nombre: 'Tréboles' },
  { simbolo: '♦', color: '#e74c3c', nombre: 'Diamantes' },
  { simbolo: '♠', color: '#2c3e50', nombre: 'Picas' }
];

// Estado del juego
const estado = {
  cartasEnMesa: [],
  cartasEnJuego: [],
  cartasSacadas: [],
  enJuego: false,
  grupos: [],
  mazoElement: null,
  ultimaCartaSacada: null,
  animacionesEnCurso: [],
  timeoutIds: []
};

// Cache de elementos DOM
const elementos = {
  slider: document.getElementById("slider"),
  cartasContainer: document.getElementById("cartasContainer"),
  cartasSalidas: document.getElementById("cartasSalidas"),
  btnPlay: document.getElementById("btnPlay"),
  contadorCartas: document.getElementById("contadorCartas"),
  preguntaContainer: document.getElementById("preguntaContainer"),
  probabilidadTexto: document.getElementById("probabilidadTexto"),
  cartasRestantes: document.getElementById("cartasRestantes"),
  grupoForm: document.getElementById("grupoForm"),
  gruposList: document.getElementById("gruposList"),
  apuestasList: document.getElementById("apuestasList"),
  grupoSeleccionado: document.getElementById("grupoSeleccionado"),
  apuestaForm: document.getElementById("apuestaForm"),
  modalResultados: document.getElementById("modalResultados"),
  modalContenido: document.getElementById("modalContenido"),
  cerrarModal: document.getElementById("cerrarModal")
};

// Inicialización del juego
function init() {
  cargarSlider();
  setupEventListeners();
  actualizarCartas();
  
  // Configurar modal
  if(elementos.cerrarModal) {
    elementos.cerrarModal.addEventListener('click', () => {
      elementos.modalResultados.style.display = 'none';
    });
  }
}

// Configurar event listeners
function setupEventListeners() {
  elementos.btnPlay.addEventListener('click', iniciarJuego);
  
  document.querySelectorAll('input[name="palo"]').forEach(checkbox => {
    checkbox.addEventListener('change', actualizarCartas);
  });

  elementos.grupoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = elementos.grupoForm.nombreGrupo.value.trim();
    const puntos = parseInt(elementos.grupoForm.puntosGrupo.value);
    
    if (!nombre || isNaN(puntos) || puntos <= 0) {
      alert("Datos inválidos. Ingrese un nombre y puntos válidos (mayores a 0)");
      return;
    }

    crearGrupo(nombre, puntos);
    elementos.grupoForm.reset();
  });

  elementos.apuestaForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const grupoNombre = elementos.grupoSeleccionado.value;
    const tipoApuesta = elementos.apuestaForm.tipoApuesta.value;
    const puntos = parseInt(elementos.apuestaForm.puntosApuesta.value);

    if (!grupoNombre || !tipoApuesta || isNaN(puntos) || puntos <= 0) {
      alert("Complete todos los campos con valores válidos (puntos mayores a 0)");
      return;
    }

    registrarApuesta(grupoNombre, tipoApuesta, puntos);
    elementos.apuestaForm.reset();
  });
}

// Cargar slider animado
function cargarSlider() {
  const fragment = document.createDocumentFragment();
  
  for (let i = 0; i < 40; i++) {
    const palo = PALOS[i % PALOS.length];
    const valor = VALORES[i % VALORES.length];
    const carta = document.createElement("div");
    carta.className = "card";
    carta.style.color = palo.color;
    carta.textContent = valor + palo.simbolo;
    fragment.appendChild(carta);
  }
  
  elementos.slider.appendChild(fragment);
}

// Manejo de grupos
function crearGrupo(nombre, puntos) {
  if (estado.grupos.some(g => g.nombre === nombre)) {
    alert("El nombre del grupo ya existe");
    return;
  }

  estado.grupos.push({ 
    nombre, 
    puntos,
    apuestas: [] 
  });
  
  actualizarUI();
}

// Manejo de apuestas
function registrarApuesta(grupoNombre, tipo, puntos) {
  const grupo = estado.grupos.find(g => g.nombre === grupoNombre);
  
  if (!grupo) {
    alert("Grupo no encontrado");
    return;
  }

  if (puntos > grupo.puntos) {
    alert("El grupo no tiene suficientes puntos");
    return;
  }

  grupo.puntos -= puntos;
  grupo.apuestas.push({ 
    tipo, 
    puntos, 
    resultado: null,
    resuelta: false
  });
  
  actualizarUI();
  actualizarListaApuestas(); // Nueva función para actualizar la lista
}

function actualizarListaApuestas() {
  elementos.apuestasList.innerHTML = estado.grupos
    .filter(grupo => grupo.apuestas.length > 0)
    .map(grupo => {
      return grupo.apuestas
        .filter(apuesta => !apuesta.resuelta)
        .map(apuesta => `
          <div class="apuesta-item">
            <strong>${grupo.nombre}</strong>: 
            ${apuesta.tipo} (${apuesta.puntos}p)
          </div>
        `).join('');
    }).join('');
}

// Actualizar interfaz
function actualizarUI() {
  // Actualizar lista de grupos
  elementos.gruposList.innerHTML = estado.grupos.map(grupo => `
    <div class="grupo-item" data-grupo="${grupo.nombre}">
      <strong>${grupo.nombre}</strong>: ${grupo.puntos} puntos
    </div>
  `).join("");

  // Actualizar selector de grupos
  elementos.grupoSeleccionado.innerHTML = `
    <option value="" disabled selected>Selecciona un Grupo</option>
    ${estado.grupos.map(g => `<option value="${g.nombre}">${g.nombre}</option>`).join("")}
  `;
}

// Actualizar cartas en mesa
function actualizarCartas() {
  limpiarAnimaciones();
  const palosSeleccionados = Array.from(
    document.querySelectorAll('input[name="palo"]:checked'), 
    cb => cb.value
  );

  elementos.btnPlay.disabled = palosSeleccionados.length === 0;
  elementos.cartasContainer.innerHTML = '';
  estado.cartasEnMesa = [];

  palosSeleccionados.forEach(paloSimbolo => {
    const palo = PALOS.find(p => p.simbolo === paloSimbolo);
    
    VALORES.forEach(valor => {
      estado.cartasEnMesa.push({
        valor,
        palo: palo.simbolo,
        color: palo.color,
        nombrePalo: palo.nombre
      });
    });
  });

  mostrarCartasEnMesa();
  elementos.cartasRestantes.textContent = estado.cartasEnMesa.length;
}
// Nueva función para limpiar animaciones
function limpiarAnimaciones() {
  // Limpiar todos los timeouts pendientes
  estado.timeoutIds.forEach(id => clearTimeout(id));
  estado.timeoutIds = [];
  
  // Limpiar animaciones en curso
  estado.animacionesEnCurso = [];
  elementos.cartasContainer.innerHTML = '';
}
// Mostrar cartas en mesa con animación
function mostrarCartasEnMesa() {
  limpiarAnimaciones();
  elementos.cartasContainer.innerHTML = '';
  
  const palosSeleccionados = Array.from(
    document.querySelectorAll('input[name="palo"]:checked'), 
    cb => cb.value
  );
  const totalPalos = palosSeleccionados.length;

  estado.cartasEnMesa.forEach((carta, index) => {
    // Guardar el timeoutId correctamente
    const timeoutId = setTimeout(() => {
      const paloIndex = palosSeleccionados.indexOf(carta.palo);
      const cartaIndex = VALORES.indexOf(carta.valor);
      
      const anguloBase = 60;
      const anguloInicio = -anguloBase / 2;
      const anguloPorPalo = totalPalos > 1 ? anguloBase / (totalPalos - 1) : 0;
      const anguloPalo = totalPalos > 1 ? anguloInicio + (paloIndex * anguloPorPalo) : 0;
      const anguloCarta = (cartaIndex / (VALORES.length - 1)) * 30 - 15;
      const radio = 180 + (paloIndex * 30);
      const xPos = Math.sin((anguloPalo + anguloCarta) * Math.PI / 180) * radio;
      const yPos = -Math.cos((anguloPalo + anguloCarta) * Math.PI / 180) * radio + radio;
      const rotacion = anguloPalo + anguloCarta;

      const cartaElement = document.createElement("div");
      cartaElement.className = "carta";
      cartaElement.style.setProperty('--color', carta.color);
      cartaElement.style.transform = `
        translateX(${xPos}px)
        translateY(${yPos}px)
        rotate(${rotacion}deg)
      `;
      cartaElement.style.opacity = '0';
      cartaElement.style.transition = 'all 0.5s ease-out';
      
      cartaElement.innerHTML = `
        <div class="valor">${carta.valor}</div>
        <div class="palo">${carta.palo}</div>
      `;
      
      elementos.cartasContainer.appendChild(cartaElement);
      estado.animacionesEnCurso.push(cartaElement);
      
      void cartaElement.offsetWidth; // Forzar reflow
      cartaElement.style.opacity = '1';
    }, index * 100);
    
    estado.timeoutIds.push(timeoutId); // Ahora timeoutId está definido
  });
}

// Iniciar juego
function iniciarJuego() {
  try {
    if (estado.cartasEnMesa.length === 0) {
      throw new Error("Selecciona al menos un palo para jugar");
    }

    estado.enJuego = true;
    estado.cartasEnJuego = mezclarMazo([...estado.cartasEnMesa]);
    estado.cartasSacadas = [];
    estado.ultimaCartaSacada = null;
    
    elementos.btnPlay.textContent = 'Juego en curso...';
    elementos.btnPlay.disabled = true;
    elementos.preguntaContainer.hidden = false;
    elementos.cartasSalidas.innerHTML = '';
    elementos.contadorCartas.textContent = '0';
    elementos.cartasContainer.innerHTML = '';

    estado.mazoElement = document.createElement("div");
    estado.mazoElement.className = "mazo barajeando";
    estado.mazoElement.addEventListener('click', sacarCarta);
    elementos.cartasContainer.appendChild(estado.mazoElement);

    document.querySelectorAll('input[name="palo"]').forEach(checkbox => {
      checkbox.disabled = true;
    });

    setTimeout(() => {
      estado.mazoElement.classList.remove("barajeando");
    }, 1500);
    
  } catch (error) {
    console.error("Error al iniciar juego:", error);
    alert(error.message);
    elementos.btnPlay.disabled = false;
  }
}

// Sacar carta del mazo
function sacarCarta() {
  if (!estado.enJuego || estado.cartasEnJuego.length === 0) return;

  // Guardar referencia a la carta anterior para comparaciones
  const cartaAnterior = estado.ultimaCartaSacada;
  
  // Sacar nueva carta
  const carta = estado.cartasEnJuego.shift();
  estado.cartasSacadas.push(carta);
  estado.ultimaCartaSacada = carta;

  // Mostrar carta en zona de salidas
  const cartaElement = document.createElement("div");
  cartaElement.className = "carta-salida";
  cartaElement.style.setProperty('--color', carta.color);
  cartaElement.innerHTML = `
    <div class="valor">${carta.valor}</div>
    <div class="palo">${carta.palo}</div>
  `;
  elementos.cartasSalidas.appendChild(cartaElement);

  // Actualizar contadores
  elementos.contadorCartas.textContent = estado.cartasSacadas.length;
  elementos.cartasRestantes.textContent = estado.cartasEnJuego.length;
  
  // Calcular probabilidades
  calcularProbabilidades();

  // Resolver apuestas si hay carta anterior para comparar
  if (cartaAnterior) {
    resolverApuestas(cartaAnterior, carta);
  }

  // Verificar fin del juego
  if (estado.cartasEnJuego.length === 0) {
    finalizarJuego();
  }
}

// Resolver todas las apuestas pendientes
function resolverApuestas(cartaAnterior, cartaActual) {
  let hayResultados = false;
  let contenidoModal = '<h3>Resultados de Apuestas</h3>';

  estado.grupos.forEach(grupo => {
    grupo.apuestas.forEach((apuesta, index) => {
      if (!apuesta.resuelta) {
        let gana = false;
        
        switch(apuesta.tipo) {
          case 'mayor':
            gana = VALORES.indexOf(cartaActual.valor) > VALORES.indexOf(cartaAnterior.valor);
            break;
          case 'menor':
            gana = VALORES.indexOf(cartaActual.valor) < VALORES.indexOf(cartaAnterior.valor);
            break;
          case 'colorRojo':
            gana = cartaActual.color === '#e74c3c';
            break;
          case 'colorNegro':
            gana = cartaActual.color === '#2c3e50';
            break;
          case 'paloCorazones':
            gana = cartaActual.palo === '♥';
            break;
          case 'paloTreboles':
            gana = cartaActual.palo === '♣';
            break;
          case 'paloDiamantes':
            gana = cartaActual.palo === '♦';
            break;
          case 'paloPicas':
            gana = cartaActual.palo === '♠';
            break;
        }
        
        grupo.apuestas[index].resultado = gana;
        grupo.apuestas[index].resuelta = true;
        
        if (gana) {
          grupo.puntos += apuesta.puntos * 2; // Pagar 2:1
          contenidoModal += `
            <div class="resultado-ganador">
              <strong>${grupo.nombre}</strong>: Ganó ${apuesta.puntos * 2}p (${apuesta.tipo})
            </div>
          `;
        } else {
          contenidoModal += `
            <div class="resultado-perdedor">
              <strong>${grupo.nombre}</strong>: Perdió (${apuesta.tipo})
            </div>
          `;
        }
        actualizarUI();
        actualizarListaApuestas();
        hayResultados = true;
      }
    });
  });

  // Mostrar modal solo si hay resultados nuevos
  if (hayResultados && elementos.modalContenido) {
    elementos.modalContenido.innerHTML = contenidoModal;
    elementos.modalResultados.style.display = 'block';
    
    // Ocultar modal después de 3 segundos
    setTimeout(() => {
      elementos.modalResultados.style.display = 'none';
    }, 3000);
  }

  actualizarUI();
}

// Calcular probabilidades
function calcularProbabilidades() {
  if (estado.cartasSacadas.length === 0) return;
  
  const ultimaCarta = estado.cartasSacadas[estado.cartasSacadas.length - 1];
  const cartasRestantes = estado.cartasEnJuego.length;
  
  const mismoPalo = estado.cartasEnJuego.filter(c => c.palo === ultimaCarta.palo).length;
  const mismoColor = estado.cartasEnJuego.filter(c => 
    PALOS.find(p => p.simbolo === c.palo).color === ultimaCarta.color
  ).length;
  const valorIndex = VALORES.indexOf(ultimaCarta.valor);
  const mayorValor = estado.cartasEnJuego.filter(c => 
    VALORES.indexOf(c.valor) > valorIndex
  ).length;

  elementos.probabilidadTexto.innerHTML = `
    <div>Probabilidades:</div>
    <div>• Mismo palo: ${((mismoPalo / cartasRestantes) * 100).toFixed(1)}%</div>
    <div>• Mismo color: ${((mismoColor / cartasRestantes) * 100).toFixed(1)}%</div>
    <div>• Mayor valor: ${((mayorValor / cartasRestantes) * 100).toFixed(1)}%</div>
  `;
}

// Finalizar juego
function finalizarJuego() {
  estado.enJuego = false;
  elementos.btnPlay.textContent = 'Barajear y Jugar 🎲';
  elementos.btnPlay.disabled = false;
  elementos.probabilidadTexto.innerHTML = '<div class="fin-juego">¡Juego terminado!</div>';

  document.querySelectorAll('input[name="palo"]').forEach(checkbox => {
    checkbox.disabled = false;
  });
}

// Función para mezclar el mazo (Fisher-Yates)
function mezclarMazo(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
function finalizarJuego() {
  estado.enJuego = false;
  elementos.btnPlay.textContent = 'Barajear y Jugar 🎲';
  elementos.btnPlay.disabled = false;
  elementos.probabilidadTexto.innerHTML = '<div class="fin-juego">¡Juego terminado!</div>';

  document.querySelectorAll('input[name="palo"]').forEach(checkbox => {
    checkbox.disabled = false;
  });

  // Mostrar podio de ganadores
  mostrarPodio();
}

// Función para mostrar podio de ganadores
function mostrarPodio() {
  // Ordenar grupos por puntos (de mayor a menor)
  const gruposOrdenados = [...estado.grupos].sort((a, b) => b.puntos - a.puntos);
  
  // Agrupar por puntaje para manejar empates
  const podio = [];
  let posicionActual = 1;
  
  while (podio.length < 3 && posicionActual - 1 < gruposOrdenados.length) {
    const puntosActual = gruposOrdenados[posicionActual - 1].puntos;
    const gruposEnPosicion = gruposOrdenados.filter(g => g.puntos === puntosActual);
    
    podio.push({
      posicion: posicionActual,
      grupos: gruposEnPosicion,
      puntos: puntosActual
    });
    
    posicionActual += gruposEnPosicion.length;
  }

  // Construir contenido del modal
  let contenidoModal = '<h3>🏆 Podio de Ganadores 🏆</h3>';
  
  podio.forEach(item => {
    if (item.grupos.length === 1) {
      contenidoModal += `
        <div class="posicion-${item.posicion}">
          <div class="puesto">${item.posicion}° Lugar</div>
          <div class="grupo-ganador">${item.grupos[0].nombre} - ${item.puntos} puntos</div>
        </div>
      `;
    } else {
      contenidoModal += `
        <div class="posicion-${item.posicion}">
          <div class="puesto">${item.posicion}° Lugar (Empate)</div>
          <div class="grupos-empate">
            ${item.grupos.map(grupo => `
              <div class="grupo-ganador">${grupo.nombre} - ${item.puntos} puntos</div>
            `).join('')}
          </div>
        </div>
      `;
    }
  });

  // Mostrar modal
  if (elementos.modalContenido) {
    elementos.modalContenido.innerHTML = contenidoModal;
    elementos.modalResultados.style.display = 'block';
  }
}

// Iniciar la aplicación
document.addEventListener('DOMContentLoaded', init);