/* PONTO DE ENTRADA PRINCIPAL DA APLICAÇÃO (MAIN) */

import { initAuth, login, logout, getSavedClientId, saveClientId, isAuthenticated, DEFAULT_CLIENT_ID } from './auth.js';
import { 
  buscarOuCriarPlanilha, 
  carregarTransacoes, 
  carregarConfiguracoes, 
  adicionarTransacao, 
  adicionarTransacoesEmLote,
  salvarConfiguracoes,
  carregarPerfil,
  salvarPerfil
} from './sheets.js';
import { 
  initUI, 
  showLoading, 
  hideLoading, 
  updateUserInfo, 
  updateDashboard, 
  renderTransactionsTable, 
  renderSettingsForm,
  populateAccountSelectors,
  renderImportedTransactions
} from './ui.js';
import {
  saveGeminiKey,
  extrairTextoDoPDF,
  processarFaturaComGemini
} from './ai.js';

// Estado global em memória do aplicativo
let APP_STATE = {
  transactions: [],
  configs: {}
};

// Callback disparada quando o login/logout do Google muda de estado
async function handleAuthChange(loggedIn, userInfo) {
  const loginScreen = document.getElementById('login-screen');
  const appWorkspace = document.getElementById('app-workspace');

  if (loggedIn) {
    // 1. Mostrar layout do app e esconder tela de login
    loginScreen.classList.add('hidden');
    appWorkspace.classList.remove('hidden');
    updateUserInfo(userInfo);

    // 2. Sincronizar dados do Google Drive
    await sincronizarDados();
  } else {
    // Exibir tela de login e esconder app
    loginScreen.classList.remove('hidden');
    appWorkspace.classList.add('hidden');
    updateUserInfo(null);
    
    // Limpar estado
    APP_STATE.transactions = [];
    APP_STATE.configs = {};
  }
}

// Carrega tudo do Google Sheets e atualiza a interface
async function sincronizarDados() {
  showLoading('Sincronizando dados com o Google Drive...');
  try {
    // 1. Inicializar planilha (buscar no Drive ou criar)
    const sheetId = await buscarOuCriarPlanilha();
    
    // Atualizar UI com o link e ID da planilha
    const openSheetBtn = document.getElementById('btn-open-spreadsheet');
    if (openSheetBtn) {
      openSheetBtn.href = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
      openSheetBtn.classList.remove('hidden');
    }
    
    const settingsSheetId = document.getElementById('settings-sheet-id');
    if (settingsSheetId) {
      settingsSheetId.innerText = sheetId;
    }
    
    const statusBadge = document.getElementById('settings-connection-status');
    if (statusBadge) {
      statusBadge.innerText = 'Conectado';
      statusBadge.className = 'badge badge-success';
    }

    // 2. Carregar configurações, transações e perfil em paralelo
    const [configs, transactions, perfil] = await Promise.all([
      carregarConfiguracoes(),
      carregarTransacoes(),
      carregarPerfil()
    ]);

    APP_STATE.configs = configs;
    APP_STATE.transactions = transactions;

    // Sincronizar dados do perfil para o localStorage do navegador
    if (perfil && perfil.nome_usuario) {
      const customInfo = {
        name: perfil.nome_usuario,
        avatar: perfil.avatar_usuario || ''
      };
      localStorage.setItem('meudinheirinho_custom_user_info', JSON.stringify(customInfo));
      
      // Pegar as informações atuais do login para mesclar e atualizar a UI
      const savedUserStr = sessionStorage.getItem('meudinheirinho_user_info');
      const authUser = savedUserStr ? JSON.parse(savedUserStr) : { name: 'Usuário', avatar: '' };
      updateUserInfo(authUser);
    } else {
      // Se não existe perfil na planilha mas o usuário já tem perfil personalizado ou conta Google,
      // inicializar o perfil na planilha
      const savedUserStr = sessionStorage.getItem('meudinheirinho_user_info');
      if (savedUserStr) {
        try {
          const authUser = JSON.parse(savedUserStr);
          const customUserStr = localStorage.getItem('meudinheirinho_custom_user_info');
          let nameToSave = authUser.name || 'Usuário';
          let avatarToSave = '';
          
          if (customUserStr) {
            const customInfo = JSON.parse(customUserStr);
            nameToSave = customInfo.name || nameToSave;
            avatarToSave = customInfo.avatar || '';
          }
          
          await salvarPerfil({
            nome_usuario: nameToSave,
            avatar_usuario: avatarToSave
          });
        } catch (e) {
          console.error('Erro ao inicializar perfil na planilha:', e);
        }
      }
    }

    // Inicializar lista padrão de cartões caso seja a primeira vez
    if (APP_STATE.configs['cartoes_lista'] === undefined) {
      APP_STATE.configs['cartoes_lista'] = 'nubank,bb,mp';
      APP_STATE.configs['nubank_nome'] = 'Nubank';
      APP_STATE.configs['nubank_limite'] = '5950.00';
      APP_STATE.configs['nubank_fechamento'] = '6';
      APP_STATE.configs['nubank_vencimento'] = '15';
      
      APP_STATE.configs['bb_nome'] = 'Banco do Brasil';
      APP_STATE.configs['bb_limite'] = '1743.00';
      APP_STATE.configs['bb_fechamento'] = '3';
      APP_STATE.configs['bb_vencimento'] = '13';
      
      APP_STATE.configs['mp_nome'] = 'Mercado Pago';
      APP_STATE.configs['mp_limite'] = '4000.00';
      APP_STATE.configs['mp_fechamento'] = '9';
      APP_STATE.configs['mp_vencimento'] = '15';
      
      await salvarConfiguracoes(APP_STATE.configs);
    }

    // Sincronizar chave do Gemini da planilha para o localStorage do navegador
    if (APP_STATE.configs['gemini_api_key']) {
      saveGeminiKey(APP_STATE.configs['gemini_api_key']);
      const geminiKeyInput = document.getElementById('settings-gemini-key');
      if (geminiKeyInput) {
        geminiKeyInput.value = APP_STATE.configs['gemini_api_key'];
      }
    }

    // Alimentar seletores de contas e filtros
    populateAccountSelectors(APP_STATE.configs);

    // 3. Atualizar elementos visuais
    updateDashboard(APP_STATE.transactions, APP_STATE.configs);
    renderTransactionsTable(APP_STATE.transactions);
    renderSettingsForm(APP_STATE.configs);

    // Salvar data de sincronização na UI
    const syncTimeEl = document.getElementById('settings-last-sync');
    if (syncTimeEl) {
      syncTimeEl.innerText = new Date().toLocaleTimeString('pt-BR') + ' - ' + new Date().toLocaleDateString('pt-BR');
    }

  } catch (error) {
    console.error('Falha ao sincronizar dados:', error);
    alert(error.message || 'Erro ao sincronizar dados com o Google Drive.');
    
    const statusBadge = document.getElementById('settings-connection-status');
    if (statusBadge) {
      statusBadge.innerText = 'Erro de Conexão';
      statusBadge.className = 'badge badge-danger';
    }
  } finally {
    hideLoading();
  }
}

// Inicialização Geral
// NOTA: scripts type="module" são sempre diferidos (deferred), o DOM já está
// pronto quando o módulo executa — não precisamos de DOMContentLoaded.
(() => {
  // Inicializar ícones do Lucide (aguarda o CDN carregar se necessário)
  function initLucide(attemptsLeft) {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    } else if (attemptsLeft > 0) {
      setTimeout(() => initLucide(attemptsLeft - 1), 100);
    } else {
      console.warn('Lucide Icons não pôde ser carregado.');
    }
  }
  initLucide(30); // tenta por até 3 segundos

  // Vincular eventos de Login e Logout
  document.getElementById('btn-login').addEventListener('click', () => {
    login();
  });
  
  document.getElementById('btn-logout').addEventListener('click', logout);

  // Inicializar Módulo de UI e vincular Callbacks
  initUI({
    onTransactionsTabOpen: () => {
      // Atualizar tabela sempre que entrar na aba de transações
      renderTransactionsTable(APP_STATE.transactions);
    },
    
    onThemeChange: () => {
      // Redesenhar dashboard ao alternar tema para atualizar cores dos gráficos
      updateDashboard(APP_STATE.transactions, APP_STATE.configs);
    },
    
    onAddTransaction: async (tx) => {
      showLoading('Salvando transação na sua planilha...');
      try {
        await adicionarTransacao(tx);
        
        // Recarregar dados para manter sincronia perfeita
        const transactions = await carregarTransacoes();
        APP_STATE.transactions = transactions;
        
        updateDashboard(APP_STATE.transactions, APP_STATE.configs);
        renderTransactionsTable(APP_STATE.transactions);
      } catch (error) {
        console.error('Erro ao adicionar transação:', error);
        alert('Erro ao salvar transação: ' + error.message);
      } finally {
        hideLoading();
      }
    },
    
    onSaveSettings: async (novasConfigs) => {
      showLoading('Salvando limites de cartão...');
      try {
        await salvarConfiguracoes(novasConfigs);
        
        // Recarregar configurações atualizadas
        const configs = await carregarConfiguracoes();
        APP_STATE.configs = configs;
        
        updateDashboard(APP_STATE.transactions, APP_STATE.configs);
        renderSettingsForm(APP_STATE.configs);
        alert('Configurações salvas com sucesso!');
      } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        alert('Erro ao salvar limites: ' + error.message);
      } finally {
        hideLoading();
      }
    },

    onAddCard: async (newCard) => {
      showLoading('Adicionando novo cartão...');
      try {
        // Normalizar ID do cartão (remover acentos e caracteres especiais)
        let cardId = newCard.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '_');
        if (!cardId) cardId = 'cartao_' + Date.now();
        if (APP_STATE.configs[`${cardId}_limite`] !== undefined) {
          cardId += '_' + Date.now().toString().slice(-4);
        }

        const cardListStr = APP_STATE.configs['cartoes_lista'] || '';
        const cardList = cardListStr.split(',').filter(x => x.trim() !== '');
        cardList.push(cardId);

        // Atualizar configurações em memória
        APP_STATE.configs['cartoes_lista'] = cardList.join(',');
        APP_STATE.configs[`${cardId}_nome`] = newCard.name;
        APP_STATE.configs[`${cardId}_limite`] = String(newCard.limit);
        APP_STATE.configs[`${cardId}_fechamento`] = String(newCard.closing);
        APP_STATE.configs[`${cardId}_vencimento`] = String(newCard.due);

        // Gravar tudo no Google Sheets
        await salvarConfiguracoes(APP_STATE.configs);

        // Recarregar configs para perfeita sincronia
        const configs = await carregarConfiguracoes();
        APP_STATE.configs = configs;

        // Atualizar UI
        populateAccountSelectors(APP_STATE.configs);
        updateDashboard(APP_STATE.transactions, APP_STATE.configs);
        renderSettingsForm(APP_STATE.configs);
        alert('Cartão adicionado com sucesso!');
      } catch (error) {
        console.error('Erro ao adicionar cartão:', error);
        alert('Erro ao adicionar cartão: ' + error.message);
      } finally {
        hideLoading();
      }
    },

    onDeleteCard: async (cardId) => {
      showLoading('Excluindo cartão...');
      try {
        const cardListStr = APP_STATE.configs['cartoes_lista'] || '';
        let cardList = cardListStr.split(',').filter(x => x.trim() !== '');
        cardList = cardList.filter(id => id !== cardId);

        // Atualizar lista em memória
        APP_STATE.configs['cartoes_lista'] = cardList.join(',');

        // Salvar a nova lista no Sheets
        await salvarConfiguracoes({ cartoes_lista: APP_STATE.configs['cartoes_lista'] });

        // Recarregar configs
        const configs = await carregarConfiguracoes();
        APP_STATE.configs = configs;

        // Atualizar UI
        populateAccountSelectors(APP_STATE.configs);
        updateDashboard(APP_STATE.transactions, APP_STATE.configs);
        renderSettingsForm(APP_STATE.configs);
      } catch (error) {
        console.error('Erro ao excluir cartão:', error);
        alert('Erro ao excluir cartão: ' + error.message);
      } finally {
        hideLoading();
      }
    },
    
    onFilterChange: () => {
      renderTransactionsTable(APP_STATE.transactions);
    },

    onPeriodChange: () => {
      updateDashboard(APP_STATE.transactions, APP_STATE.configs);
    },

    onAddRecurringSalary: async (salaryData) => {
      const { startDate, frequency, value, occurrences, account, description } = salaryData;

      // Gerar lançamentos recorrentes
      const transactionsToAdd = [];
      const baseDate = new Date(startDate + 'T12:00:00');
      for (let i = 0; i < occurrences; i++) {
        const nextDate = new Date(baseDate);
        if (frequency === 'Semanal') {
          nextDate.setDate(baseDate.getDate() + (i * 7));
        } else if (frequency === 'Quinzenal') {
          nextDate.setDate(baseDate.getDate() + (i * 14));
        } else {
          // Mensal
          nextDate.setMonth(baseDate.getMonth() + i);
        }

        const yyyy = nextDate.getFullYear();
        const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
        const dd = String(nextDate.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        transactionsToAdd.push({
          date: dateStr,
          type: 'Receita',
          category: 'Salário',
          value: value,
          account: account,
          description: occurrences > 1 ? `${description} (${i + 1}/${occurrences})` : description
        });
      }

      showLoading(`Lançando ${occurrences} salários recorrentes...`);
      try {
        await adicionarTransacoesEmLote(transactionsToAdd);

        // Recarregar do sheets
        const transactions = await carregarTransacoes();
        APP_STATE.transactions = transactions;

        updateDashboard(APP_STATE.transactions, APP_STATE.configs);
        renderTransactionsTable(APP_STATE.transactions);
        alert(`${occurrences} lançamentos de salário registrados com sucesso!`);
      } catch (error) {
        console.error('Erro ao adicionar salário recorrente:', error);
        alert('Erro ao salvar os lançamentos de salário: ' + error.message);
      } finally {
        hideLoading();
      }
    },
    
    onSyncNow: async () => {
      await sincronizarDados();
    },
    
    onSwitchAccount: () => {
      logout();
      login();
    },

    onSaveGeminiKey: async (key) => {
      saveGeminiKey(key);
      showLoading('Salvando chave do Gemini na planilha...');
      try {
        APP_STATE.configs['gemini_api_key'] = key;
        await salvarConfiguracoes({ gemini_api_key: key });
        alert('Chave de API do Gemini salva e sincronizada com sucesso!');
      } catch (error) {
        console.error('Erro ao salvar chave do Gemini na planilha:', error);
        alert('Chave salva no navegador, mas houve um erro ao sincronizar com o Drive: ' + error.message);
      } finally {
        hideLoading();
      }
    },

    onSaveProfile: async (perfilData) => {
      showLoading('Sincronizando perfil com a planilha...');
      try {
        const customInfo = {
          name: perfilData.name,
          avatar: perfilData.avatar || ''
        };
        localStorage.setItem('meudinheirinho_custom_user_info', JSON.stringify(customInfo));

        await salvarPerfil({
          nome_usuario: perfilData.name,
          avatar_usuario: perfilData.avatar || ''
        });

        const savedUserStr = sessionStorage.getItem('meudinheirinho_user_info');
        const authUser = savedUserStr ? JSON.parse(savedUserStr) : { name: 'Usuário', avatar: '' };
        updateUserInfo(authUser);
        alert('Perfil atualizado e sincronizado com sucesso!');
      } catch (error) {
        console.error('Erro ao salvar perfil na planilha:', error);
        alert('Perfil salvo localmente, mas houve um erro ao sincronizar com o Drive: ' + error.message);
      } finally {
        hideLoading();
      }
    },

    onProcessInvoiceFile: async (file, apiKey) => {
      try {
        const texto = await extrairTextoDoPDF(file);
        const transacoes = await processarFaturaComGemini(texto, apiKey);
        renderImportedTransactions(transacoes);
      } catch (error) {
        console.error('Falha na extração por IA:', error);
        throw error;
      }
    },

    onConfirmImport: async (selectedTxs) => {
      showLoading(`Salvando ${selectedTxs.length} transações no Google Sheets...`);
      try {
        // Salvar em lote
        await adicionarTransacoesEmLote(selectedTxs);
        
        // Recarregar transações do sheets
        const transactions = await carregarTransacoes();
        APP_STATE.transactions = transactions;
        
        // Atualizar Dashboard e Histórico
        updateDashboard(APP_STATE.transactions, APP_STATE.configs);
        renderTransactionsTable(APP_STATE.transactions);
        
        alert(`${selectedTxs.length} transações registradas com sucesso!`);
      } catch (error) {
        console.error('Erro ao registrar importações:', error);
        alert('Erro ao salvar as transações: ' + error.message);
      } finally {
        hideLoading();
      }
    }
  });

  // Inicializar autenticação Google (aguardando o carregamento do SDK)
  function inicializarQuandoGoogleCarregar() {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
      initAuth(handleAuthChange);
    } else {
      setTimeout(inicializarQuandoGoogleCarregar, 100);
    }
  }
  inicializarQuandoGoogleCarregar();
})();
