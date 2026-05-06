let favoritos = [];
let usuariosAtuais = [];

// Inicializa a aplicação
document.addEventListener('DOMContentLoaded', () => {
  registrarServiceWorker();
  buscarLocalizacao();
  
  // Carrega usuários se não houver nenhum na tela inicial
  if(usuariosAtuais.length === 0) {
    carregarUsuarios();
  }
});

// Registra o Service Worker
function registrarServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW registrado com sucesso!', reg))
      .catch(err => console.error('Erro ao registrar SW:', err));
  }
}

// Busca localização via Hardware API
function buscarLocalizacao() {
  const msgElement = document.getElementById('location-msg');
  
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Mock de uma cidade baseada nas coordenadas para não precisar de API de Geocoding extra
        // Na prática, você usaria as coords (position.coords.latitude/longitude) em uma API de mapas.
        msgElement.textContent = "🗺️ Localização obtida com sucesso";
      },
      (error) => {
        console.warn('Geolocalização não permitida ou erro:', error);
      }
    );
  } else {
    msgElement.textContent = "Geolocalização não suportada no seu dispositivo.";
  }
}

// Função para buscar os usuários da API
async function carregarUsuarios() {
  const container = document.getElementById('container');
  container.innerHTML = '<div class="loader">Carregando usuários...</div>';

  try {
    const response = await fetch('https://randomuser.me/api/?results=6');
    const data = await response.json();
    usuariosAtuais = data.results;
    renderizar();
  } catch (error) {
    container.innerHTML = '<div class="loader">Erro ao carregar dados. Verifique sua conexão (Offline).</div>';
    console.error(error);
    
    // Se falhar e tiver favoritos, mostra os favoritos
    if(favoritos.length > 0) {
      renderizar(true);
    }
  }
}

// Renderiza a lista na tela
function renderizar(apenasFavoritos = false) {
  const container = document.getElementById('container');
  container.innerHTML = '';

  let todos = [];
  if (apenasFavoritos) {
    todos = [...favoritos];
  } else {
    // Mostra favoritos primeiro e depois os não favoritos
    const naoFavoritos = usuariosAtuais.filter(u => !favoritos.find(f => f.login.uuid === u.login.uuid));
    todos = [...favoritos, ...naoFavoritos];
  }

  todos.forEach(user => {
    const isFav = favoritos.find(u => u.login.uuid === user.login.uuid);
    
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="info">
        <div class="name">${user.name.first} ${user.name.last}</div>
        <div class="email">${user.email}</div>
        <div class="city">${user.location.city}, ${user.location.country}</div>
      </div>
      <button 
        class="star-btn ${isFav ? 'fav' : ''}" 
        aria-label="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
        onclick='toggleFavorito(${JSON.stringify(user)})'
      >
        ${isFav ? '★' : '☆'}
      </button>
    `;

    container.appendChild(card);
  });
}

// Adiciona ou remove dos favoritos e usa Vibration API
window.toggleFavorito = function(user) {
  const existe = favoritos.find(u => u.login.uuid === user.login.uuid);

  if (existe) {
    favoritos = favoritos.filter(u => u.login.uuid !== user.login.uuid);
  } else {
    favoritos.push(user);
    // Feedback tátil: Vibração de 50ms quando favoritar!
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }

  renderizar();
}
