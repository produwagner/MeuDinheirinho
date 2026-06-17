/* MÓDULO DE INTERFACE DO USUÁRIO (UI) */

let categoryChart = null;
let dailyChart = null;
let isEditingCards = false;

// Inicializa ouvintes de eventos da interface
export function initUI(callbacks) {
  // 1. Alternar Abas (Tabs)
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const targetTab = link.getAttribute('data-tab');
      
      // Remover classe active de todos os nav links e tab panes
      navLinks.forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      
      // Adicionar active no link clicado e aba correta
      link.classList.add('active');
      document.getElementById(`tab-${targetTab}`).classList.add('active');

      if (targetTab === 'transactions' && callbacks.onTransactionsTabOpen) {
        callbacks.onTransactionsTabOpen();
      }
    });
  });

  // 2. Controlar Modal de Lançamentos
  const modal = document.getElementById('modal-transaction');
  const btnQuick = document.getElementById('btn-quick-transaction');
  const btnAdd = document.getElementById('btn-add-transaction');
  const btnClose = document.getElementById('btn-close-modal');
  const btnCancel = document.getElementById('btn-cancel-modal');
  const formTx = document.getElementById('form-transaction');

  const openModal = () => {
    // Definir data padrão como hoje
    document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
    modal.classList.remove('hidden');
  };

  const closeModal = () => {
    formTx.reset();
    modal.classList.add('hidden');
  };

  if (btnQuick) btnQuick.addEventListener('click', openModal);
  if (btnAdd) btnAdd.addEventListener('click', openModal);
  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);

  // Fechar clicando fora da caixinha
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // 3. Submissão do Formulário de Transação
  formTx.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = document.getElementById('tx-date').value;
    const type = document.getElementById('tx-type').value;
    const category = document.getElementById('tx-category').value;
    const value = Math.abs(parseFloat(document.getElementById('tx-value').value));
    const account = document.getElementById('tx-account').value;
    const description = document.getElementById('tx-description').value;

    if (callbacks.onAddTransaction) {
      callbacks.onAddTransaction({ date, type, category, value, account, description });
    }
    closeModal();
  });

  // 4. Submissão do Formulário de Configurações de Cartões
  const formSettings = document.getElementById('form-settings-cards');
  if (formSettings) {
    formSettings.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const cardInputs = document.querySelectorAll('#settings-cards-container input');
      const updatedConfigs = {};
      
      cardInputs.forEach(input => {
        const idParts = input.id.split('-'); // ["config", cardId, field]
        if (idParts.length === 3) {
          const cardId = idParts[1];
          const field = idParts[2]; // "limit", "closing", "due"
          
          const keyMap = { limit: 'limite', closing: 'fechamento', due: 'vencimento' };
          const configKey = `${cardId}_${keyMap[field]}`;
          updatedConfigs[configKey] = input.value;
        }
      });

      if (callbacks.onSaveSettings) {
        callbacks.onSaveSettings(updatedConfigs);
      }

      // Concluir edição de cartões após salvar
      isEditingCards = false;
      const containerEl = document.getElementById('credit-cards-container');
      const btnToggle = document.getElementById('btn-toggle-edit-cards');
      const btnIcon = document.getElementById('edit-cards-btn-icon');
      const btnText = document.getElementById('edit-cards-btn-text');
      
      formSettings.classList.add('hidden');
      if (containerEl) containerEl.classList.remove('hidden');
      if (btnToggle) btnToggle.className = 'btn btn-secondary';
      if (btnIcon) btnIcon.setAttribute('data-lucide', 'settings');
      if (btnText) btnText.innerText = 'Personalizar';
      if (window.lucide) {
        window.lucide.createIcons();
      }
    });
  }

  // 5. Filtros de Transações
  const filters = ['filter-search', 'filter-month', 'filter-type', 'filter-account'];
  filters.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        if (callbacks.onFilterChange) {
          callbacks.onFilterChange();
        }
      });
    }
  });

  // 6. Botão Sincronizar Agora
  const btnSync = document.getElementById('btn-sync-now');
  if (btnSync && callbacks.onSyncNow) {
    btnSync.addEventListener('click', callbacks.onSyncNow);
  }

  // 7. Controlar Modal de Cadastro de Cartão
  const cardModal = document.getElementById('modal-add-card');
  const btnShowAddCard = document.getElementById('btn-show-add-card');
  const btnCloseCardModal = document.getElementById('btn-close-card-modal');
  const btnCancelCardModal = document.getElementById('btn-cancel-card-modal');
  const formAddCard = document.getElementById('form-add-card');

  const openCardModal = () => {
    cardModal.classList.remove('hidden');
  };

  const closeCardModal = () => {
    formAddCard.reset();
    cardModal.classList.add('hidden');
  };

  const btnShowAddCardFromTab = document.getElementById('btn-show-add-card-from-tab');

  if (btnShowAddCard) btnShowAddCard.addEventListener('click', openCardModal);
  if (btnShowAddCardFromTab) btnShowAddCardFromTab.addEventListener('click', openCardModal);
  if (btnCloseCardModal) btnCloseCardModal.addEventListener('click', closeCardModal);
  if (btnCancelCardModal) btnCancelCardModal.addEventListener('click', closeCardModal);

  const btnToggleEditCards = document.getElementById('btn-toggle-edit-cards');
  if (btnToggleEditCards) {
    btnToggleEditCards.addEventListener('click', () => {
      isEditingCards = !isEditingCards;
      
      const formEl = document.getElementById('form-settings-cards');
      const containerEl = document.getElementById('credit-cards-container');
      const btnIcon = document.getElementById('edit-cards-btn-icon');
      const btnText = document.getElementById('edit-cards-btn-text');
      
      if (isEditingCards) {
        if (formEl) formEl.classList.remove('hidden');
        if (containerEl) containerEl.classList.add('hidden');
        btnToggleEditCards.className = 'btn btn-primary';
        if (btnIcon) btnIcon.setAttribute('data-lucide', 'check-circle');
        if (btnText) btnText.innerText = 'Concluir';
      } else {
        if (formEl) formEl.classList.add('hidden');
        if (containerEl) containerEl.classList.remove('hidden');
        btnToggleEditCards.className = 'btn btn-secondary';
        if (btnIcon) btnIcon.setAttribute('data-lucide', 'settings');
        if (btnText) btnText.innerText = 'Personalizar';
      }
      if (window.lucide) {
        window.lucide.createIcons();
      }
    });
  }

  cardModal.addEventListener('click', (e) => {
    if (e.target === cardModal) closeCardModal();
  });

  formAddCard.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('card-new-name').value;
    const limit = parseFloat(document.getElementById('card-new-limit').value);
    const closing = parseInt(document.getElementById('card-new-closing').value);
    const due = parseInt(document.getElementById('card-new-due').value);

    if (callbacks.onAddCard) {
      callbacks.onAddCard({ name, limit, closing, due });
    }
    closeCardModal();
  });

  // 8. Event Delegation para Excluir Cartão
  const cardsSettingsContainer = document.getElementById('settings-cards-container');
  if (cardsSettingsContainer) {
    cardsSettingsContainer.addEventListener('click', (e) => {
      const btnDelete = e.target.closest('.btn-delete-card');
      if (btnDelete) {
        const cardId = btnDelete.getAttribute('data-id');
        const cardName = btnDelete.getAttribute('data-name');
        if (confirm(`Deseja realmente excluir o cartão "${cardName}"?`)) {
          if (callbacks.onDeleteCard) {
            callbacks.onDeleteCard(cardId);
          }
        }
      }
    });
  }

  // 9. Controlar Expansão do Menu Flutuante para Perfil
  const headerNav = document.querySelector('.header-nav');
  const btnProfile = document.getElementById('btn-profile');
  const btnCloseNavProfile = document.getElementById('btn-close-nav-profile');
  const btnLogoutNav = document.querySelector('.btn-logout-nav');

  const expandNavMenu = () => {
    if (headerNav) headerNav.classList.add('expanded');
  };

  const collapseNavMenu = () => {
    if (headerNav) headerNav.classList.remove('expanded');
  };

  if (btnProfile) {
    btnProfile.addEventListener('click', (e) => {
      e.stopPropagation(); // Evita fechar imediatamente ao propagar para document
      if (headerNav) {
        if (headerNav.classList.contains('expanded')) {
          collapseNavMenu();
        } else {
          expandNavMenu();
        }
      }
    });
  }

  if (btnCloseNavProfile) {
    btnCloseNavProfile.addEventListener('click', (e) => {
      e.stopPropagation();
      collapseNavMenu();
    });
  }

  if (btnLogoutNav) {
    btnLogoutNav.addEventListener('click', () => {
      collapseNavMenu();
    });
  }

  // Fechar ao clicar fora do menu
  document.addEventListener('click', (e) => {
    if (headerNav && headerNav.classList.contains('expanded')) {
      if (!headerNav.contains(e.target) && e.target !== btnProfile) {
        collapseNavMenu();
      }
    }
  });

  // 10. Controlar Modal de Edição de Perfil
  const profileModal = document.getElementById('modal-edit-profile');
  const btnEditProfile = document.getElementById('btn-edit-profile');
  const btnCloseProfileModal = document.getElementById('btn-close-profile-modal');
  const btnCancelProfileModal = document.getElementById('btn-cancel-profile-modal');
  const formEditProfile = document.getElementById('form-edit-profile');

  const openProfileModal = () => {
    const savedUserStr = sessionStorage.getItem('meudinheirinho_user_info');
    const customUserStr = localStorage.getItem('meudinheirinho_custom_user_info');
    let activeUser = savedUserStr ? JSON.parse(savedUserStr) : { name: '', avatar: '' };
    if (customUserStr) {
      try {
        activeUser = { ...activeUser, ...JSON.parse(customUserStr) };
      } catch (e) {
        console.error('Erro ao ler customização:', e);
      }
    }

    const nameInput = document.getElementById('profile-edit-name');
    if (nameInput) nameInput.value = activeUser.name || '';
    
    const avatarInput = document.getElementById('profile-edit-avatar');
    if (avatarInput) avatarInput.value = activeUser.avatar || '';
    
    profileModal.classList.remove('hidden');
    // Forçar atualização do Lucide no modal recém-exibido
    if (window.lucide) {
      window.lucide.createIcons();
    }
  };

  const closeProfileModal = () => {
    formEditProfile.reset();
    profileModal.classList.add('hidden');
  };

  if (btnEditProfile) {
    btnEditProfile.addEventListener('click', (e) => {
      e.stopPropagation();
      collapseNavMenu();
      openProfileModal();
    });
  }
  if (btnCloseProfileModal) btnCloseProfileModal.addEventListener('click', closeProfileModal);
  if (btnCancelProfileModal) btnCancelProfileModal.addEventListener('click', closeProfileModal);

  profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) closeProfileModal();
  });

  formEditProfile.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('profile-edit-name').value;
    
    // Processar arquivo de imagem se selecionado
    const fileInput = document.getElementById('profile-edit-avatar-file');
    let avatar = '';
    
    // Manter o avatar customizado anterior se o usuário não escolheu um arquivo novo
    const customUserStr = localStorage.getItem('meudinheirinho_custom_user_info');
    if (customUserStr) {
      try {
        const prevCustom = JSON.parse(customUserStr);
        avatar = prevCustom.avatar || '';
      } catch (err) {
        console.error('Erro ao ler avatar anterior:', err);
      }
    }

    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      try {
        showLoading('Processando imagem do perfil...');
        avatar = await redimensionarImagem(fileInput.files[0]);
      } catch (err) {
        console.error('Erro ao redimensionar imagem:', err);
        alert('Falha ao processar a imagem: ' + err.message);
      } finally {
        hideLoading();
      }
    }

    if (callbacks.onSaveProfile) {
      await callbacks.onSaveProfile({ name, avatar });
    } else {
      const customInfo = { name, avatar };
      localStorage.setItem('meudinheirinho_custom_user_info', JSON.stringify(customInfo));
      const savedUserStr = sessionStorage.getItem('meudinheirinho_user_info');
      const authUser = savedUserStr ? JSON.parse(savedUserStr) : { name: 'Usuário', avatar: '' };
      updateUserInfo(authUser);
    }
    
    // Limpar o input de arquivo
    if (fileInput) fileInput.value = '';
    
    closeProfileModal();
  });

  const btnSwitchGoogleAccount = document.getElementById('btn-switch-google-account');
  if (btnSwitchGoogleAccount) {
    btnSwitchGoogleAccount.addEventListener('click', () => {
      closeProfileModal();
      if (callbacks.onSwitchAccount) {
        callbacks.onSwitchAccount();
      }
    });
  }

  const btnOpenSettings = document.getElementById('btn-open-settings');
  if (btnOpenSettings) {
    btnOpenSettings.addEventListener('click', (e) => {
      e.stopPropagation();
      collapseNavMenu();
      
      // Remover active de todos os links e panes
      navLinks.forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      
      // Exibir aba de configurações
      const settingsTab = document.getElementById('tab-settings');
      if (settingsTab) settingsTab.classList.add('active');
    });
  }

  // 11. Controlar Tema (Claro / Escuro)
  const applyTheme = (theme) => {
    const iconEl = document.getElementById('theme-btn-icon');
    const textEl = document.getElementById('theme-btn-text');
    
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      if (iconEl) iconEl.setAttribute('data-lucide', 'moon');
      if (textEl) textEl.innerText = 'Tema Escuro';
    } else {
      document.body.classList.remove('light-theme');
      if (iconEl) iconEl.setAttribute('data-lucide', 'sun');
      if (textEl) textEl.innerText = 'Tema Claro';
    }
    
    localStorage.setItem('meudinheirinho_theme', theme);
    
    if (window.lucide) {
      window.lucide.createIcons();
    }

    if (callbacks.onThemeChange) {
      callbacks.onThemeChange();
    }
  };

  const btnToggleTheme = document.getElementById('btn-toggle-theme');
  if (btnToggleTheme) {
    btnToggleTheme.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentTheme = localStorage.getItem('meudinheirinho_theme') || 'dark';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
      collapseNavMenu();
    });
  }

  // Inicializar tema no carregamento
  const initialTheme = localStorage.getItem('meudinheirinho_theme') || 'dark';
  applyTheme(initialTheme);

  // ==========================================================
  // CONFIGURAÇÕES E EVENTOS DA IA DO GEMINI E UPLOAD DE PDF (NOVO)
  // ==========================================================
  
  // 12. Visualização e Salvamento da Chave de API do Gemini nos Ajustes
  const geminiKeyInput = document.getElementById('settings-gemini-key');
  const btnSaveGeminiKey = document.getElementById('btn-save-gemini-key');
  const btnToggleGeminiKeyVisibility = document.getElementById('btn-toggle-gemini-key-visibility');

  if (geminiKeyInput) {
    const savedKey = localStorage.getItem('meudinheirinho_gemini_key') || '';
    geminiKeyInput.value = savedKey;
  }

  if (btnSaveGeminiKey && geminiKeyInput) {
    btnSaveGeminiKey.addEventListener('click', () => {
      const key = geminiKeyInput.value.trim();
      if (callbacks.onSaveGeminiKey) {
        callbacks.onSaveGeminiKey(key);
      }
    });
  }

  if (btnToggleGeminiKeyVisibility && geminiKeyInput) {
    btnToggleGeminiKeyVisibility.addEventListener('click', () => {
      const isPassword = geminiKeyInput.getAttribute('type') === 'password';
      geminiKeyInput.setAttribute('type', isPassword ? 'text' : 'password');
      
      const iconEl = btnToggleGeminiKeyVisibility.querySelector('i');
      if (iconEl) {
        iconEl.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
        if (window.lucide) {
          window.lucide.createIcons();
        }
      }
    });
  }

  // 13. Controle do Modal de Importação de Fatura PDF
  const importModal = document.getElementById('modal-import-invoice');
  const btnImportInvoice = document.getElementById('btn-import-invoice');
  const btnCloseImportModal = document.getElementById('btn-close-import-modal');
  const btnCancelImport = document.getElementById('btn-cancel-import');
  const btnProcessInvoice = document.getElementById('btn-process-invoice');
  const btnBackToUpload = document.getElementById('btn-back-to-upload');
  const btnSaveImported = document.getElementById('btn-save-imported');

  const dropZone = document.getElementById('drop-zone');
  const fileInputPdf = document.getElementById('file-input-pdf');
  const btnBrowseFile = document.getElementById('btn-browse-file');
  const selectedFileInfo = document.getElementById('selected-file-info');
  const selectedFileName = document.getElementById('selected-file-name');
  const selectedFileSize = document.getElementById('selected-file-size');

  let selectedFile = null;

  const showImportStep = (stepName) => {
    document.querySelectorAll('.import-step').forEach(step => step.classList.add('hidden'));
    const stepEl = document.getElementById(`import-step-${stepName}`);
    if (stepEl) stepEl.classList.remove('hidden');
  };

  const openImportModal = () => {
    selectedFile = null;
    if (fileInputPdf) fileInputPdf.value = '';
    if (selectedFileInfo) selectedFileInfo.classList.add('hidden');
    if (btnProcessInvoice) btnProcessInvoice.setAttribute('disabled', 'true');
    if (dropZone) dropZone.classList.remove('dragover');
    
    // Popular o select de contas de destino
    const importAccountTarget = document.getElementById('import-account-target');
    const txAccountSelect = document.getElementById('tx-account');
    if (importAccountTarget && txAccountSelect) {
      importAccountTarget.innerHTML = txAccountSelect.innerHTML;
    }

    showImportStep('upload');
    if (importModal) importModal.classList.remove('hidden');
    if (window.lucide) {
      window.lucide.createIcons();
    }
  };

  const closeImportModal = () => {
    if (importModal) importModal.classList.add('hidden');
  };

  if (btnImportInvoice) btnImportInvoice.addEventListener('click', openImportModal);
  if (btnCloseImportModal) btnCloseImportModal.addEventListener('click', closeImportModal);
  if (btnCancelImport) btnCancelImport.addEventListener('click', closeImportModal);
  if (btnBackToUpload) btnBackToUpload.addEventListener('click', () => showImportStep('upload'));

  if (importModal) {
    importModal.addEventListener('click', (e) => {
      const loadingEl = document.getElementById('import-step-loading');
      const isLoadingStep = loadingEl && !loadingEl.classList.contains('hidden');
      if (e.target === importModal && !isLoadingStep) {
        closeImportModal();
      }
    });
  }

  // Eventos de Drag & Drop
  const handleFileSelection = (file) => {
    if (file && file.type === 'application/pdf') {
      selectedFile = file;
      if (selectedFileName) selectedFileName.innerText = file.name;
      
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      if (selectedFileSize) selectedFileSize.innerText = `(${sizeMB} MB)`;
      
      if (selectedFileInfo) selectedFileInfo.classList.remove('hidden');
      if (btnProcessInvoice) btnProcessInvoice.removeAttribute('disabled');
    } else {
      alert('Por favor, envie apenas faturas em formato PDF.');
      selectedFile = null;
      if (selectedFileInfo) selectedFileInfo.classList.add('hidden');
      if (btnProcessInvoice) btnProcessInvoice.setAttribute('disabled', 'true');
    }
  };

  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelection(e.dataTransfer.files[0]);
      }
    });

    if (btnBrowseFile && fileInputPdf) {
      btnBrowseFile.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInputPdf.click();
      });
    }

    fileInputPdf.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelection(e.target.files[0]);
      }
    });
  }

  if (btnProcessInvoice) {
    btnProcessInvoice.addEventListener('click', async () => {
      if (!selectedFile) return;
      
      const apiKey = localStorage.getItem('meudinheirinho_gemini_key');
      if (!apiKey) {
        alert('Por favor, cadastre sua chave de API do Gemini nos Ajustes antes de processar faturas.');
        closeImportModal();
        
        // Redirecionar para Ajustes
        const navLinksList = document.querySelectorAll('.nav-link');
        navLinksList.forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        const settingsTab = document.getElementById('tab-settings');
        if (settingsTab) settingsTab.classList.add('active');
        return;
      }

      showImportStep('loading');

      if (callbacks.onProcessInvoiceFile) {
        try {
          await callbacks.onProcessInvoiceFile(selectedFile, apiKey);
        } catch (error) {
          alert(error.message || 'Falha ao processar o documento.');
          showImportStep('upload');
        }
      }
    });
  }

  if (btnSaveImported) {
    btnSaveImported.addEventListener('click', () => {
      const selectedTxs = [];
      const rows = document.querySelectorAll('#imported-transactions-body tr');
      const targetAccount = document.getElementById('import-account-target').value;

      rows.forEach(row => {
        const checkbox = row.querySelector('.tx-import-check');
        if (checkbox && checkbox.checked) {
          const date = row.querySelector('.tx-import-date').value;
          const description = row.querySelector('.tx-import-desc').value;
          const category = row.querySelector('.tx-import-cat').value;
          const valInput = row.querySelector('.tx-import-val');
          const value = valInput ? Math.abs(parseFloat(valInput.value) || 0) : 0;
          const type = row.querySelector('.tx-import-type').value;

          if (value > 0) {
            selectedTxs.push({
              date,
              description,
              category,
              value,
              type,
              account: targetAccount
            });
          }
        }
      });

      if (selectedTxs.length === 0) {
        alert('Nenhuma transação selecionada para importação.');
        return;
      }

      if (callbacks.onConfirmImport) {
        callbacks.onConfirmImport(selectedTxs);
        closeImportModal();
      }
    });
  }

  // 14. Eventos do Seletor de Período no Dashboard
  const storedPeriod = localStorage.getItem('meudinheirinho_dashboard_period') || 'mensal';
  const periodButtons = document.querySelectorAll('.btn-period');
  periodButtons.forEach(btn => {
    if (btn.getAttribute('data-period') === storedPeriod) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
    btn.addEventListener('click', () => {
      periodButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      localStorage.setItem('meudinheirinho_dashboard_period', btn.getAttribute('data-period'));
      if (callbacks.onPeriodChange) {
        callbacks.onPeriodChange();
      }
    });
  });

  // 14b. Eventos do Seletor de Modo de Visualização no Dashboard
  const storedViewMode = localStorage.getItem('meudinheirinho_dashboard_view_mode') || 'ultimos';
  const viewModeButtons = document.querySelectorAll('.btn-view-mode');
  viewModeButtons.forEach(btn => {
    if (btn.getAttribute('data-mode') === storedViewMode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
    btn.addEventListener('click', () => {
      viewModeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      localStorage.setItem('meudinheirinho_dashboard_view_mode', btn.getAttribute('data-mode'));
      if (callbacks.onPeriodChange) {
        callbacks.onPeriodChange();
      }
    });
  });

  // 15. Controlar Modal de Salário Recorrente
  const salaryModal = document.getElementById('modal-recurring-salary');
  const btnAddSalary = document.getElementById('btn-add-salary');
  const btnCloseSalaryModal = document.getElementById('btn-close-salary-modal');
  const btnCancelSalaryModal = document.getElementById('btn-cancel-salary-modal');
  const formSalary = document.getElementById('form-recurring-salary');

  const openSalaryModal = () => {
    // Definir data padrão como hoje
    const dateInput = document.getElementById('sal-start-date');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Clonar as opções do select de transação para o de salário se necessário
    const salAccountSelect = document.getElementById('sal-account');
    const txAccountSelect = document.getElementById('tx-account');
    if (salAccountSelect && txAccountSelect) {
      salAccountSelect.innerHTML = txAccountSelect.innerHTML;
    }
    
    if (salaryModal) salaryModal.classList.remove('hidden');
    if (window.lucide) {
      window.lucide.createIcons();
    }
  };

  const closeSalaryModal = () => {
    if (formSalary) formSalary.reset();
    if (salaryModal) salaryModal.classList.add('hidden');
  };

  if (btnAddSalary) btnAddSalary.addEventListener('click', openSalaryModal);
  if (btnCloseSalaryModal) btnCloseSalaryModal.addEventListener('click', closeSalaryModal);
  if (btnCancelSalaryModal) btnCancelSalaryModal.addEventListener('click', closeSalaryModal);

  if (salaryModal) {
    salaryModal.addEventListener('click', (e) => {
      if (e.target === salaryModal) closeSalaryModal();
    });
  }

  if (formSalary) {
    formSalary.addEventListener('submit', (e) => {
      e.preventDefault();
      const startDate = document.getElementById('sal-start-date').value;
      const frequency = document.getElementById('sal-frequency').value;
      const value = Math.abs(parseFloat(document.getElementById('sal-value').value));
      const occurrences = parseInt(document.getElementById('sal-occurrences').value, 10);
      const account = document.getElementById('sal-account').value;
      const description = document.getElementById('sal-description').value;

      if (callbacks.onAddRecurringSalary) {
        callbacks.onAddRecurringSalary({ startDate, frequency, value, occurrences, account, description });
      }
      closeSalaryModal();
    });
  }
}

// Helpers para exibir / ocultar loading
export function showLoading(text = 'Aguarde...') {
  document.getElementById('loading-text').innerText = text;
  document.getElementById('global-loading').classList.remove('hidden');
}

export function hideLoading() {
  document.getElementById('global-loading').classList.add('hidden');
}

// Atualizar cabeçalho do perfil do usuário e menu flutuante de perfil
export function updateUserInfo(userInfo) {
  const customUserStr = localStorage.getItem('meudinheirinho_custom_user_info');
  if (customUserStr && userInfo) {
    try {
      const customInfo = JSON.parse(customUserStr);
      userInfo = { ...userInfo, ...customInfo };
    } catch (e) {
      console.error('Erro ao ler customização de perfil:', e);
    }
  }

  const avatarEl = document.getElementById('user-avatar');
  const initialEl = document.getElementById('user-initial');
  
  const navProfileAvatar = document.getElementById('nav-profile-avatar');
  const navProfileInitial = document.getElementById('nav-profile-initial');
  const navProfileName = document.getElementById('nav-profile-name');
  const welcomeMsg = document.getElementById('welcome-message');

  if (userInfo) {
    const firstLetter = userInfo.name ? userInfo.name.trim().charAt(0) : 'U';
    
    // Configurar iniciais
    if (initialEl) {
      initialEl.innerText = firstLetter;
    }
    if (navProfileInitial) {
      navProfileInitial.innerText = firstLetter;
    }
    
    // Configurar nome na gaveta do menu
    if (navProfileName) {
      navProfileName.innerText = userInfo.name;
    }

    // Configurar mensagem de boas-vindas no painel (apenas Olá, Primeiro Nome)
    if (welcomeMsg) {
      const firstName = userInfo.name ? userInfo.name.trim().split(' ')[0] : 'Usuário';
      welcomeMsg.innerText = `Olá, ${firstName}`;
    }

    // Configurar avatares
    if (userInfo.avatar) {
      if (avatarEl) {
        avatarEl.src = userInfo.avatar;
        avatarEl.classList.remove('hidden');
      }
      if (initialEl) {
        initialEl.classList.add('hidden');
      }
      
      if (navProfileAvatar) {
        navProfileAvatar.src = userInfo.avatar;
        navProfileAvatar.classList.remove('hidden');
      }
      if (navProfileInitial) {
        navProfileInitial.classList.add('hidden');
      }
    } else {
      if (avatarEl) {
        avatarEl.classList.add('hidden');
      }
      if (initialEl) {
        initialEl.classList.remove('hidden');
      }
      
      if (navProfileAvatar) {
        navProfileAvatar.src = '';
        navProfileAvatar.classList.add('hidden');
      }
      if (navProfileInitial) {
        navProfileInitial.classList.remove('hidden');
      }
    }
  } else {
    // Resetar
    if (avatarEl) avatarEl.classList.add('hidden');
    if (initialEl) {
      initialEl.innerText = 'U';
      initialEl.classList.remove('hidden');
    }
    
    if (navProfileAvatar) {
      navProfileAvatar.src = '';
      navProfileAvatar.classList.add('hidden');
    }
    if (navProfileInitial) {
      navProfileInitial.innerText = 'U';
      navProfileInitial.classList.remove('hidden');
    }
    if (navProfileName) {
      navProfileName.innerText = 'Desconectado';
    }
    if (welcomeMsg) {
      welcomeMsg.innerText = 'Olá, Usuário';
    }
  }
}

// Formatação monetária BRL
export function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Função para calcular gastos de um cartão com base no ciclo de faturamento
function getBillingCycleSum(transactions, cardName, closingDay) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11
  
  let cycleStart, cycleEnd;
  const todayDay = now.getDate();
  const closingDayNum = Number(closingDay) || 5;

  if (todayDay > closingDayNum) {
    cycleStart = new Date(currentYear, currentMonth, closingDayNum + 1);
    cycleEnd = new Date(currentYear, currentMonth + 1, closingDayNum);
  } else {
    cycleStart = new Date(currentYear, currentMonth - 1, closingDayNum + 1);
    cycleEnd = new Date(currentYear, currentMonth, closingDayNum);
  }
  
  // Setar meio-dia para evitar variações de fuso horário local
  cycleStart.setHours(0, 0, 0, 0);
  cycleEnd.setHours(23, 59, 59, 999);

  return transactions
    .filter(tx => {
      if (tx.type !== 'Despesa' || tx.account !== cardName) return false;
      const txDate = new Date(tx.date + 'T12:00:00');
      return txDate >= cycleStart && txDate <= cycleEnd;
    })
    .reduce((sum, tx) => sum + tx.value, 0);
}

// Atualiza o painel principal Dashboard
export function updateDashboard(transactions, configs) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  // Obter período ativo e modo de visualização
  const activePeriod = localStorage.getItem('meudinheirinho_dashboard_period') || 'mensal';
  const viewMode = localStorage.getItem('meudinheirinho_dashboard_view_mode') || 'ultimos';

  // Helper para obter a data/hora exata de uma transação
  function getTxDate(tx) {
    if (tx.id && tx.id.startsWith('tx_')) {
      const parts = tx.id.split('_');
      const ts = Number(parts[1]);
      if (!isNaN(ts) && ts > 0) {
        return new Date(ts);
      }
    }
    return new Date(tx.date + 'T12:00:00');
  }

  // 1. Filtrar transações baseado no período ativo e modo de visualização para os cards de KPI
  let filteredTxs = [];
  let periodSubtitle = '';
  let kpiPeriodLabel = '';
  let positiveBalanceText = '';
  let negativeBalanceText = '';

  // Preparar estruturas para o gráfico de linha de evolução
  let daysLabels = [];
  let cumulativeExpenses = [];

  if (viewMode === 'ultimos') {
    // MODO: Últimos X
    if (activePeriod === 'diario') {
      const oneDayMs = 24 * 60 * 60 * 1000;
      filteredTxs = transactions.filter(tx => {
        const txDate = getTxDate(tx);
        const diff = now.getTime() - txDate.getTime();
        return diff >= 0 && diff <= oneDayMs;
      });
      periodSubtitle = 'Últimas 24 horas';
      kpiPeriodLabel = 'Últimas 24h';
      positiveBalanceText = 'Balanço positivo nas últimas 24h';
      negativeBalanceText = 'Gasto superior ao recebido nas últimas 24h';

      // Gráfico: 24h (de 23h atrás até a hora atual)
      const hourlyExpenses = Array(24).fill(0);
      const startHourTime = new Date(now.getTime() - 23 * 60 * 60 * 1000);
      startHourTime.setMinutes(0, 0, 0); // Alinhar ao início da hora

      for (let i = 0; i < 24; i++) {
        const slotTime = new Date(startHourTime.getTime() + i * 60 * 60 * 1000);
        daysLabels.push(String(slotTime.getHours()).padStart(2, '0') + 'h');
      }

      transactions.forEach(tx => {
        if (tx.type === 'Despesa') {
          const txDate = getTxDate(tx);
          const diff = txDate.getTime() - startHourTime.getTime();
          if (diff >= 0 && diff < 24 * 60 * 60 * 1000) {
            const slotIdx = Math.floor(diff / (60 * 60 * 1000));
            if (slotIdx >= 0 && slotIdx < 24) {
              hourlyExpenses[slotIdx] += tx.value;
            }
          }
        }
      });

      cumulativeExpenses = hourlyExpenses;

    } else if (activePeriod === 'semanal') {
      const last7DaysStr = [];
      const startOf7Days = new Date(now);
      startOf7Days.setDate(now.getDate() - 6);
      startOf7Days.setHours(0, 0, 0, 0);

      for (let i = 0; i < 7; i++) {
        const d = new Date(startOf7Days);
        d.setDate(startOf7Days.getDate() + i);
        const dStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        last7DaysStr.push(dStr);
        daysLabels.push(String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'));
      }

      filteredTxs = transactions.filter(tx => last7DaysStr.includes(tx.date));
      periodSubtitle = 'Últimos 7 dias';
      kpiPeriodLabel = 'Últimos 7 dias';
      positiveBalanceText = 'Balanço positivo nos últimos 7 dias';
      negativeBalanceText = 'Gasto superior nos últimos 7 dias';

      const dailyExpenses = Array(7).fill(0);
      transactions.forEach(tx => {
        if (tx.type === 'Despesa') {
          const idx = last7DaysStr.indexOf(tx.date);
          if (idx !== -1) {
            dailyExpenses[idx] += tx.value;
          }
        }
      });

      cumulativeExpenses = dailyExpenses;

    } else if (activePeriod === 'anual') {
      const monthsKeys = [];
      const startMonthDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);

      for (let i = 0; i < 12; i++) {
        const d = new Date(startMonthDate.getFullYear(), startMonthDate.getMonth() + i, 1);
        const year = d.getFullYear();
        const month = d.getMonth();
        monthsKeys.push(`${year}-${String(month + 1).padStart(2, '0')}`);

        const labelMonthName = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        const capitalizedMonthName = labelMonthName.charAt(0).toUpperCase() + labelMonthName.slice(1);
        daysLabels.push(`${capitalizedMonthName}/${String(year).slice(-2)}`);
      }

      filteredTxs = transactions.filter(tx => {
        const txParts = tx.date.split('-');
        if (txParts.length === 3) {
          return monthsKeys.includes(`${txParts[0]}-${txParts[1]}`);
        }
        return false;
      });
      periodSubtitle = 'Últimos 12 meses';
      kpiPeriodLabel = 'Últimos 12 meses';
      positiveBalanceText = 'Balanço positivo nos últimos 12 meses';
      negativeBalanceText = 'Gasto superior nos últimos 12 meses';

      const monthlyExpenses = Array(12).fill(0);
      transactions.forEach(tx => {
        if (tx.type === 'Despesa') {
          const txParts = tx.date.split('-');
          if (txParts.length === 3) {
            const txYearMonth = `${txParts[0]}-${txParts[1]}`;
            const idx = monthsKeys.indexOf(txYearMonth);
            if (idx !== -1) {
              monthlyExpenses[idx] += tx.value;
            }
          }
        }
      });

      cumulativeExpenses = monthlyExpenses;

    } else {
      // mensal (últimos 30 dias)
      const last30DaysStr = [];
      const startOf30Days = new Date(now);
      startOf30Days.setDate(now.getDate() - 29);
      startOf30Days.setHours(0, 0, 0, 0);

      for (let i = 0; i < 30; i++) {
        const d = new Date(startOf30Days);
        d.setDate(startOf30Days.getDate() + i);
        const dStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        last30DaysStr.push(dStr);
        daysLabels.push(String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'));
      }

      filteredTxs = transactions.filter(tx => last30DaysStr.includes(tx.date));
      periodSubtitle = 'Últimos 30 dias';
      kpiPeriodLabel = 'Últimos 30 dias';
      positiveBalanceText = 'Balanço positivo nos últimos 30 dias';
      negativeBalanceText = 'Gasto superior nos últimos 30 dias';

      const dailyExpenses = Array(30).fill(0);
      transactions.forEach(tx => {
        if (tx.type === 'Despesa') {
          const idx = last30DaysStr.indexOf(tx.date);
          if (idx !== -1) {
            dailyExpenses[idx] += tx.value;
          }
        }
      });

      cumulativeExpenses = dailyExpenses;
    }

  } else {
    // MODO: Período Atual (Calendário)
    if (activePeriod === 'diario') {
      const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      filteredTxs = transactions.filter(tx => tx.date === todayStr);
      periodSubtitle = 'Hoje (24h)';
      kpiPeriodLabel = 'Hoje';
      positiveBalanceText = 'Balanço positivo hoje';
      negativeBalanceText = 'Gasto superior hoje';

      // Gráfico: 24h de hoje (00:00 às 23:00)
      daysLabels = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0') + 'h');
      const hourlyExpenses = Array(24).fill(0);

      transactions.forEach(tx => {
        if (tx.type === 'Despesa' && tx.date === todayStr) {
          const txDate = getTxDate(tx);
          const hour = txDate.getHours();
          if (hour >= 0 && hour < 24) {
            hourlyExpenses[hour] += tx.value;
          }
        }
      });

      cumulativeExpenses = hourlyExpenses;

    } else if (activePeriod === 'semanal') {
      const currentDay = now.getDay();
      const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
      const mondayDate = new Date(now);
      mondayDate.setDate(now.getDate() - distanceToMonday);
      mondayDate.setHours(0, 0, 0, 0);

      const weekDaysStr = [];
      daysLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
      for (let i = 0; i < 7; i++) {
        const d = new Date(mondayDate);
        d.setDate(mondayDate.getDate() + i);
        const dStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        weekDaysStr.push(dStr);
      }

      filteredTxs = transactions.filter(tx => weekDaysStr.includes(tx.date));
      periodSubtitle = 'Esta semana (Segunda a Domingo)';
      kpiPeriodLabel = 'Semana Atual';
      positiveBalanceText = 'Balanço positivo na semana';
      negativeBalanceText = 'Gasto superior na semana';

      const dailyExpenses = Array(7).fill(0);
      transactions.forEach(tx => {
        if (tx.type === 'Despesa') {
          const idx = weekDaysStr.indexOf(tx.date);
          if (idx !== -1) {
            dailyExpenses[idx] += tx.value;
          }
        }
      });

      cumulativeExpenses = dailyExpenses;

    } else if (activePeriod === 'anual') {
      filteredTxs = transactions.filter(tx => {
        const txDate = new Date(tx.date + 'T12:00:00');
        return txDate.getFullYear() === currentYear;
      });
      periodSubtitle = `Janeiro a Dezembro de ${currentYear}`;
      kpiPeriodLabel = `Ano Atual (${currentYear})`;
      positiveBalanceText = 'Balanço positivo no ano';
      negativeBalanceText = 'Gasto superior no ano';

      daysLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthlyExpenses = Array(12).fill(0);
      transactions.forEach(tx => {
        if (tx.type === 'Despesa') {
          const txDate = new Date(tx.date + 'T12:00:00');
          if (txDate.getFullYear() === currentYear) {
            monthlyExpenses[txDate.getMonth()] += tx.value;
          }
        }
      });

      cumulativeExpenses = monthlyExpenses;

    } else {
      // mensal (Mês vigente)
      filteredTxs = transactions.filter(tx => {
        const txDate = new Date(tx.date + 'T12:00:00');
        return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
      });
      const monthName = now.toLocaleDateString('pt-BR', { month: 'long' });
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      periodSubtitle = `Mês vigente (${capitalizedMonth})`;
      kpiPeriodLabel = capitalizedMonth;
      positiveBalanceText = 'Balanço positivo no mês';
      negativeBalanceText = 'Gasto superior no mês';

      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      daysLabels = Array.from({ length: lastDayOfMonth }, (_, i) => String(i + 1).padStart(2, '0'));
      const dailyExpenses = Array(lastDayOfMonth).fill(0);

      filteredTxs
        .filter(tx => tx.type === 'Despesa')
        .forEach(tx => {
          const txDate = new Date(tx.date + 'T12:00:00');
          const day = txDate.getDate();
          if (day >= 1 && day <= lastDayOfMonth) {
            dailyExpenses[day - 1] += tx.value;
          }
        });

      cumulativeExpenses = dailyExpenses;
    }
  }

  const totalReceived = filteredTxs
    .filter(tx => tx.type === 'Receita')
    .reduce((sum, tx) => sum + tx.value, 0);

  const totalSpent = filteredTxs
    .filter(tx => tx.type === 'Despesa')
    .reduce((sum, tx) => sum + tx.value, 0);

  const totalSaved = filteredTxs
    .filter(tx => tx.type === 'Poupança')
    .reduce((sum, tx) => sum + tx.value, 0);

  const balance = totalReceived - totalSpent - totalSaved;

  // Atualizar rótulos dos KPIs com o período correto
  const receivedLabel = document.getElementById('kpi-received-label');
  const spentLabel = document.getElementById('kpi-spent-label');
  const savedLabel = document.getElementById('kpi-saved-label');
  const balanceLabel = document.getElementById('kpi-balance-label');

  if (receivedLabel) receivedLabel.innerText = `Recebido (${kpiPeriodLabel})`;
  if (spentLabel) spentLabel.innerText = `Gasto (${kpiPeriodLabel})`;
  if (savedLabel) savedLabel.innerText = `Poupado (${kpiPeriodLabel})`;
  if (balanceLabel) balanceLabel.innerText = `Resultado (${kpiPeriodLabel})`;

  // Atualizar DOM dos KPIs
  document.getElementById('kpi-received').innerText = formatBRL(totalReceived);
  document.getElementById('kpi-spent').innerText = formatBRL(totalSpent);
  document.getElementById('kpi-saved').innerText = formatBRL(totalSaved);
  
  const balanceEl = document.getElementById('kpi-balance');
  const balanceIcon = document.getElementById('kpi-balance-icon');
  const balanceFooter = document.getElementById('kpi-balance-footer');
  
  balanceEl.innerText = formatBRL(balance);
  if (balance >= 0) {
    balanceEl.className = 'kpi-value color-success';
    if (balanceIcon) {
      balanceIcon.classList.remove('color-danger', 'color-primary');
      balanceIcon.classList.add('color-success');
      balanceIcon.setAttribute('data-lucide', 'scale');
    }
    if (balanceFooter) balanceFooter.innerText = positiveBalanceText;
  } else {
    balanceEl.className = 'kpi-value color-danger';
    if (balanceIcon) {
      balanceIcon.classList.remove('color-success', 'color-primary');
      balanceIcon.classList.add('color-danger');
      balanceIcon.setAttribute('data-lucide', 'alert-circle');
    }
    if (balanceFooter) balanceFooter.innerText = negativeBalanceText;
  }

  // Re-desenhar ícones Lucide atualizados
  lucide.createIcons();

  // 2. Atualizar Cartões de Crédito Dinamicamente (sempre usando todas as transações, baseado no ciclo atual)
  const cardsContainer = document.getElementById('credit-cards-container');
  if (cardsContainer) {
    cardsContainer.innerHTML = '';
    
    const cardIdsStr = configs['cartoes_lista'];
    const cardIds = cardIdsStr ? cardIdsStr.split(',').filter(id => id.trim() !== '') : [];

    if (cardIds.length === 0) {
      cardsContainer.innerHTML = `<p class="text-muted text-center" style="padding: 20px;">Nenhum cartão cadastrado.</p>`;
    } else {
      // Cores para rotacionar o visual
      const colorStyles = ['purple', 'yellow', 'blue', 'indigo', 'rose', 'emerald'];
      
      cardIds.forEach((id, idx) => {
        const cardName = configs[`${id}_nome`] || id;
        const limit = Number(configs[`${id}_limite`]) || 0;
        const closing = Number(configs[`${id}_fechamento`]) || 5;
        const due = Number(configs[`${id}_vencimento`]) || 15;
        
        const billSum = getBillingCycleSum(transactions, cardName, closing);
        const pct = limit > 0 ? Math.min((billSum / limit) * 100, 100) : 0;
        
        const colorClass = colorStyles[idx % colorStyles.length];
        
        const cardItem = document.createElement('div');
        cardItem.className = `credit-card-item card-${colorClass}`;
        cardItem.innerHTML = `
          <div class="card-item-header">
            <span class="card-brand"><i data-lucide="credit-card" class="${colorClass}-icon"></i> ${cardName}</span>
            <span class="card-dates">Fecha dia ${String(closing).padStart(2, '0')} | Vence dia ${String(due).padStart(2, '0')}</span>
          </div>
          <div class="card-progress-bar-wrapper">
            <div class="card-progress-bar">
              <div class="progress-fill ${colorClass}-fill" style="width: ${pct}%"></div>
            </div>
          </div>
          <div class="card-values">
            <span>Fatura: <strong>${formatBRL(billSum)}</strong></span>
            <span>Limite: <span>${formatBRL(limit)}</span></span>
          </div>
        `;
        cardsContainer.appendChild(cardItem);
      });
      
      // Atualizar ícones recém-criados
      lucide.createIcons();
    }
  }

  // Atualizar mensagens de "sem dados" nos gráficos dinamicamente
  const dailyNoDataEl = document.getElementById('daily-chart-no-data');
  if (dailyNoDataEl) {
    const dailyNoDataTextEl = dailyNoDataEl.querySelector('p');
    if (dailyNoDataTextEl) {
      if (activePeriod === 'diario') {
        dailyNoDataTextEl.innerText = viewMode === 'ultimos' ? 'Nenhuma despesa registrada nas últimas 24 horas.' : 'Nenhuma despesa registrada hoje.';
      } else if (activePeriod === 'semanal') {
        dailyNoDataTextEl.innerText = viewMode === 'ultimos' ? 'Nenhuma despesa registrada nos últimos 7 dias.' : 'Nenhuma despesa registrada nesta semana.';
      } else if (activePeriod === 'anual') {
        dailyNoDataTextEl.innerText = viewMode === 'ultimos' ? 'Nenhuma despesa registrada nos últimos 12 meses.' : 'Nenhuma despesa registrada neste ano.';
      } else {
        dailyNoDataTextEl.innerText = viewMode === 'ultimos' ? 'Nenhuma despesa registrada nos últimos 30 dias.' : 'Nenhuma despesa registrada neste mês.';
      }
    }
  }

  const catNoDataEl = document.getElementById('chart-no-data');
  if (catNoDataEl) {
    const catNoDataTextEl = catNoDataEl.querySelector('p');
    if (catNoDataTextEl) {
      if (activePeriod === 'diario') {
        catNoDataTextEl.innerText = viewMode === 'ultimos' ? 'Nenhuma despesa registrada nas últimas 24 horas.' : 'Nenhuma despesa registrada hoje.';
      } else if (activePeriod === 'semanal') {
        catNoDataTextEl.innerText = viewMode === 'ultimos' ? 'Nenhuma despesa registrada nos últimos 7 dias.' : 'Nenhuma despesa registrada nesta semana.';
      } else if (activePeriod === 'anual') {
        catNoDataTextEl.innerText = viewMode === 'ultimos' ? 'Nenhuma despesa registrada nos últimos 12 meses.' : 'Nenhuma despesa registrada neste ano.';
      } else {
        catNoDataTextEl.innerText = viewMode === 'ultimos' ? 'Nenhuma despesa registrada nos últimos 30 dias.' : 'Nenhuma despesa registrada neste mês.';
      }
    }
  }

  // 3. Gerar Gráfico de Pizza de Categorias
  const expensesByCategory = {};
  filteredTxs
    .filter(tx => tx.type === 'Despesa')
    .forEach(tx => {
      expensesByCategory[tx.category] = (expensesByCategory[tx.category] || 0) + tx.value;
    });

  renderCategoryChart(expensesByCategory);

  // 4. Atualizar legenda de subtítulo do gráfico
  const chartSubtitleEl = document.getElementById('daily-chart-period-subtitle');
  if (chartSubtitleEl) {
    chartSubtitleEl.innerText = periodSubtitle;
  }

  renderDailyChart(cumulativeExpenses, daysLabels);
}

// Desenha ou atualiza o gráfico de pizza de categorias
function renderCategoryChart(dataObj) {
  const ctx = document.getElementById('category-chart');
  const noDataEl = document.getElementById('chart-no-data');
  const categories = Object.keys(dataObj);
  const values = Object.values(dataObj);

  const chartContainer = ctx.parentElement;

  if (categories.length === 0) {
    chartContainer.classList.add('hidden');
    noDataEl.classList.remove('hidden');
    if (categoryChart) {
      categoryChart.destroy();
      categoryChart = null;
    }
    return;
  }

  chartContainer.classList.remove('hidden');
  noDataEl.classList.add('hidden');

  // Cores correspondentes das categorias
  const categoryColorMap = {
    'Alimentação': '#38bdf8', // Sky Blue
    'Transporte': '#f43f5e', // Rose
    'Moradia': '#a855f7', // Purple
    'Lazer': '#eab308', // Yellow
    'Saúde': '#10b981', // Emerald
    'Outros': '#64748b' // Muted Gray
  };

  const colors = categories.map(cat => categoryColorMap[cat] || '#818cf8');
  const isLightTheme = document.body.classList.contains('light-theme');
  const borderColor = isLightTheme ? '#ffffff' : '#14182b'; // panel-bg equivalent
  const textColor = isLightTheme ? '#475569' : '#94a3b8';

  if (categoryChart) {
    categoryChart.data.labels = categories;
    categoryChart.data.datasets[0].data = values;
    categoryChart.data.datasets[0].backgroundColor = colors;
    categoryChart.data.datasets[0].borderColor = borderColor;
    categoryChart.options.plugins.legend.labels.color = textColor;
    categoryChart.update();
  } else {
    categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: borderColor
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: textColor,
              font: {
                family: 'Inter',
                size: 11
              },
              padding: 15
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const val = context.raw;
                return ` ${context.label}: ${formatBRL(val)}`;
              }
            }
          }
        },
        cutout: '65%'
      }
    });
  }
}

// Desenha ou atualiza o gráfico de linha de evolução diária de gastos
function renderDailyChart(expensesValues, labels) {
  const ctx = document.getElementById('daily-chart');
  const noDataEl = document.getElementById('daily-chart-no-data');
  const chartContainer = ctx.parentElement;

  const totalExpenses = expensesValues.reduce((sum, val) => sum + val, 0);

  if (totalExpenses === 0) {
    chartContainer.classList.add('hidden');
    noDataEl.classList.remove('hidden');
    if (dailyChart) {
      dailyChart.destroy();
      dailyChart = null;
    }
    return;
  }

  chartContainer.classList.remove('hidden');
  noDataEl.classList.add('hidden');

  const isLightTheme = document.body.classList.contains('light-theme');
  const lineColor = isLightTheme ? '#4f46e5' : '#818cf8'; // Indigo no light, light indigo no dark
  const fillColor = isLightTheme ? 'rgba(79, 70, 229, 0.05)' : 'rgba(129, 140, 248, 0.05)';
  const gridColor = isLightTheme ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)';
  const textColor = isLightTheme ? '#475569' : '#94a3b8';

  if (dailyChart) {
    dailyChart.data.labels = labels;
    dailyChart.data.datasets[0].data = expensesValues;
    dailyChart.data.datasets[0].borderColor = lineColor;
    dailyChart.data.datasets[0].backgroundColor = fillColor;
    dailyChart.data.datasets[0].pointBackgroundColor = lineColor;
    dailyChart.options.scales.x.grid.color = gridColor;
    dailyChart.options.scales.x.ticks.color = textColor;
    dailyChart.options.scales.y.grid.color = gridColor;
    dailyChart.options.scales.y.ticks.color = textColor;
    dailyChart.update();
  } else {
    dailyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Gasto',
          data: expensesValues,
          borderColor: lineColor,
          backgroundColor: fillColor,
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 1,
          pointHoverRadius: 4,
          pointBackgroundColor: lineColor
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return ' Gasto: ' + formatBRL(context.parsed.y);
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              font: {
                family: 'Inter',
                size: 10
              }
            }
          },
          y: {
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              font: {
                family: 'Inter',
                size: 10
              },
              callback: function(value) {
                return 'R$ ' + value;
              }
            }
          }
        }
      }
    });
  }
}

// Popula a tabela de Transações com filtros aplicados
export function renderTransactionsTable(transactions) {
  const tbody = document.getElementById('transactions-table-body');
  tbody.innerHTML = '';

  // 1. Obter valores dos filtros
  const searchVal = document.getElementById('filter-search').value.toLowerCase();
  const monthVal = document.getElementById('filter-month').value;
  const typeVal = document.getElementById('filter-type').value;
  const accountVal = document.getElementById('filter-account').value;

  // 2. Filtrar
  const filtered = transactions.filter(tx => {
    // Busca por descrição ou categoria
    const matchSearch = tx.description.toLowerCase().includes(searchVal) || 
                        tx.category.toLowerCase().includes(searchVal);
    
    // Filtro de mês
    let matchMonth = true;
    if (monthVal !== 'all') {
      const txMonth = new Date(tx.date + 'T12:00:00').getMonth();
      matchMonth = txMonth === Number(monthVal);
    }

    // Filtro de tipo
    const matchType = typeVal === 'all' || tx.type === typeVal;

    // Filtro de conta/cartão
    const matchAccount = accountVal === 'all' || tx.account === accountVal;

    return matchSearch && matchMonth && matchType && matchAccount;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Nenhum lançamento corresponde aos filtros.</td></tr>`;
    return;
  }

  // Ordenar transações por data decrescente (mais recente primeiro)
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 3. Renderizar linhas
  filtered.forEach(tx => {
    const tr = document.createElement('tr');
    
    // Icone de acordo com o tipo
    let iconHTML = '';
    let badgeClass = '';
    if (tx.type === 'Receita') {
      iconHTML = '<i data-lucide="chevron-up" class="color-success" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;"></i>';
      badgeClass = 'badge-success';
    } else if (tx.type === 'Despesa') {
      iconHTML = '<i data-lucide="chevron-down" class="color-danger" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;"></i>';
      badgeClass = 'badge-danger';
    } else {
      iconHTML = '<i data-lucide="piggy-bank" class="color-info" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;"></i>';
      badgeClass = 'badge-info';
    }

    // Formatar data humana DD/MM/AAAA
    const parts = tx.date.split('-');
    const dateFormatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : tx.date;

    tr.innerHTML = `
      <td>${dateFormatted}</td>
      <td><span class="badge ${badgeClass}">${tx.type}</span></td>
      <td>${tx.category}</td>
      <td>${iconHTML} ${tx.account}</td>
      <td><strong>${tx.description}</strong></td>
      <td class="text-right ${tx.type === 'Receita' ? 'color-success' : tx.type === 'Despesa' ? 'color-danger' : 'color-info'}">
        <strong>${tx.type === 'Receita' ? '+' : '-'}&nbsp;${formatBRL(tx.value)}</strong>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Ativar ícones gerados
  lucide.createIcons();
}

export function renderSettingsForm(configs) {
  const container = document.getElementById('settings-cards-container');
  if (!container) return;

  container.innerHTML = '';
  const cardIdsStr = configs['cartoes_lista'];
  const cardIds = cardIdsStr ? cardIdsStr.split(',').filter(id => id.trim() !== '') : [];

  if (cardIds.length === 0) {
    container.innerHTML = `<p class="text-muted text-center" style="padding: 20px;">Nenhum cartão cadastrado. Use o botão "+ Novo Cartão" para adicionar.</p>`;
    return;
  }

  cardIds.forEach(id => {
    const cardName = configs[`${id}_nome`] || id;
    const limit = configs[`${id}_limite`] || '1000.00';
    const closing = configs[`${id}_fechamento`] || '5';
    const due = configs[`${id}_vencimento`] || '15';

    const itemDiv = document.createElement('div');
    itemDiv.className = 'form-card-settings-item';
    itemDiv.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
    itemDiv.style.paddingBottom = '15px';
    itemDiv.style.marginBottom = '15px';
    
    itemDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div class="form-section-title" style="margin-top: 10px; margin-bottom: 0; border-left: 3px solid var(--primary-color); padding-left: 10px;">${cardName}</div>
        <button type="button" class="btn btn-secondary btn-delete-card" data-id="${id}" data-name="${cardName}" style="padding: 4px 8px; font-size: 0.75rem; color: var(--danger-color); border-color: rgba(244, 63, 94, 0.2); background: rgba(244, 63, 94, 0.05);">
          <i data-lucide="trash-2" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Excluir
        </button>
      </div>
      <div class="form-row-three">
        <div class="input-control">
          <label>Limite (R$)</label>
          <input type="number" step="0.01" id="config-${id}-limit" value="${limit}" required />
        </div>
        <div class="input-control">
          <label>Dia Fechamento</label>
          <input type="number" min="1" max="31" id="config-${id}-closing" value="${closing}" required />
        </div>
        <div class="input-control">
          <label>Dia Vencimento</label>
          <input type="number" min="1" max="31" id="config-${id}-due" value="${due}" required />
        </div>
      </div>
    `;
    container.appendChild(itemDiv);
  });

  // Re-renderizar ícones
  lucide.createIcons();
}

// Alimenta dinamicamente os selects da aplicação com base nos cartões cadastrados
export function populateAccountSelectors(configs) {
  const txAccountSelect = document.getElementById('tx-account');
  const filterAccountSelect = document.getElementById('filter-account');
  const salAccountSelect = document.getElementById('sal-account');

  if (!txAccountSelect || !filterAccountSelect) return;

  const cardIdsStr = configs['cartoes_lista'];
  const cardIds = cardIdsStr ? cardIdsStr.split(',').filter(id => id.trim() !== '') : [];

  // 1. Alimentar select do Modal de Transações
  txAccountSelect.innerHTML = `<option value="Dinheiro">Dinheiro em Espécie</option>`;
  cardIds.forEach(id => {
    const cardName = configs[`${id}_nome`] || id;
    txAccountSelect.innerHTML += `<option value="${cardName}">Cartão ${cardName}</option>`;
  });
  txAccountSelect.innerHTML += `<option value="Outros">Outra Conta Bancária</option>`;

  // Sincronizar select de Salários se existir
  if (salAccountSelect) {
    salAccountSelect.innerHTML = txAccountSelect.innerHTML;
  }

  // 2. Alimentar select de Filtros (preservando o valor previamente selecionado se ainda existir)
  const previousFilterVal = filterAccountSelect.value;
  
  filterAccountSelect.innerHTML = `
    <option value="all">Todos</option>
    <option value="Dinheiro">Dinheiro</option>
  `;
  cardIds.forEach(id => {
    const cardName = configs[`${id}_nome`] || id;
    filterAccountSelect.innerHTML += `<option value="${cardName}">${cardName}</option>`;
  });
  filterAccountSelect.innerHTML += `<option value="Outros">Outros</option>`;

  // Tentar re-selecionar o valor anterior
  if (Array.from(filterAccountSelect.options).some(opt => opt.value === previousFilterVal)) {
    filterAccountSelect.value = previousFilterVal;
  } else {
    filterAccountSelect.value = 'all';
  }
}

/**
 * Renderiza a lista de transações extraídas pelo Gemini na tabela de revisão no modal
 * @param {Array} transacoes - Lista de objetos de transação
 */
export function renderImportedTransactions(transacoes) {
  const tbody = document.getElementById('imported-transactions-body');
  const countTotalEl = document.getElementById('imported-count-total');
  const countSelectedEl = document.getElementById('imported-count-selected');
  const valueTotalEl = document.getElementById('imported-value-total');
  const btnCountEl = document.getElementById('btn-import-count');
  const checkAll = document.getElementById('check-all-imported');

  if (!tbody) return;

  tbody.innerHTML = '';
  
  if (!transacoes || transacoes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Nenhuma transação válida extraída do PDF.</td></tr>`;
    if (countTotalEl) countTotalEl.innerText = '0';
    if (countSelectedEl) countSelectedEl.innerText = '0';
    if (valueTotalEl) valueTotalEl.innerText = 'R$ 0,00';
    if (btnCountEl) btnCountEl.innerText = '0';
    return;
  }

  const categoriasValidas = [
    'Alimentação',
    'Transporte',
    'Moradia',
    'Lazer',
    'Saúde',
    'Salário',
    'Rendimentos',
    'Investimento',
    'Outros'
  ];

  // Renderizar cada linha
  transacoes.forEach((tx, idx) => {
    const tr = document.createElement('tr');
    tr.id = `imported-row-${idx}`;

    // Opções de categorias
    let selectOptions = '';
    categoriasValidas.forEach(cat => {
      selectOptions += `<option value="${cat}" ${tx.category === cat ? 'selected' : ''}>${cat}</option>`;
    });

    tr.innerHTML = `
      <td style="text-align: center;">
        <input type="checkbox" class="tx-import-check" data-idx="${idx}" checked style="width:16px;height:16px;" />
        <input type="hidden" class="tx-import-type" value="${tx.type}" />
      </td>
      <td>
        <input type="date" class="tx-import-date" value="${tx.date}" style="font-size:0.85rem;" />
      </td>
      <td>
        <input type="text" class="tx-import-desc" value="${tx.description}" style="font-size:0.85rem;" />
      </td>
      <td>
        <select class="tx-import-cat" style="font-size:0.85rem;">
          ${selectOptions}
        </select>
      </td>
      <td>
        <input type="number" step="0.01" class="tx-import-val" value="${tx.value.toFixed(2)}" style="text-align: right; font-weight:600;" />
      </td>
      <td style="text-align: center;">
        <button type="button" class="btn-delete-imported" data-idx="${idx}" style="background:none;border:none;color:var(--danger-color);cursor:pointer;" title="Remover linha">
          <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Função para recalcular os resumos/totais
  const atualizarResumo = () => {
    let totalSelecionados = 0;
    let valorTotal = 0;
    
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
      const checkbox = row.querySelector('.tx-import-check');
      if (checkbox && checkbox.checked) {
        totalSelecionados++;
        const valInput = row.querySelector('.tx-import-val');
        if (valInput) {
          valorTotal += Math.abs(parseFloat(valInput.value) || 0);
        }
      }
    });

    if (countTotalEl) countTotalEl.innerText = transacoes.length;
    if (countSelectedEl) countSelectedEl.innerText = totalSelecionados;
    if (btnCountEl) btnCountEl.innerText = totalSelecionados;
    if (valueTotalEl) valueTotalEl.innerText = formatBRL(valorTotal);
  };

  // Listeners para atualizar totais ao interagir
  tbody.addEventListener('change', (e) => {
    if (e.target.classList.contains('tx-import-check') || e.target.classList.contains('tx-import-val')) {
      atualizarResumo();
    }
  });

  // Ouvinte para excluir uma linha da tabela de importação
  tbody.addEventListener('click', (e) => {
    const btnDelete = e.target.closest('.btn-delete-imported');
    if (btnDelete) {
      const idx = btnDelete.getAttribute('data-idx');
      const row = document.getElementById(`imported-row-${idx}`);
      if (row) {
        row.remove();
        atualizarResumo();
      }
    }
  });

  // Ouvinte para marcar/desmarcar todos
  if (checkAll) {
    checkAll.checked = true;
    checkAll.addEventListener('change', () => {
      const checkboxes = tbody.querySelectorAll('.tx-import-check');
      checkboxes.forEach(cb => cb.checked = checkAll.checked);
      atualizarResumo();
    });
  }

  // Inicializar o resumo
  atualizarResumo();

  // Exibir a etapa de revisão
  document.querySelectorAll('.import-step').forEach(step => step.classList.add('hidden'));
  const stepReviewEl = document.getElementById('import-step-review');
  if (stepReviewEl) stepReviewEl.classList.remove('hidden');

  // Inicializar ícones Lucide da tabela
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Redimensiona a imagem selecionada usando Canvas para 128x128 pixels.
 * Exporta em formato JPEG com compactação para caber de forma eficiente na planilha.
 * @param {File} file - Arquivo de imagem selecionado pelo usuário
 * @returns {Promise<string>} String Base64 contendo a imagem JPEG
 */
function redimensionarImagem(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const size = 128; // Tamanho ideal para o avatar
        canvas.width = size;
        canvas.height = size;
        
        // Calcular enquadramento proporcional (crop central)
        const scale = Math.max(size / img.width, size / img.height);
        const x = (size - img.width * scale) / 2;
        const y = (size - img.height * scale) / 2;
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        
        // Exportar como jpeg compactado (qualidade 0.8)
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject(new Error('Falha ao carregar a imagem no Canvas.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem.'));
    reader.readAsDataURL(file);
  });
}
