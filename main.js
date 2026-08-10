// =====================================================================
// main.js — Fichier JS UNIQUE partagé par toutes les pages
// =====================================================================

// ===== 1. FIREBASE INIT ==============================================
const firebaseConfig = {
  apiKey: "AIzaSyDQQ_AUOF5mQZ-mrTxJX6j25gbmkSEd5f8",
  authDomain: "vertrauen-e1039.firebaseapp.com",
  projectId: "vertrauen-e1039",
  storageBucket: "vertrauen-e1039.firebasestorage.app",
  messagingSenderId: "936311977548",
  appId: "1:936311977548:web:826b67f91a84a060c6e6e9"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

const ADMIN_EMAIL = 'daoui00yassine@gmail.com';

const DEFAULT_LOGO = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%23eeeeee"/><text x="50%" y="50%" font-size="12" fill="%23999999" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">Logo</text></svg>'
);

function isAdmin(email) {
  return email === ADMIN_EMAIL;
}

// ===== 2. FIRESTORE HELPERS ==========================================
async function emailExists(email) {
  const doc = await db.collection('users').doc(email).get();
  return doc.exists;
}

async function createUser(userData) {
  const { email, ...data } = userData;
  await db.collection('users').doc(email).set(data);
  return true;
}

async function getUser(email) {
  const doc = await db.collection('users').doc(email).get();
  return doc.exists ? doc.data() : null;
}

// ===== 3. DÉCONNEXION ================================================
window.logout = function () {
  localStorage.removeItem('userEmail');
  localStorage.removeItem('isAdmin');
  localStorage.removeItem('userNachname');
  localStorage.removeItem('userAnrede');
  window.location.href = 'login.html';
};

// ===== 4. CONVERSION D'IMAGE EN BASE64 ===============================
function fileToCompressedDataUrl(file, maxSize = 300, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round(height * (maxSize / width));
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round(width * (maxSize / height));
          height = maxSize;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function logoImgHtml(logoUrl, altName) {
  const src = logoUrl || DEFAULT_LOGO;
  return `<img src="${src}" alt="Logo von ${altName || 'Unternehmen'}" class="company-logo" onerror="this.onerror=null;this.src='${DEFAULT_LOGO}';" />`;
}

// =====================================================================
// ===== BLOC 1 : login.html ===========================================
// =====================================================================
function initLoginPage() {
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('registration-form');
  if (!loginForm || !regForm) return;

  const loginContainer = document.getElementById('login-form-container');
  const registrationContainer = document.getElementById('registration-form-container');
  const forgotContainer = document.getElementById('forgot-form-container');

  const showRegLink = document.getElementById('show-registration-link');
  const hideRegLink = document.getElementById('hide-registration-link');
  const forgotLink = document.getElementById('forgot-link');
  const backToLoginLink = document.getElementById('back-to-login-link');

  function resetRegistrationForm() {
    document.getElementById('email').value = '';
    document.getElementById('email_wdh').value = '';
    document.getElementById('vorname').value = '';
    document.getElementById('nachname').value = '';
    document.getElementById('tel_vorwahl').value = '';
    document.getElementById('tel_nummer').value = '';
    document.getElementById('fax_vorwahl').value = '';
    document.getElementById('fax_nummer').value = '';
    document.getElementById('reg-password').value = '';
    document.getElementById('reg-password-confirm').value = '';
    document.getElementById('datenschutz').checked = false;
    document.getElementById('register-message').textContent = '';
    document.getElementById('password-fields').style.display = 'none';
    document.getElementById('register-btn').textContent = 'Registrieren';
    document.getElementById('register-btn').dataset.emailVerified = 'false';
    document.getElementById('email').dataset.validated = '';
  }

  showRegLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginContainer.style.display = 'none';
    forgotContainer.style.display = 'none';
    registrationContainer.style.display = 'block';
    resetRegistrationForm();
  });

  hideRegLink.addEventListener('click', (e) => {
    e.preventDefault();
    registrationContainer.style.display = 'none';
    forgotContainer.style.display = 'none';
    loginContainer.style.display = 'block';
  });

  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginContainer.style.display = 'none';
    registrationContainer.style.display = 'none';
    forgotContainer.style.display = 'block';
    document.getElementById('forgot-message').textContent = '';
  });

  backToLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    forgotContainer.style.display = 'none';
    registrationContainer.style.display = 'none';
    loginContainer.style.display = 'block';
  });

  const regMessage = document.getElementById('register-message');
  const registerBtn = document.getElementById('register-btn');

  regForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (registerBtn.dataset.emailVerified !== 'true') {
      const email = document.getElementById('email').value.trim();
      const emailWdh = document.getElementById('email_wdh').value.trim();
      const vorname = document.getElementById('vorname').value.trim();
      const nachname = document.getElementById('nachname').value.trim();
      const datenschutz = document.getElementById('datenschutz').checked;

      if (!email || !emailWdh || !vorname || !nachname) {
        regMessage.textContent = 'Bitte füllen Sie alle Pflichtfelder aus. / Veuillez remplir tous les champs obligatoires.';
        regMessage.style.color = '#cc0000';
        return;
      }
      if (email !== emailWdh) {
        regMessage.textContent = 'E-Mail-Adressen stimmen nicht überein. / Les adresses e-mail ne correspondent pas.';
        regMessage.style.color = '#cc0000';
        return;
      }
      if (!datenschutz) {
        regMessage.textContent = 'Bitte akzeptieren Sie die Datenschutzbestimmungen. / Veuillez accepter les conditions.';
        regMessage.style.color = '#cc0000';
        return;
      }

      try {
        const exists = await emailExists(email);
        if (exists) {
          regMessage.textContent = 'Diese E-Mail ist bereits registriert. / Cet e-mail est déjà enregistré.';
          regMessage.style.color = '#cc0000';
          document.getElementById('password-fields').style.display = 'none';
          registerBtn.dataset.emailVerified = 'false';
        } else {
          regMessage.textContent = 'E-Mail ist frei. Bitte Passwort festlegen. / L\'e-mail est libre.';
          regMessage.style.color = '#008000';
          document.getElementById('password-fields').style.display = 'block';
          registerBtn.dataset.emailVerified = 'true';
          registerBtn.textContent = 'Passwort speichern';
          document.getElementById('email').dataset.validated = email;
        }
      } catch (error) {
        console.error('Firebase error:', error);
        regMessage.textContent = 'Fehler bei der Verbindung zur Datenbank.';
        regMessage.style.color = '#cc0000';
      }
    } else {
      const email = document.getElementById('email').dataset.validated;
      const password = document.getElementById('reg-password').value;
      const passwordConfirm = document.getElementById('reg-password-confirm').value;
      const anrede = document.getElementById('anrede').value;
      const vorname = document.getElementById('vorname').value.trim();
      const nachname = document.getElementById('nachname').value.trim();
      const telVorwahl = document.getElementById('tel_vorwahl').value.trim();
      const telNummer = document.getElementById('tel_nummer').value.trim();
      const faxVorwahl = document.getElementById('fax_vorwahl').value.trim();
      const faxNummer = document.getElementById('fax_nummer').value.trim();
      const datenschutz = document.getElementById('datenschutz').checked;

      if (!password || !passwordConfirm) {
        regMessage.textContent = 'Bitte Passwort und Bestätigung eingeben.';
        regMessage.style.color = '#cc0000';
        return;
      }
      if (password !== passwordConfirm) {
        regMessage.textContent = 'Passwörter stimmen nicht überein.';
        regMessage.style.color = '#cc0000';
        return;
      }
      if (!datenschutz) {
        regMessage.textContent = 'Bitte akzeptieren Sie die Datenschutzbestimmungen.';
        regMessage.style.color = '#cc0000';
        return;
      }

      const telefon = telVorwahl + ' ' + telNummer;
      const fax = faxVorwahl + ' ' + faxNummer;

      const userData = {
        anrede, vorname, nachname, telefon, fax,
        password: password,
        created_at: new Date().toISOString()
      };

      try {
        await createUser({ email, ...userData });
        regMessage.textContent = 'Registrierung erfolgreich! Sie können sich jetzt anmelden.';
        regMessage.style.color = '#008000';
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
      } catch (error) {
        console.error('Firebase error:', error);
        regMessage.textContent = 'Fehler beim Speichern des Benutzers.';
        regMessage.style.color = '#cc0000';
      }
    }
  });

  const loginMsg = document.getElementById('login-message');
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('user').value.trim();
    const password = document.getElementById('pass').value.trim();

    if (!email || !password) {
      loginMsg.textContent = 'Bitte E-Mail und Passwort eingeben.';
      loginMsg.style.color = '#cc0000';
      return;
    }

    try {
      const user = await getUser(email);
      if (user && user.password === password) {
        localStorage.setItem('userEmail', email);
        localStorage.setItem('isAdmin', isAdmin(email) ? 'true' : 'false');
        if (user.nachname) {
          localStorage.setItem('userNachname', user.nachname);
        } else {
          localStorage.removeItem('userNachname');
        }
        if (user.anrede) {
          localStorage.setItem('userAnrede', user.anrede);
        } else {
          localStorage.removeItem('userAnrede');
        }

        loginMsg.textContent = 'Login erfolgreich! Weiterleitung ...';
        loginMsg.style.color = '#008000';
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
      } else {
        loginMsg.textContent = 'E-Mail oder Passwort falsch.';
        loginMsg.style.color = '#cc0000';
      }
    } catch (error) {
      console.error('Firebase error:', error);
      loginMsg.textContent = 'Fehler bei der Verbindung zur Datenbank.';
      loginMsg.style.color = '#cc0000';
    }
  });

  const forgotForm = document.getElementById('forgot-form');
  if (forgotForm) {
    const forgotMsg = document.getElementById('forgot-message');
    forgotForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const email = document.getElementById('forgot-username').value.trim();

      if (!email) {
        forgotMsg.textContent = 'Bitte geben Sie Ihre E-Mail ein.';
        forgotMsg.style.color = '#cc0000';
        return;
      }

      try {
        const user = await getUser(email);
        if (user) {
          forgotMsg.textContent = 'Ein Link zum Zurücksetzen wurde gesendet.';
          forgotMsg.style.color = '#008000';
        } else {
          forgotMsg.textContent = 'Kein Konto mit dieser E-Mail verknüpft.';
          forgotMsg.style.color = '#cc0000';
        }
      } catch (error) {
        console.error('Firebase error:', error);
        forgotMsg.textContent = 'Fehler bei der Anfrage.';
        forgotMsg.style.color = '#cc0000';
      }
    });
  }
}

// =====================================================================
// ===== BLOC 2 : admin.html ===========================================
// =====================================================================
function initAdminPage() {
  const companyForm = document.getElementById('companyForm');
  const userList = document.getElementById('userList');
  if (!companyForm || !userList) return;

  if (localStorage.getItem('isAdmin') !== 'true') {
    window.location.href = 'dashboard.html';
    return;
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  const formContainer = document.getElementById('companyFormContainer');
  const toggleBtn = document.getElementById('toggleCompanyForm');
  const cancelFormBtn = document.getElementById('cancelCompanyForm');
  const editModeIndicator = document.getElementById('editModeIndicator');
  const companyFormTitle = document.getElementById('companyFormTitle');
  const submitBtn = document.getElementById('submitCompanyBtn');
  const companyMessage = document.getElementById('companyMessage');
  const logoInput = document.getElementById('compLogo');
  const logoPreview = document.getElementById('logoPreview');
  const uploadProgress = document.getElementById('uploadProgress');

  function openFormAdd() {
    document.getElementById('editCompanyId').value = '';
    companyForm.reset();
    logoPreview.classList.remove('visible');
    logoPreview.src = '';
    submitBtn.textContent = 'Unternehmen speichern';
    companyFormTitle.textContent = 'Neues Unternehmen';
    editModeIndicator.classList.remove('active');
    companyMessage.textContent = '';
    companyMessage.className = 'message';
    logoInput.value = '';
    formContainer.classList.add('active');
  }

  function fillEditForm(docId, data) {
    document.getElementById('editCompanyId').value = docId;
    document.getElementById('compName').value = data.name || '';
    document.getElementById('compService').value = data.service || '';
    document.getElementById('compPhone').value = data.phone || '';
    document.getElementById('compCreated').value = data.created || '';
    document.getElementById('compCommercial').value = data.commercial || '';
    if (data.logo) {
      logoPreview.src = data.logo;
      logoPreview.classList.add('visible');
    } else {
      logoPreview.classList.remove('visible');
      logoPreview.src = '';
    }
    submitBtn.textContent = 'Änderungen speichern';
    companyFormTitle.textContent = 'Unternehmen bearbeiten';
    editModeIndicator.classList.add('active');
    companyMessage.textContent = '';
    companyMessage.className = 'message';
    logoInput.value = '';
    formContainer.classList.add('active');
  }

  function closeForm() {
    formContainer.classList.remove('active');
    logoPreview.classList.remove('visible');
    logoPreview.src = '';
  }

  toggleBtn.addEventListener('click', () => {
    formContainer.classList.contains('active') ? closeForm() : openFormAdd();
  });
  cancelFormBtn.addEventListener('click', closeForm);

  logoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
      logoPreview.classList.remove('visible');
      logoPreview.src = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      logoPreview.src = event.target.result;
      logoPreview.classList.add('visible');
    };
    reader.readAsDataURL(file);
  });

  companyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const docId = document.getElementById('editCompanyId').value;
    const name = document.getElementById('compName').value.trim();
    const service = document.getElementById('compService').value.trim();
    const phone = document.getElementById('compPhone').value.trim();
    const created = document.getElementById('compCreated').value;
    const commercial = document.getElementById('compCommercial').value.trim();
    const logoFile = logoInput.files[0];
    const msg = companyMessage;

    if (!name) {
      msg.textContent = 'Bitte geben Sie einen Namen ein.';
      msg.className = 'message error';
      return;
    }

    try {
      let logoUrl = null;

      if (logoFile) {
        uploadProgress.classList.add('active');
        msg.textContent = 'Logo wird verarbeitet...';
        msg.className = 'message';
        logoUrl = await fileToCompressedDataUrl(logoFile);
        uploadProgress.classList.remove('active');
      } else if (docId) {
        const doc = await db.collection('companies').doc(docId).get();
        if (doc.exists) logoUrl = doc.data().logo || null;
      }

      const dataToSave = { name, service, phone, created, commercial };
      if (logoUrl) dataToSave.logo = logoUrl;

      if (docId) {
        await db.collection('companies').doc(docId).update(dataToSave);
        msg.textContent = '✅ Unternehmen erfolgreich aktualisiert!';
      } else {
        dataToSave.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('companies').add(dataToSave);
        msg.textContent = '✅ Unternehmen erfolgreich hinzugefügt!';
      }
      msg.className = 'message success';
      closeForm();
      loadCompaniesAdmin();
    } catch (error) {
      console.error('❌ Fehler:', error);
      uploadProgress.classList.remove('active');
      msg.textContent = '❌ Fehler: ' + error.message;
      msg.className = 'message error';
    }
  });

  async function loadCompaniesAdmin() {
    const container = document.getElementById('companyList');
    try {
      const snapshot = await db.collection('companies').orderBy('createdAt', 'desc').get();
      if (snapshot.empty) {
        container.innerHTML = '<p>Keine Unternehmen vorhanden.</p>';
        return;
      }
      let html = '';
      snapshot.forEach(doc => {
        const data = doc.data();
        html += `
          <div class="company-item" data-id="${doc.id}">
            <div class="company-info">
              ${logoImgHtml(data.logo, data.name)}
              <div>
                <strong>${data.name || 'Unbekannt'}</strong>
                ${data.service ? ` - ${data.service}` : ''}
                ${data.commercial ? ` (Commercial: ${data.commercial})` : ''}
                ${data.phone ? ` - Tel: ${data.phone}` : ''}
                ${data.created ? ` - Erstellt: ${data.created}` : ''}
              </div>
            </div>
            <div class="company-actions">
              <button class="edit-btn" data-id="${doc.id}">Bearbeiten</button>
              <button class="delete-btn" data-id="${doc.id}">Löschen</button>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;

      document.querySelectorAll('#companyList .edit-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          try {
            const doc = await db.collection('companies').doc(id).get();
            if (doc.exists) fillEditForm(id, doc.data());
            else alert('Unternehmen nicht gefunden.');
          } catch (error) {
            console.error(error);
            alert('Fehler beim Laden der Unternehmensdaten.');
          }
        });
      });

      document.querySelectorAll('#companyList .delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Möchten Sie dieses Unternehmen wirklich löschen?')) {
            try {
              await db.collection('companies').doc(btn.dataset.id).delete();
              loadCompaniesAdmin();
            } catch (error) {
              console.error(error);
              alert('Fehler beim Löschen.');
            }
          }
        });
      });
    } catch (error) {
      console.error('❌ Fehler beim Laden:', error);
      container.innerHTML = '<p>Fehler beim Laden.</p>';
    }
  }

  async function loadUsers() {
    const container = document.getElementById('userList');
    try {
      const snapshot = await db.collection('users').get();
      if (snapshot.empty) {
        container.innerHTML = '<p>Keine Benutzer vorhanden.</p>';
        return;
      }
      let html = '';
      snapshot.forEach(doc => {
        const data = doc.data();
        const email = doc.id;
        html += `
          <div class="user-item" data-email="${email}">
            <span class="email">${email}</span>
            <span class="info">${data.vorname || ''} ${data.nachname || ''}</span>
            <button class="edit-btn" data-email="${email}">Bearbeiten</button>
          </div>
        `;
      });
      container.innerHTML = html;
      document.querySelectorAll('#userList .edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditUserForm(btn.dataset.email));
      });
    } catch (error) {
      console.error(error);
      container.innerHTML = '<p>Fehler beim Laden.</p>';
    }
  }

  async function openEditUserForm(email) {
    document.getElementById('editFormContainer').style.display = 'block';
    document.getElementById('editEmail').value = email;
    document.getElementById('editMessage').textContent = '';
    document.getElementById('editMessage').className = 'message';
    try {
      const doc = await db.collection('users').doc(email).get();
      if (doc.exists) {
        const data = doc.data();
        document.getElementById('editAnrede').value = data.anrede || '';
        document.getElementById('editVorname').value = data.vorname || '';
        document.getElementById('editNachname').value = data.nachname || '';
        document.getElementById('editTelefon').value = data.telefon || '';
        document.getElementById('editFax').value = data.fax || '';
      }
    } catch (error) {
      console.error(error);
    }
  }

  document.getElementById('editUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('editEmail').value;
    const anrede = document.getElementById('editAnrede').value.trim();
    const vorname = document.getElementById('editVorname').value.trim();
    const nachname = document.getElementById('editNachname').value.trim();
    const telefon = document.getElementById('editTelefon').value.trim();
    const fax = document.getElementById('editFax').value.trim();
    const msg = document.getElementById('editMessage');
    try {
      await db.collection('users').doc(email).update({ anrede, vorname, nachname, telefon, fax });
      msg.textContent = 'Benutzer aktualisiert!';
      msg.className = 'message success';
      loadUsers();
      setTimeout(() => { document.getElementById('editFormContainer').style.display = 'none'; }, 1500);
    } catch (error) {
      console.error(error);
      msg.textContent = 'Fehler beim Aktualisieren.';
      msg.className = 'message error';
    }
  });

  document.getElementById('cancelEdit').addEventListener('click', () => {
    document.getElementById('editFormContainer').style.display = 'none';
  });

  loadCompaniesAdmin();
  loadUsers();
}

// =====================================================================
// ===== BLOC 3 : company.html =========================================
// =====================================================================
function initCompanyPage() {
  const container = document.getElementById('companyListPublic');
  if (!container) return;

  async function loadCompaniesPublic() {
    try {
      const snapshot = await db.collection('companies').orderBy('createdAt', 'desc').get();
      if (snapshot.empty) {
        container.innerHTML = '<p>Keine Unternehmen vorhanden.</p>';
        return;
      }
      let html = '';
      snapshot.forEach(doc => {
        const data = doc.data();
        html += `
          <div class="company-item">
            <div class="company-info">
              ${logoImgHtml(data.logo, data.name)}
              <div>
                <strong>${data.name || 'Unbekannt'}</strong>
                ${data.service ? ` - ${data.service}` : ''}
                ${data.commercial ? ` (Commercial: ${data.commercial})` : ''}
                ${data.phone ? ` - Tel: ${data.phone}` : ''}
              </div>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
    } catch (error) {
      console.error('❌ Fehler beim Laden:', error);
      container.innerHTML = '<p>Fehler beim Laden.</p>';
    }
  }

  loadCompaniesPublic();
}

// =====================================================================
// ===== BLOC 4 : Gestion du bouton Login / Abmelden ===================
// =====================================================================
function updateLoginButton() {
  // 1. Gérer le lien "Abmelden" dans le menu mobile (logoutMobile)
  const logoutMobileLink = document.getElementById('logoutMobile');
  const isLoggedIn = localStorage.getItem('userEmail') !== null;

  if (logoutMobileLink) {
    if (isLoggedIn) {
      logoutMobileLink.style.display = 'block';
      logoutMobileLink.textContent = 'Abmelden';
      logoutMobileLink.onclick = function(e) {
        e.preventDefault();
        window.logout();
      };
    } else {
      logoutMobileLink.style.display = 'none';
      logoutMobileLink.onclick = null;
    }
  }

  // 2. Gérer le bouton Login dans la barre supérieure
  const loginLinks = document.querySelectorAll('.login-btn, .btn-login');
  loginLinks.forEach(link => {
    if (isLoggedIn) {
      link.textContent = 'Abmelden';
      link.href = '#';
      link.onclick = function(e) {
        e.preventDefault();
        window.logout();
      };
    } else {
      link.textContent = 'Login';
      link.href = 'login.html';
      link.onclick = null;
    }
  });
}

// =====================================================================
// ===== BLOC 5 : Affichage du message de bienvenue ====================
// =====================================================================
function updateUserDisplay() {
  const nameSpan = document.getElementById('userNameDisplay');
  if (!nameSpan) return;

  const isLoggedIn = localStorage.getItem('userEmail') !== null;
  const anrede = localStorage.getItem('userAnrede');
  const nachname = localStorage.getItem('userNachname');

  if (isLoggedIn && nachname) {
    const displayName = anrede ? anrede + ' ' + nachname : nachname;
    nameSpan.innerHTML = '<span class="welcome-text">Willkommen</span>, <span class="welcome-name">' + displayName + '</span>';
  } else if (isLoggedIn) {
    nameSpan.innerHTML = '<span class="welcome-text">Willkommen</span>';
  } else {
    nameSpan.innerHTML = '';
  }
}

// =====================================================================
// ===== BLOC 6 : Menu transparent au scroll (désactivé si vous ne voulez pas) =====
// =====================================================================
// Si vous ne voulez pas de transparence, commentez ou supprimez cette fonction et son appel
function initScrollHeader() {
  const header = document.querySelector('.dashboard-header');
  if (!header) return;
  const threshold = 50;
  window.addEventListener('scroll', function() {
    if (window.scrollY > threshold) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// =====================================================================
// ===== BLOC 7 : Menu hamburger sur mobile ============================
// =====================================================================
function initHamburger() {
  const hamburger = document.getElementById('hamburgerBtn');
  const nav = document.getElementById('mainNav');
  if (!hamburger || !nav) return;

  hamburger.addEventListener('click', function() {
    this.classList.toggle('active');
    nav.classList.toggle('open');
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function() {
      hamburger.classList.remove('active');
      nav.classList.remove('open');
    });
  });
}

// =====================================================================
// ===== INIT GLOBAL ===================================================
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
  initLoginPage();
  initAdminPage();
  initCompanyPage();
  updateLoginButton();
  updateUserDisplay();
  initScrollHeader();   // Si vous ne voulez pas de transparence, retirez cette ligne
  initHamburger();
});