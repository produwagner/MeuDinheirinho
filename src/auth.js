/* MÓDULO DE AUTENTICAÇÃO - GOOGLE OAUTH 2.0 */

// Chave padrão de demonstração compartilhada (pode ser sobrescrita pelo usuário nas configurações do app)
export const DEFAULT_CLIENT_ID = '547096596172-fjrukqcnfb3abf833h3fb5uthpcunnv0.apps.googleusercontent.com';

let tokenClient = null;
let accessToken = null;
let tokenExpiresAt = 0;
let onAuthChangeCallback = null;

// Obter as credenciais salvas (Client ID personalizado)
export function getSavedClientId() {
  return DEFAULT_CLIENT_ID;
}

export function saveClientId(newClientId) {
  // Como a configuração foi descontinuada, esta função agora limpa a chave
  localStorage.removeItem('meudinheirinho_client_id');
}

/**
 * Inicializa o cliente Google Identity Services (GIS)
 * @param {Function} onStatusChange - Callback chamada quando o status de autenticação mudar
 */
export function initAuth(onStatusChange) {
  onAuthChangeCallback = onStatusChange;
  
  // Limpar qualquer resíduo do Client ID no localStorage
  localStorage.removeItem('meudinheirinho_client_id');
  
  // Tentar restaurar sessão existente do sessionStorage
  const savedToken = sessionStorage.getItem('meudinheirinho_access_token');
  const savedExpiresAt = sessionStorage.getItem('meudinheirinho_token_expires_at');
  const savedUser = sessionStorage.getItem('meudinheirinho_user_info');
  
  if (savedToken && savedExpiresAt && Number(savedExpiresAt) > Date.now()) {
    accessToken = savedToken;
    tokenExpiresAt = Number(savedExpiresAt);
    
    // Agendar logout quando o token expirar
    const msRemaining = tokenExpiresAt - Date.now();
    setTimeout(() => {
      logout();
    }, msRemaining);
    
    if (onAuthChangeCallback) {
      onAuthChangeCallback(true, JSON.parse(savedUser));
    }
  } else {
    if (onAuthChangeCallback) {
      onAuthChangeCallback(false, null);
    }
  }

  // Inicializar o cliente OAuth do Google
  try {
    const clientId = getSavedClientId();
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      callback: (tokenResponse) => {
        if (tokenResponse.error !== undefined) {
          console.error('Erro na autenticação Google:', tokenResponse);
          // Erros comuns: popup_closed_by_user, access_denied, origin_mismatch
          if (tokenResponse.error === 'popup_closed_by_user') {
            console.warn('Login cancelado pelo usuário.');
          } else if (tokenResponse.error === 'origin_mismatch') {
            alert('Erro de origem: a URL atual não está autorizada no Google Cloud Console para este Client ID. Adicione a origem correta nas credenciais OAuth.');
          } else {
            alert('Erro ao autenticar: ' + (tokenResponse.error_description || tokenResponse.error));
          }
          return;
        }

        // Sucesso na autenticação
        accessToken = tokenResponse.access_token;
        const expiresInSeconds = Number(tokenResponse.expires_in);
        tokenExpiresAt = Date.now() + (expiresInSeconds * 1000);

        // Salvar na sessão
        sessionStorage.setItem('meudinheirinho_access_token', accessToken);
        sessionStorage.setItem('meudinheirinho_token_expires_at', tokenExpiresAt);

        // Agendar expiração automática
        setTimeout(() => {
          logout();
        }, expiresInSeconds * 1000);

        // Obter informações básicas do perfil do usuário usando a API People/Oauth2
        fetchUserInfo(accessToken).then((userInfo) => {
          sessionStorage.setItem('meudinheirinho_user_info', JSON.stringify(userInfo));
          if (onAuthChangeCallback) {
            onAuthChangeCallback(true, userInfo);
          }
        });
      },
    });
    console.log('Google Identity Services inicializado com sucesso.');
  } catch (err) {
    console.error('Falha ao inicializar Google Identity Services Client:', err);
    tokenClient = null;
  }
}

/**
 * Aguarda o SDK do Google estar pronto e dispara o fluxo de login
 */
export function login() {
  const btn = document.getElementById('btn-login');
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = '0.7';
  }

  function tryLogin(attemptsLeft) {
    if (tokenClient) {
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '';
      }
      // Solicitar token (abre popup do Google)
      tokenClient.requestAccessToken({ prompt: 'consent' });
      return;
    }

    // SDK ainda não carregou — tentar inicializar
    if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
      initAuth(onAuthChangeCallback);
      if (tokenClient) {
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = '';
        }
        tokenClient.requestAccessToken({ prompt: 'consent' });
        return;
      }
    }

    if (attemptsLeft > 0) {
      setTimeout(() => tryLogin(attemptsLeft - 1), 200);
    } else {
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '';
      }
      alert('O SDK do Google não pôde ser carregado. Verifique sua conexão com a internet e recarregue a página.');
    }
  }

  // Tenta por até 5 segundos (25 tentativas x 200ms)
  tryLogin(25);
}

/**
 * Remove a autenticação
 */
export function logout() {
  if (accessToken) {
    google.accounts.oauth2.revokeToken(accessToken, () => {
      console.log('Token revogado no Google.');
    });
  }

  accessToken = null;
  tokenExpiresAt = 0;
  sessionStorage.removeItem('meudinheirinho_access_token');
  sessionStorage.removeItem('meudinheirinho_token_expires_at');
  sessionStorage.removeItem('meudinheirinho_user_info');
  localStorage.removeItem('meudinheirinho_custom_user_info');

  if (onAuthChangeCallback) {
    onAuthChangeCallback(false, null);
  }
}

/**
 * Retorna o token de acesso ativo ou null
 */
export function getAccessToken() {
  if (accessToken && tokenExpiresAt > Date.now()) {
    return accessToken;
  }
  return null;
}

export function isAuthenticated() {
  return getAccessToken() !== null;
}

/**
 * Busca info do usuário logado usando a API Oauth2 do Google
 */
async function fetchUserInfo(token) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (response.ok) {
      const data = await response.json();
      return {
        name: data.given_name || data.name || 'Usuário',
        avatar: data.picture || ''
      };
    }
  } catch (err) {
    console.error('Erro ao buscar perfil do usuário no Google:', err);
  }
  return { name: 'Usuário', avatar: '' };
}
