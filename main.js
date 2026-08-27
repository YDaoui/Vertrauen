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

async function getUserContractInfo(email) {
  try {
    const doc = await db.collection('users').doc(email).get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error('Erreur lors de la récupération des informations utilisateur:', error);
    return null;
  }
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

// ===== 5. GESTION DU PORTAIL UTILISATEUR =============================
function isCurrentUserAdmin() {
  const userEmail = localStorage.getItem('userEmail');
  return userEmail === ADMIN_EMAIL;
}

function updateDashboardMenu() {
  const userEmail = localStorage.getItem('userEmail');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  const adminMenu = document.getElementById('adminMenu');
  const userMenu = document.getElementById('userMenu');
  const userInfoBox = document.getElementById('userInfoBox');
  const welcomeTitle = document.getElementById('welcomeTitle');
  const welcomeMessage = document.getElementById('welcomeMessage');

  if (!adminMenu || !userMenu) return;

  if (isAdmin) {
    adminMenu.style.display = 'block';
    userMenu.style.display = 'none';
    if (userInfoBox) userInfoBox.style.display = 'none';
    if (welcomeTitle) welcomeTitle.textContent = 'Willkommen im Admin-Dashboard!';
    if (welcomeMessage) {
      welcomeMessage.innerHTML = 'Sie haben vollen Zugriff auf alle Bereiche.<br />Nutzen Sie das Menü oben, um zu navigieren.';
    }
  } else if (userEmail) {
    adminMenu.style.display = 'none';
    userMenu.style.display = 'block';
    if (userInfoBox) userInfoBox.style.display = 'block';
    if (welcomeTitle) welcomeTitle.textContent = 'Willkommen auf Ihrem Portal!';
    if (welcomeMessage) {
      welcomeMessage.innerHTML = 'Hier finden Sie Ihre persönlichen Informationen.<br />Nutzen Sie das Menü oben, um zu navigieren.';
    }
    loadUserPortalInfo(userEmail);
  } else {
    adminMenu.style.display = 'none';
    userMenu.style.display = 'none';
    if (userInfoBox) userInfoBox.style.display = 'none';
    if (welcomeTitle) welcomeTitle.textContent = 'Bitte melden Sie sich an';
    if (welcomeMessage) {
      welcomeMessage.innerHTML = 'Um auf Ihr persönliches Portal zuzugreifen,<br />melden Sie sich bitte mit Ihren Zugangsdaten an.';
    }
  }
}

async function loadUserPortalInfo(email) {
  const infoContainer = document.getElementById('userContractInfo');
  if (!infoContainer) return;

  try {
    const userData = await getUserContractInfo(email);

    if (userData) {
      const anrede = userData.anrede || '';
      const vorname = userData.vorname || '';
      const nachname = userData.nachname || '';
      const telefon = userData.telefon || 'Nicht angegeben';
      const fax = userData.fax || 'Nicht angegeben';

      const contractSnapshot = await db.collection('contracts')
        .where('userId', '==', email)
        .limit(1)
        .get();

      let contractInfo = null;
      let offerInfo = null;

      if (!contractSnapshot.empty) {
        const contractDoc = contractSnapshot.docs[0];
        contractInfo = contractDoc.data();

        if (contractInfo.offerId) {
          const offerDoc = await db.collection('offers').doc(contractInfo.offerId).get();
          if (offerDoc.exists) {
            offerInfo = offerDoc.data();
          }
        }
      }

      let html = `
        <div class="portal-user-info">
          <div class="portal-section">
            <h3>👤 Ihre Kontaktdaten</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Anrede</span>
                <span class="value">${anrede || 'Nicht angegeben'}</span>
              </div>
              <div class="info-item">
                <span class="label">Vorname</span>
                <span class="value">${vorname || 'Nicht angegeben'}</span>
              </div>
              <div class="info-item">
                <span class="label">Nachname</span>
                <span class="value">${nachname || 'Nicht angegeben'}</span>
              </div>
              <div class="info-item">
                <span class="label">E-Mail</span>
                <span class="value">${email}</span>
              </div>
              <div class="info-item">
                <span class="label">Telefon</span>
                <span class="value">${telefon}</span>
              </div>
              <div class="info-item">
                <span class="label">Fax</span>
                <span class="value">${fax}</span>
              </div>
            </div>
          </div>
      `;

      if (contractInfo) {
        const statusText = contractInfo.status === 'active' ? '🟢 Aktiv' : '🔴 Beendet';
        const statusClass = contractInfo.status === 'active' ? 'status-active' : 'status-expired';

        html += `
          <div class="portal-section">
            <h3>📄 Ihre Vertragsinformationen</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Unternehmen</span>
                <span class="value">${contractInfo.companyName || 'Nicht angegeben'}</span>
              </div>
              <div class="info-item">
                <span class="label">Energietyp</span>
                <span class="value">${contractInfo.energyType === 'strom' ? '⚡ Strom' : '🔥 Gas'}</span>
              </div>
              <div class="info-item">
                <span class="label">Preis</span>
                <span class="value">${contractInfo.price || 'Nicht angegeben'}</span>
              </div>
              <div class="info-item">
                <span class="label">Laufzeit</span>
                <span class="value">${contractInfo.duration || 'Nicht angegeben'}</span>
              </div>
              <div class="info-item">
                <span class="label">Vertragsbeginn</span>
                <span class="value">${contractInfo.dateFrom || 'Nicht angegeben'}</span>
              </div>
              <div class="info-item">
                <span class="label">Vertragsende</span>
                <span class="value">${contractInfo.dateTo || 'Nicht angegeben'}</span>
              </div>
              <div class="info-item full-width">
                <span class="label">Status</span>
                <span class="value ${statusClass}">${statusText}</span>
              </div>
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="portal-section">
            <h3>📄 Vertragsinformationen</h3>
            <p style="color: #ff6b6b; padding: 15px; text-align: center;">
              ⚠️ Kein aktiver Vertrag gefunden.
            </p>
          </div>
        `;
      }

      if (offerInfo) {
        html += `
          <div class="portal-section">
            <h3>📦 Angebotsdetails</h3>
            <div class="info-grid">
              <div class="info-item full-width">
                <span class="label">Angebot</span>
                <span class="value">${offerInfo.companyName || 'Nicht angegeben'}</span>
              </div>
              <div class="info-item">
                <span class="label">Energietyp</span>
                <span class="value">${offerInfo.type === 'strom' ? '⚡ Strom' : '🔥 Gas'}</span>
              </div>
              <div class="info-item">
                <span class="label">Preis</span>
                <span class="value price">${offerInfo.price || 'Nicht angegeben'}</span>
              </div>
              <div class="info-item">
                <span class="label">Laufzeit</span>
                <span class="value">${offerInfo.duration || 'Nicht angegeben'}</span>
              </div>
            </div>
          </div>
        `;
      }

      html += `
          <div class="portal-section">
            <h3>⚡ Aktionen</h3>
            <div class="action-buttons">
              <button onclick="window.print()" class="action-btn">
                <span class="icon">🖨️</span> Vertrag drucken
              </button>
              <button onclick="window.location.href='mailto:support@vertrauen-distributor.de'" class="action-btn">
                <span class="icon">✉️</span> Support kontaktieren
              </button>
              <button onclick="window.location.href='mein-portal.html'" class="action-btn">
                <span class="icon">📊</span> Zum vollständigen Portal
              </button>
            </div>
          </div>
        </div>
      `;

      infoContainer.innerHTML = html;
    } else {
      infoContainer.innerHTML = `
        <div class="portal-section">
          <p style="color: #ff6b6b; padding: 20px; text-align: center;">
            ⚠️ Keine Benutzerinformationen gefunden.
          </p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Fehler beim Laden des Portals:', error);
    infoContainer.innerHTML = `
      <div class="portal-section">
        <p style="color: #ff6b6b; padding: 20px; text-align: center;">
          ⚠️ Fehler beim Laden der Informationen. Bitte versuchen Sie es später erneut.
        </p>
      </div>
    `;
  }
}

// =====================================================================
// ===== BLOC 8 : MEIN PORTAL - GESTION DES CARTES ====================
// =====================================================================

// ===== TOGGLE CARTE =====
function togglePortalCard(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;

    const body = card.querySelector('.card-body');
    const arrow = card.querySelector('.arrow');

    if (body) {
        body.classList.toggle('open');
    }
    if (arrow) {
        arrow.classList.toggle('open');
    }
}

// ===== CHARGER LES INFOS PERSONNELLES =====
function loadPersonalInfo(email) {
    const container = document.getElementById('personalInfo');
    if (!container) return;

    const db = firebase.firestore();
    db.collection('users').doc(email).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            container.innerHTML = `
                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">Anrede</span>
                        <span class="value">${data.anrede || 'Nicht angegeben'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Vorname</span>
                        <span class="value">${data.vorname || 'Nicht angegeben'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Nachname</span>
                        <span class="value">${data.nachname || 'Nicht angegeben'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">E-Mail</span>
                        <span class="value">${email}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Telefon</span>
                        <span class="value">${data.telefon || 'Nicht angegeben'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Fax</span>
                        <span class="value">${data.fax || 'Nicht angegeben'}</span>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = '<p style="color: #ff6b6b;">Keine Benutzerinformationen gefunden.</p>';
        }
    }).catch((error) => {
        console.error('Fehler beim Laden:', error);
        container.innerHTML = '<p style="color: #ff6b6b;">Fehler beim Laden der Informationen.</p>';
    });
}

// ===== CHARGER LES DONNÉES DANS LE FORMULAIRE D'ÉDITION =====
function loadPersonalDataToForm() {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) return;

    const db = firebase.firestore();
    db.collection('users').doc(userEmail).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('editPersonalAnrede').value = data.anrede || '';
            document.getElementById('editPersonalVorname').value = data.vorname || '';
            document.getElementById('editPersonalNachname').value = data.nachname || '';
            document.getElementById('editPersonalTelefon').value = data.telefon || '';
            document.getElementById('editPersonalFax').value = data.fax || '';
        }
    }).catch((error) => {
        console.error('Fehler beim Laden der Daten:', error);
    });
}

// ===== CHARGER LES INFOS CONTRAT ET OFFRES =====
function loadPortalData(email) {
    const contractContainer = document.getElementById('contractInfo');
    const offerContainer = document.getElementById('offerDetails');
    const statusBadge = document.getElementById('contractStatusBadge');

    if (!contractContainer || !offerContainer) return;

    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        setTimeout(function() { loadPortalData(email); }, 300);
        return;
    }

    const db = firebase.firestore();

    db.collection('contracts')
        .where('userId', '==', email)
        .get()
        .then((contractSnapshot) => {
            if (contractSnapshot.empty) {
                contractContainer.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #ff6b6b;">
                        ⚠️ Kein Vertrag gefunden.
                    </div>
                `;
                offerContainer.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #6a7b91;">
                        Keine Angebote verfügbar.
                    </div>
                `;
                if (statusBadge) statusBadge.style.display = 'none';
                return;
            }

            let contractHtml = '';
            let isActive = false;

            contractSnapshot.forEach((contractDoc) => {
                const contractData = contractDoc.data();
                
                if (contractData.status === 'active') {
                    isActive = true;
                }

                contractHtml = `
                    <div class="contract-section">
                        <div class="contract-header">
                            <div>
                                <strong style="color: #54e50d; font-size: 1.1rem;">${contractData.companyName || 'Unbekannt'}</strong>
                                <span style="margin-left:12px; color:#ffffff;">${contractData.energyType === 'strom' ? '⚡ Strom' : '🔥 Gas'}</span>
                            </div>
                        </div>
                        <div class="contract-details-grid">
                            <div class="contract-detail-item">
                                <span class="label">Preis</span>
                                <span class="value">${contractData.price || 'N/A'}</span>
                            </div>
                            <div class="contract-detail-item">
                                <span class="label">Laufzeit</span>
                                <span class="value">${contractData.duration || 'N/A'}</span>
                            </div>
                            <div class="contract-detail-item">
                                <span class="label">Vertragsbeginn</span>
                                <span class="value">${contractData.dateFrom || 'N/A'}</span>
                            </div>
                            <div class="contract-detail-item">
                                <span class="label">Vertragsende</span>
                                <span class="value">${contractData.dateTo || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            if (statusBadge) {
                if (isActive) {
                    statusBadge.style.display = 'inline-block';
                    statusBadge.textContent = '🟢 Aktiv';
                    statusBadge.style.background = 'rgba(84,229,13,0.15)';
                    statusBadge.style.color = '#54e50d';
                    statusBadge.style.border = '1px solid rgba(84,229,13,0.3)';
                } else {
                    statusBadge.style.display = 'inline-block';
                    statusBadge.textContent = '🔴 Beendet';
                    statusBadge.style.background = 'rgba(255,107,107,0.15)';
                    statusBadge.style.color = '#ff6b6b';
                    statusBadge.style.border = '1px solid rgba(255,107,107,0.3)';
                }
            }

            contractContainer.innerHTML = contractHtml;

            const offerPromises = [];
            contractSnapshot.forEach((contractDoc) => {
                const contractData = contractDoc.data();
                if (contractData.offerId) {
                    offerPromises.push(
                        db.collection('offers').doc(contractData.offerId).get()
                            .then((offerDoc) => {
                                if (offerDoc.exists) {
                                    const offerData = offerDoc.data();
                                    const services = offerData.services || [];
                                    return `
                                        <div class="offer-item">
                                            <div class="offer-info">
                                                <div class="offer-name">${offerData.companyName || 'Unbekannt'}</div>
                                                <div class="offer-details">
                                                    ${offerData.type === 'strom' ? '⚡ Strom' : '🔥 Gas'}
                                                    <span style="margin-left:12px; color:#54e50d;">💰 ${offerData.price || 'N/A'}</span>
                                                    <span style="margin-left:12px; color:#6a7b91;">⏱ ${offerData.duration || 'N/A'}</span>
                                                </div>
                                                ${services.length > 0 ? `
                                                    <div class="offer-meta">
                                                        📋 ${services.join(' | ')}
                                                    </div>
                                                ` : ''}
                                            </div>
                                            <div class="offer-actions">
                                                <button class="print-btn" onclick="window.print()">🖨️ Drucken</button>
                                                <button class="support-btn" onclick="window.location.href='mailto:support@vertrauen-distributor.de'">✉️ Support</button>
                                                <button class="edit-btn" onclick="window.location.href='mailto:support@vertrauen-distributor.de'">✏️ kündigen</button>
                                            </div>
                                        </div>
                                    `;
                                }
                                return '';
                            })
                    );
                }
            });

            Promise.all(offerPromises).then((offerItems) => {
                const offersHtml = offerItems.filter(item => item).join('');
                offerContainer.innerHTML = offersHtml || `
                    <div style="text-align: center; padding: 20px; color: #6a7b91;">
                        Keine Angebote verfügbar.
                    </div>
                `;
            });

        })
        .catch((error) => {
            console.error('Fehler beim Laden des Vertrags:', error);
            contractContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #ff6b6b;">
                    ⚠️ Fehler beim Laden der Vertragsinformationen.
                </div>
            `;
            offerContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #ff6b6b;">
                    ⚠️ Fehler beim Laden der Angebote.
                </div>
            `;
            if (statusBadge) statusBadge.style.display = 'none';
        });
}

// ===== FERMER LE FORMULAIRE D'ÉDITION =====
function closeEditForm() {
    const editForm = document.getElementById('personalEditForm');
    const toggleBtn = document.getElementById('togglePersonalEdit');
    const msg = document.getElementById('personalEditMessage');
    
    if (editForm) editForm.classList.remove('active');
    if (toggleBtn) {
        toggleBtn.classList.remove('hidden');
        toggleBtn.textContent = '✏️ Bearbeiten';
    }
    if (msg) {
        msg.textContent = '';
        msg.className = 'message';
    }
}

// ===== OUVRIR LE FORMULAIRE D'ÉDITION =====
function openEditForm() {
    const editForm = document.getElementById('personalEditForm');
    const toggleBtn = document.getElementById('togglePersonalEdit');
    const msg = document.getElementById('personalEditMessage');
    
    if (editForm) editForm.classList.add('active');
    if (toggleBtn) toggleBtn.classList.add('hidden');
    if (msg) {
        msg.textContent = '';
        msg.className = 'message';
    }
    loadPersonalDataToForm();
}

// ===== INITIALISATION DE MEIN PORTAL =====
function initMeinPortalPage() {
    const contractInfoContainer = document.getElementById('contractInfo');
    const offerDetailsContainer = document.getElementById('offerDetails');

    if (!contractInfoContainer || !offerDetailsContainer) return;

    const userEmail = localStorage.getItem('userEmail');

    if (!userEmail) {
        window.location.href = 'login.html';
        return;
    }

    // Afficher le nom
    const nameSpan = document.getElementById('userNameDisplay');
    if (nameSpan) {
        const anrede = localStorage.getItem('userAnrede');
        const nachname = localStorage.getItem('userNachname');
        if (nachname) {
            const displayName = anrede ? anrede + ' ' + nachname : nachname;
            nameSpan.innerHTML = '<span class="welcome-text">Willkommen</span>, <span class="welcome-name">' + displayName + '</span>';
        } else {
            nameSpan.innerHTML = '<span class="welcome-text">Willkommen</span>, <span class="welcome-name">' + userEmail + '</span>';
        }
    }

    // Attendre que Firebase soit prêt
    function waitForFirebaseAndLoad() {
        if (typeof firebase !== 'undefined' && firebase.apps.length) {
            loadPersonalInfo(userEmail);
            loadPortalData(userEmail);
        } else {
            setTimeout(waitForFirebaseAndLoad, 300);
        }
    }
    waitForFirebaseAndLoad();

    // ===== TOGGLE FORMULAIRE D'ÉDITION =====
    const toggleBtn = document.getElementById('togglePersonalEdit');
    const cancelBtn = document.getElementById('cancelPersonalEdit');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const editForm = document.getElementById('personalEditForm');
            if (editForm && editForm.classList.contains('active')) {
                closeEditForm();
            } else {
                openEditForm();
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            closeEditForm();
        });
    }

    // ===== SOUMETTRE LE FORMULAIRE D'ÉDITION =====
    const form = document.getElementById('editPersonalForm');
    const msg = document.getElementById('personalEditMessage');

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const userEmail = localStorage.getItem('userEmail');
            if (!userEmail) {
                msg.textContent = '❌ Kein Benutzer angemeldet.';
                msg.className = 'message error';
                return;
            }

            const anrede = document.getElementById('editPersonalAnrede').value;
            const vorname = document.getElementById('editPersonalVorname').value.trim();
            const nachname = document.getElementById('editPersonalNachname').value.trim();
            const telefon = document.getElementById('editPersonalTelefon').value.trim();
            const fax = document.getElementById('editPersonalFax').value.trim();

            if (!vorname || !nachname) {
                msg.textContent = '❌ Bitte füllen Sie Vorname und Nachname aus.';
                msg.className = 'message error';
                return;
            }

            try {
                const db = firebase.firestore();
                await db.collection('users').doc(userEmail).update({
                    anrede, vorname, nachname, telefon, fax
                });

                localStorage.setItem('userAnrede', anrede);
                localStorage.setItem('userNachname', nachname);

                msg.textContent = '✅ Persönliche Informationen erfolgreich aktualisiert!';
                msg.className = 'message success';

                loadPersonalInfo(userEmail);

                const nameSpan = document.getElementById('userNameDisplay');
                if (nameSpan && nachname) {
                    const displayName = anrede ? anrede + ' ' + nachname : nachname;
                    nameSpan.innerHTML = '<span class="welcome-text">Willkommen</span>, <span class="welcome-name">' + displayName + '</span>';
                }

                setTimeout(function() {
                    closeEditForm();
                }, 1500);

            } catch (error) {
                console.error('Fehler beim Aktualisieren:', error);
                msg.textContent = '❌ Fehler beim Speichern: ' + error.message;
                msg.className = 'message error';
            }
        });
    }
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
          forgotMsg.style.color = '#54e50d';
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

  // ===== GESTION DES ENTREPRISES =====
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
        container.innerHTML = '<p style="color:#6a7b91;">Keine Unternehmen vorhanden.</p>';
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
                <strong style="color:#54e50d; font-weight:700;">${data.name || 'Unbekannt'}</strong>
                ${data.service ? `<span style="color:#ffffff;"> - ${data.service}</span>` : ''}
                ${data.commercial ? `<span style="color:#6a7b91;"> (Commercial: ${data.commercial})</span>` : ''}
                ${data.phone ? `<span style="color:#6a7b91;"> - Tel: ${data.phone}</span>` : ''}
                ${data.created ? `<span style="color:#6a7b91;"> - Erstellt: ${data.created}</span>` : ''}
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
      container.innerHTML = '<p style="color:#ff6b6b;">Fehler beim Laden.</p>';
    }
  }

  // ===== GESTION DES UTILISATEURS =====
  async function loadUsers() {
    const container = document.getElementById('userList');
    try {
      const snapshot = await db.collection('users').get();
      if (snapshot.empty) {
        container.innerHTML = '<p style="color:#6a7b91;">Keine Benutzer vorhanden.</p>';
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
            <div class="user-actions">
              <button class="edit-btn" data-email="${email}">Bearbeiten</button>
              <button class="delete-btn" data-email="${email}">Löschen</button>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;

      document.querySelectorAll('#userList .edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditUserForm(btn.dataset.email));
      });

      document.querySelectorAll('#userList .delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const email = btn.dataset.email;
          if (confirm(`Möchten Sie den Benutzer "${email}" wirklich löschen?`)) {
            try {
              await db.collection('users').doc(email).delete();
              loadUsers();
              document.getElementById('editFormContainer').style.display = 'none';
              const msg = document.getElementById('editMessage');
              if (msg) {
                msg.textContent = '✅ Benutzer gelöscht.';
                msg.className = 'message success';
                setTimeout(() => { msg.textContent = ''; msg.className = 'message'; }, 3000);
              }
            } catch (error) {
              console.error('Fehler beim Löschen:', error);
              alert('Fehler beim Löschen des Benutzers.');
            }
          }
        });
      });

    } catch (error) {
      console.error(error);
      container.innerHTML = '<p style="color:#ff6b6b;">Fehler beim Laden.</p>';
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

  // ===== GESTION DES OFFRES (Angebote) =====
  initOfferForm();

  // ===== GESTION DES CONTRATS =====
  initContractForm();

  loadCompaniesAdmin();
  loadUsers();
  loadOffersAdmin();
  loadContractsAdmin();
}

// =====================================================================
// ===== BLOC 3 : company.html =========================================
// =====================================================================
function initCompanyPage() {
  const container = document.getElementById('companyListPublic');
  if (!container) return;

  function loadCompaniesPublic() {
    container.innerHTML = '<p style="color:#6a7b91;">Lade Unternehmen...</p>';

    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      setTimeout(loadCompaniesPublic, 500);
      return;
    }

    const db = firebase.firestore();

    Promise.all([
      db.collection('companies').orderBy('createdAt', 'desc').get(),
      db.collection('contracts').get()
    ])
    .then(([companiesSnapshot, contractsSnapshot]) => {
      if (companiesSnapshot.empty) {
        container.innerHTML = '<p style="color:#6a7b91;">Keine Unternehmen vorhanden.</p>';
        return;
      }

      const contractCounts = {};
      contractsSnapshot.forEach(doc => {
        const data = doc.data();
        const companyName = data.companyName || '';
        if (companyName) {
          contractCounts[companyName] = (contractCounts[companyName] || 0) + 1;
        }
      });

      let html = '';
      companiesSnapshot.forEach(doc => {
        const data = doc.data();
        const logoUrl = data.logo || DEFAULT_LOGO;
        let metaParts = [];
        if (data.service) metaParts.push('Service: ' + data.service);
        if (data.phone) metaParts.push('Tel: ' + data.phone);
        if (data.commercial) metaParts.push('Commercial: ' + data.commercial);
        if (data.created) metaParts.push('Erstellt: ' + data.created);
        const metaText = metaParts.join(' | ');

        const companyName = data.name || 'Unbekannt';
        const vertraege = contractCounts[companyName] || 0;

        html += `
          <div class="company-item">
            <div class="company-info">
              <img src="${logoUrl}" alt="${data.name || 'Logo'}" />
              <div class="company-details">
                <div class="name">${companyName}</div>
                <div class="meta">${metaText}</div>
              </div>
            </div>
            <div class="company-stats">
              <span class="number">${vertraege}</span> Verträge
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
    })
    .catch(error => {
      console.error('Fehler beim Laden der Unternehmen:', error);
      container.innerHTML = '<p style="color:#ff6b6b;">Fehler beim Laden der Unternehmen.</p>';
    });
  }

  function setupRealTimeListeners() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      setTimeout(setupRealTimeListeners, 500);
      return;
    }

    const db = firebase.firestore();

    db.collection('contracts').onSnapshot(function() {
      console.log('Changement détecté dans les contrats, mise à jour des entreprises...');
      loadCompaniesPublic();
    }, function(error) {
      console.error('Erreur lors de l\'écoute des contrats:', error);
    });

    db.collection('companies').onSnapshot(function() {
      console.log('Changement détecté dans les entreprises, mise à jour...');
      loadCompaniesPublic();
    }, function(error) {
      console.error('Erreur lors de l\'écoute des entreprises:', error);
    });

    db.collection('offers').onSnapshot(function() {
      console.log('Changement détecté dans les offres, mise à jour...');
      loadCompaniesPublic();
    }, function(error) {
      console.error('Erreur lors de l\'écoute des offres:', error);
    });
  }

  loadCompaniesPublic();
  setupRealTimeListeners();
}

// =====================================================================
// ===== BLOC 4 : Gestion du bouton Login / Abmelden ===================
// =====================================================================
function updateLoginButton() {
  const loginBtn = document.querySelector('.login-btn');
  const logoutMobile = document.getElementById('logoutMobile');
  const isLoggedIn = localStorage.getItem('userEmail') !== null;

  if (loginBtn) {
    if (isLoggedIn) {
      loginBtn.textContent = 'Abmelden';
      loginBtn.href = '#';
      loginBtn.onclick = function(e) {
        e.preventDefault();
        window.logout();
      };
    } else {
      loginBtn.textContent = 'Login';
      loginBtn.href = 'login.html';
      loginBtn.onclick = null;
    }
  }

  if (logoutMobile) {
    if (isLoggedIn) {
      logoutMobile.style.display = 'block';
      logoutMobile.textContent = 'Abmelden';
      logoutMobile.onclick = function(e) {
        e.preventDefault();
        window.logout();
      };
    } else {
      logoutMobile.style.display = 'none';
      logoutMobile.onclick = null;
    }
  }
}

function updateUserDisplay() {
  const nameSpan = document.getElementById('userNameDisplay');
  if (!nameSpan) return;

  const isLoggedIn = localStorage.getItem('userEmail') !== null;
  const anrede = localStorage.getItem('userAnrede');
  const nachname = localStorage.getItem('userNachname');
  const userEmail = localStorage.getItem('userEmail');

  if (isLoggedIn && nachname) {
    const displayName = anrede ? anrede + ' ' + nachname : nachname;
    nameSpan.innerHTML = '<span class="welcome-text">Willkommen</span>, <span class="welcome-name">' + displayName + '</span>';
  } else if (isLoggedIn && userEmail) {
    nameSpan.innerHTML = '<span class="welcome-text">Willkommen</span>, <span class="welcome-name">' + userEmail + '</span>';
  } else if (isLoggedIn) {
    nameSpan.innerHTML = '<span class="welcome-text">Willkommen</span>';
  } else {
    nameSpan.innerHTML = '';
  }
}

// =====================================================================
// ===== BLOC 5 : Menu transparent au scroll ===========================
// =====================================================================
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
// ===== BLOC 6 : Menu hamburger sur mobile ============================
// =====================================================================
function initHamburger() {
  const hamburger = document.getElementById('hamburgerBtn');
  const nav = document.getElementById('mainNav');

  if (!hamburger || !nav) {
    setTimeout(initHamburger, 200);
    return;
  }

  const newHamburger = hamburger.cloneNode(true);
  hamburger.parentNode.replaceChild(newHamburger, hamburger);

  const finalHamburger = document.getElementById('hamburgerBtn');
  const finalNav = document.getElementById('mainNav');

  if (!finalHamburger || !finalNav) return;

  finalHamburger.addEventListener('click', function(e) {
    e.stopPropagation();
    this.classList.toggle('active');
    finalNav.classList.toggle('open');
  });

  finalNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function() {
      if (finalNav.classList.contains('open')) {
        finalHamburger.classList.remove('active');
        finalNav.classList.remove('open');
      }
    });
  });

  document.addEventListener('click', function(e) {
    if (finalNav.classList.contains('open')) {
      if (!finalNav.contains(e.target) && !finalHamburger.contains(e.target)) {
        finalHamburger.classList.remove('active');
        finalNav.classList.remove('open');
      }
    }
  });
}

// =====================================================================
// ===== BLOC 7 : Chat Tawk.to =========================================
// =====================================================================
function initTawkTo() {
  document.querySelectorAll('script[src*="embed.tawk.to"]').forEach(s => s.remove());

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://embed.tawk.to/6a7b0f1327c08c1d4cd75eb2/1jvob5pk8';
  script.charset = 'UTF-8';
  script.setAttribute('crossorigin', '*');
  document.head.appendChild(script);
}

// =====================================================================
// ===== BLOC STATS : stat.html ========================================
// =====================================================================
function initStatsPage() {
  if (!document.getElementById('emailDonut')) return;

  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    console.warn('Firebase nicht initialisiert. Warte...');
    setTimeout(initStatsPage, 500);
    return;
  }
  const db = firebase.firestore();

  let emailChart = null, companyChart = null, stromChart = null, gasChart = null, stromVertragChart = null, gasVertragChart = null;
  let offerComparisonChart = null;
  let contractComparisonChart = null;

  async function loadStats() {
    try {
      const [usersSnap, companiesSnap, offersSnap, contractsSnap] = await Promise.all([
        db.collection('users').get(),
        db.collection('companies').get(),
        db.collection('offers').get(),
        db.collection('contracts').get()
      ]);

      const totalUsers = usersSnap.size;
      const totalCompanies = companiesSnap.size;

      let totalStrom = 0;
      let totalGas = 0;
      let totalStromVertrag = 0;
      let totalGasVertrag = 0;

      const companyMap = {};
      const contractCounts = {};
      const companyLogoMap = {};

      offersSnap.forEach(doc => {
        const data = doc.data();
        if (data.type === 'strom' || data.type === 'both') {
          totalStrom++;
        }
        if (data.type === 'gas' || data.type === 'both') {
          totalGas++;
        }

        const companyId = data.companyId || 'unknown';
        const price = parseFloat(data.price ? data.price.replace(/[^0-9.,]/g, '').replace(',', '.') : 0);

        if (!companyMap[companyId]) {
          companyMap[companyId] = {
            name: data.companyName || 'Unbekannt',
            logo: data.companyLogo || '',
            strom: null,
            gas: null
          };
          companyLogoMap[data.companyName || 'Unbekannt'] = data.companyLogo || '';
        }

        if (data.type === 'strom' || data.type === 'both') {
          companyMap[companyId].strom = price;
        }
        if (data.type === 'gas' || data.type === 'both') {
          companyMap[companyId].gas = price;
        }
      });

      contractsSnap.forEach(doc => {
        const data = doc.data();
        if (data.energyType === 'strom') {
          totalStromVertrag++;
        } else if (data.energyType === 'gas') {
          totalGasVertrag++;
        }

        const companyName = data.companyName || 'Unbekannt';
        if (!contractCounts[companyName]) {
          contractCounts[companyName] = { strom: 0, gas: 0 };
          const logo = data.companyLogo || '';
          companyLogoMap[companyName] = logo;
        }
        if (data.energyType === 'strom') {
          contractCounts[companyName].strom++;
        } else if (data.energyType === 'gas') {
          contractCounts[companyName].gas++;
        }
      });

      Object.keys(companyMap).forEach(key => {
        const name = companyMap[key].name;
        if (companyMap[key].logo && !companyLogoMap[name]) {
          companyLogoMap[name] = companyMap[key].logo;
        }
      });

      const chartData = Object.values(companyMap)
        .filter(company => company.strom !== null || company.gas !== null)
        .sort((a, b) => (a.strom || 0) - (b.strom || 0));

      const contractChartData = Object.keys(contractCounts)
        .filter(name => contractCounts[name].strom > 0 || contractCounts[name].gas > 0)
        .sort((a, b) => {
          const totalA = contractCounts[a].strom + contractCounts[a].gas;
          const totalB = contractCounts[b].strom + contractCounts[b].gas;
          return totalB - totalA;
        });

      const contractDataWithLogos = contractChartData.map(name => ({
        name: name,
        logo: companyLogoMap[name] || DEFAULT_LOGO
      }));

      const emailEl = document.getElementById('emailCount');
      const companyEl = document.getElementById('companyCount');
      const stromEl = document.getElementById('stromCount');
      const gasEl = document.getElementById('gasCount');
      const stromVertragEl = document.getElementById('stromVertragCount');
      const gasVertragEl = document.getElementById('gasVertragCount');

      if (emailEl) emailEl.textContent = totalUsers;
      if (companyEl) companyEl.textContent = totalCompanies;
      if (stromEl) stromEl.textContent = totalStrom;
      if (gasEl) gasEl.textContent = totalGas;
      if (stromVertragEl) stromVertragEl.textContent = totalStromVertrag;
      if (gasVertragEl) gasVertragEl.textContent = totalGasVertrag;

      updateDonut('emailDonut', totalUsers, '#54e50d', '#6a7b91');
      updateDonut('companyDonut', totalCompanies, '#54e50d', '#6a7b91');
      updateDonut('stromDonut', totalStrom, '#54e50d', '#6a7b91');
      updateDonut('gasDonut', totalGas, '#54e50d', '#6a7b91');
      updateDonut('stromVertragDonut', totalStromVertrag, '#54e50d', '#6a7b91');
      updateDonut('gasVertragDonut', totalGasVertrag, '#54e50d', '#6a7b91');

      updateOfferComparisonChart(chartData);
      updateContractComparisonChart(contractDataWithLogos, contractCounts);

    } catch (error) {
      console.error('Fehler beim Laden der Statistiken:', error);
      const ids = ['emailCount', 'companyCount', 'stromCount', 'gasCount', 'stromVertragCount', 'gasVertragCount'];
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '❌';
      });
    }
  }

  function updateDonut(canvasId, value, color, bgColor) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (canvasId === 'emailDonut' && emailChart) { emailChart.destroy(); }
    else if (canvasId === 'companyDonut' && companyChart) { companyChart.destroy(); }
    else if (canvasId === 'stromDonut' && stromChart) { stromChart.destroy(); }
    else if (canvasId === 'gasDonut' && gasChart) { gasChart.destroy(); }
    else if (canvasId === 'stromVertragDonut' && stromVertragChart) { stromVertragChart.destroy(); }
    else if (canvasId === 'gasVertragDonut' && gasVertragChart) { gasVertragChart.destroy(); }

    const displayValue = Math.min(value, 100);
    const remaining = 100 - displayValue;

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['', ''],
        datasets: [{
          data: [displayValue, remaining],
          backgroundColor: [color, bgColor],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '65%',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      },
      plugins: [{
        id: 'centerText',
        beforeDraw: function(chart) {
          const { width, height, ctx } = chart;
          ctx.save();
          const text = value.toString();
          ctx.font = 'bold 18px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          const centerX = width / 2;
          const centerY = height / 2;
          ctx.fillText(text, centerX, centerY);
          ctx.restore();
        }
      }]
    });

    if (canvasId === 'emailDonut') { emailChart = chart; }
    else if (canvasId === 'companyDonut') { companyChart = chart; }
    else if (canvasId === 'stromDonut') { stromChart = chart; }
    else if (canvasId === 'gasDonut') { gasChart = chart; }
    else if (canvasId === 'stromVertragDonut') { stromVertragChart = chart; }
    else if (canvasId === 'gasVertragDonut') { gasVertragChart = chart; }
  }

  function updateOfferComparisonChart(data) {
    const canvas = document.getElementById('offerComparisonChart');
    if (!canvas) return;

    if (offerComparisonChart) {
      offerComparisonChart.destroy();
      offerComparisonChart = null;
    }

    if (data.length === 0) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#6a7b91';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Keine Angebote vorhanden', canvas.width / 2, canvas.height / 2);
      return;
    }

    const ctx = canvas.getContext('2d');

    const labels = data.map((item, index) => index + 1);
    const stromPrices = data.map(item => item.strom || 0);
    const gasPrices = data.map(item => item.gas || 0);

    const stromColor = '#54e50d';
    const gasColor = '#a0a6cc';
    const stromColorRgba = 'rgba(84, 229, 13, 0.8)';
    const gasColorRgba = 'rgba(133, 145, 214, 0.8)';

    offerComparisonChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Strom (€/kWh)',
            data: stromPrices,
            backgroundColor: stromColorRgba,
            borderColor: stromColor,
            borderWidth: 2,
            borderRadius: 4,
            barPercentage: 0.35
          },
          {
            label: 'Gas (€/kWh)',
            data: gasPrices,
            backgroundColor: gasColorRgba,
            borderColor: gasColor,
            borderWidth: 2,
            borderRadius: 4,
            barPercentage: 0.35
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: '#ffffff',
              font: { size: 14, weight: 'bold' },
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + ' €/kWh';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: {
              color: '#6a7b91',
              callback: function(value) {
                return value.toFixed(2) + ' €';
              }
            }
          },
          x: {
            grid: { display: false },
            ticks: { display: false },
            afterFit: function(scale) {
              scale.height += 50;
            }
          }
        },
        plugins: [{
          id: 'customLabels',
          afterDraw: function(chart) {
            const ctx = chart.ctx;
            chart.data.datasets.forEach(function(dataset, i) {
              const meta = chart.getDatasetMeta(i);
              meta.data.forEach(function(bar, index) {
                const data = dataset.data[index];
                if (data > 0) {
                  ctx.fillStyle = '#ffffff';
                  ctx.font = 'bold 11px Arial';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'bottom';
                  const yPos = bar.y - 4;
                  ctx.fillText(data.toFixed(2), bar.x, yPos);
                }
              });
            });
          }
        }]
      },
      plugins: [{
        id: 'logoLabels',
        afterDraw: function(chart) {
          const ctx = chart.ctx;
          const xAxis = chart.scales.x;
          const yAxis = chart.scales.y;
          const logoSize = 28;
          const logoY = yAxis.bottom + 30;

          data.forEach((item, index) => {
            const x = xAxis.getPixelForValue(index);

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = item.logo || DEFAULT_LOGO;

            const drawLogo = function() {
              ctx.save();
              ctx.shadowColor = 'rgba(216, 217, 220, 0.4)';
              ctx.shadowBlur = 8;
              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(x - logoSize/2 - 4, logoY - logoSize/2 - 4, logoSize + 8, logoSize + 8, 6);
              } else {
                ctx.rect(x - logoSize/2 - 4, logoY - logoSize/2 - 4, logoSize + 8, logoSize + 8);
              }
              ctx.fillStyle = 'rgba(205, 205, 209, 0.6)';
              ctx.fill();
              ctx.shadowBlur = 0;
              ctx.beginPath();
              ctx.arc(x, logoY, logoSize/2, 0, Math.PI * 2);
              ctx.clip();
              ctx.drawImage(img, x - logoSize/2, logoY - logoSize/2, logoSize, logoSize);
              ctx.restore();
            };

            if (img.complete && img.naturalWidth > 0) {
              drawLogo();
            } else {
              img.onload = drawLogo;
              img.onerror = function() {
                const defaultImg = new Image();
                defaultImg.src = DEFAULT_LOGO;
                defaultImg.onload = drawLogo;
              };
            }
          });
        }
      }]
    });
  }

  function updateContractComparisonChart(contractDataWithLogos, contractCounts) {
    const canvas = document.getElementById('contractComparisonChart');
    if (!canvas) return;

    if (contractComparisonChart) {
      contractComparisonChart.destroy();
      contractComparisonChart = null;
    }

    if (contractDataWithLogos.length === 0) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#6a7b91';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Keine Verträge vorhanden', canvas.width / 2, canvas.height / 2);
      return;
    }

    const ctx = canvas.getContext('2d');

    const labels = contractDataWithLogos.map((item, index) => index + 1);
    const stromData = contractDataWithLogos.map(item => contractCounts[item.name]?.strom || 0);
    const gasData = contractDataWithLogos.map(item => contractCounts[item.name]?.gas || 0);

    const stromColor = '#54e50d';
    const gasColor = '#4ecdc4';
    const stromColorRgba = 'rgba(84, 229, 13, 0.8)';
    const gasColorRgba = 'rgba(78, 205, 196, 0.8)';

    contractComparisonChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Strom Verträge',
            data: stromData,
            backgroundColor: stromColorRgba,
            borderColor: stromColor,
            borderWidth: 2,
            borderRadius: 4,
            barPercentage: 0.35
          },
          {
            label: 'Gas Verträge',
            data: gasData,
            backgroundColor: gasColorRgba,
            borderColor: gasColor,
            borderWidth: 2,
            borderRadius: 4,
            barPercentage: 0.35
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: '#ffffff',
              font: { size: 14, weight: 'bold' },
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + context.parsed.y + ' Vertrag(e)';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: {
              color: '#6a7b91',
              stepSize: 1,
              callback: function(value) {
                return value + ' Verträge';
              }
            }
          },
          x: {
            grid: { display: false },
            ticks: { display: false },
            afterFit: function(scale) {
              scale.height += 50;
            }
          }
        },
        plugins: [{
          id: 'customLabels',
          afterDraw: function(chart) {
            const ctx = chart.ctx;
            chart.data.datasets.forEach(function(dataset, i) {
              const meta = chart.getDatasetMeta(i);
              meta.data.forEach(function(bar, index) {
                const data = dataset.data[index];
                if (data > 0) {
                  ctx.fillStyle = '#ffffff';
                  ctx.font = 'bold 11px Arial';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'bottom';
                  const yPos = bar.y - 4;
                  ctx.fillText(data, bar.x, yPos);
                }
              });
            });
          }
        }]
      },
      plugins: [{
        id: 'logoLabelsContract',
        afterDraw: function(chart) {
          const ctx = chart.ctx;
          const xAxis = chart.scales.x;
          const yAxis = chart.scales.y;
          const logoSize = 28;
          const logoY = yAxis.bottom + 30;

          contractDataWithLogos.forEach((item, index) => {
            const x = xAxis.getPixelForValue(index);

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = item.logo || DEFAULT_LOGO;

            const drawLogo = function() {
              ctx.save();
              ctx.shadowColor = 'rgba(216, 217, 220, 0.4)';
              ctx.shadowBlur = 8;
              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(x - logoSize/2 - 4, logoY - logoSize/2 - 4, logoSize + 8, logoSize + 8, 6);
              } else {
                ctx.rect(x - logoSize/2 - 4, logoY - logoSize/2 - 4, logoSize + 8, logoSize + 8);
              }
              ctx.fillStyle = 'rgba(205, 205, 209, 0.6)';
              ctx.fill();
              ctx.shadowBlur = 0;
              ctx.beginPath();
              ctx.arc(x, logoY, logoSize/2, 0, Math.PI * 2);
              ctx.clip();
              ctx.drawImage(img, x - logoSize/2, logoY - logoSize/2, logoSize, logoSize);
              ctx.restore();
            };

            if (img.complete && img.naturalWidth > 0) {
              drawLogo();
            } else {
              img.onload = drawLogo;
              img.onerror = function() {
                const defaultImg = new Image();
                defaultImg.src = DEFAULT_LOGO;
                defaultImg.onload = drawLogo;
              };
            }
          });
        }
      }]
    });
  }

  function setupStatsRealTimeListeners() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      setTimeout(setupStatsRealTimeListeners, 500);
      return;
    }

    const db = firebase.firestore();

    db.collection('users').onSnapshot(() => loadStats());
    db.collection('companies').onSnapshot(() => loadStats());
    db.collection('offers').onSnapshot(() => loadStats());
    db.collection('contracts').onSnapshot(() => loadStats());
  }

  loadStats();
  setupStatsRealTimeListeners();
}

// =====================================================================
// ===== OFFRES - GESTION ==============================================
// =====================================================================

async function loadCompaniesForOfferSelect() {
  const panel = document.getElementById('offerCompanyPanel');
  if (!panel) return;

  panel.innerHTML = '<p style="color:#6a7b91; padding:10px;">Lade Unternehmen...</p>';

  try {
    const snapshot = await db.collection('companies').orderBy('name').get();

    if (snapshot.empty) {
      panel.innerHTML = '<p style="color:#6a7b91; padding:10px;">Keine Unternehmen vorhanden.</p>';
      return;
    }

    const currentId = document.getElementById('offerCompany')?.value || '';
    let html = '';

    snapshot.forEach(doc => {
      const data = doc.data();
      const name = (data.name || 'Unbekannt').replace(/"/g, '&quot;');
      const logo = data.logo || '';
      const selectedClass = doc.id === currentId ? ' selected' : '';

      html += `
        <div class="custom-select-option${selectedClass}" data-id="${doc.id}" data-name="${name}" data-logo="${logo}">
          <img src="${logo || DEFAULT_LOGO}" alt="${name}" class="custom-select-option-logo" onerror="this.onerror=null;this.src='${DEFAULT_LOGO}';" />
          <span class="custom-select-option-name">${name}</span>
        </div>
      `;
    });

    panel.innerHTML = html;

    panel.querySelectorAll('.custom-select-option').forEach(opt => {
      opt.addEventListener('click', () => {
        setOfferCompanySelection(opt.dataset.id, opt.dataset.name, opt.dataset.logo);
        closeOfferCompanyPanel();
      });
    });

  } catch (error) {
    console.error('Fehler beim Laden der Unternehmen:', error);
    panel.innerHTML = '<p style="color:#ff6b6b; padding:10px;">Fehler beim Laden.</p>';
  }
}

function setOfferCompanySelection(id, name, logoUrl) {
  const hiddenInput = document.getElementById('offerCompany');
  const trigger = document.getElementById('offerCompanyTrigger');
  if (hiddenInput) hiddenInput.value = id || '';

  if (trigger) {
    if (id) {
      trigger.innerHTML = `
        <img src="${logoUrl || DEFAULT_LOGO}" alt="${name || ''}" class="custom-select-trigger-logo" onerror="this.onerror=null;this.src='${DEFAULT_LOGO}';" />
        <span class="custom-select-trigger-name">${name || ''}</span>
      `;
    } else {
      trigger.innerHTML = '<span class="custom-select-trigger-placeholder">-- Unternehmen auswählen --</span>';
    }
  }

  document.querySelectorAll('#offerCompanyPanel .custom-select-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.id === id);
  });
}

function openOfferCompanyPanel() {
  const wrap = document.getElementById('offerCompanySelect');
  if (wrap) wrap.classList.add('open');
}

function closeOfferCompanyPanel() {
  const wrap = document.getElementById('offerCompanySelect');
  if (wrap) wrap.classList.remove('open');
}

function setupCompanyLogoPreview() {
  const trigger = document.getElementById('offerCompanyTrigger');
  const wrap = document.getElementById('offerCompanySelect');
  if (!trigger || !wrap) return;

  const newTrigger = trigger.cloneNode(true);
  trigger.parentNode.replaceChild(newTrigger, trigger);

  newTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    wrap.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) closeOfferCompanyPanel();
  });
}

function initOfferForm() {
  const offerForm = document.getElementById('offerForm');
  const toggleOfferBtn = document.getElementById('toggleOfferForm');
  const offerFormContainer = document.getElementById('offerFormContainer');
  const cancelOfferBtn = document.getElementById('cancelOfferForm');
  const offerMessage = document.getElementById('offerMessage');

  loadCompaniesForOfferSelect();
  setupCompanyLogoPreview();

  if (toggleOfferBtn && offerFormContainer) {
    toggleOfferBtn.addEventListener('click', function() {
      if (offerFormContainer.style.display === 'none' || offerFormContainer.style.display === '') {
        offerFormContainer.style.display = 'block';
        this.textContent = '✖ Angebot schließen';
        loadCompaniesForOfferSelect();
      } else {
        offerFormContainer.style.display = 'none';
        this.textContent = '➕ Angebot hinzufügen';
      }
    });
  }

  if (cancelOfferBtn && offerFormContainer) {
    cancelOfferBtn.addEventListener('click', function() {
      offerFormContainer.style.display = 'none';
      if (toggleOfferBtn) {
        toggleOfferBtn.textContent = '➕ Angebot hinzufügen';
      }
      if (offerMessage) {
        offerMessage.textContent = '';
        offerMessage.className = 'message';
      }
      if (offerForm) {
        offerForm.reset();
        delete offerForm.dataset.editId;
      }
      setOfferCompanySelection('', '', '');
      closeOfferCompanyPanel();
    });
  }

  if (offerForm) {
    offerForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const editId = this.dataset.editId;
      const companyId = document.getElementById('offerCompany').value;
      const energyType = document.querySelector('input[name="offerEnergyType"]:checked');
      let price = document.getElementById('offerPrice').value.trim();
      let duration = document.getElementById('offerDuration').value.trim();
      const msg = document.getElementById('offerMessage');

      if (!companyId) {
        msg.textContent = 'Bitte wählen Sie ein Unternehmen aus.';
        msg.className = 'message error';
        return;
      }

      if (!energyType) {
        msg.textContent = 'Bitte wählen Sie einen Energietyp.';
        msg.className = 'message error';
        return;
      }

      if (!price) {
        msg.textContent = 'Bitte geben Sie einen Preis ein.';
        msg.className = 'message error';
        return;
      }

      if (!duration) {
        msg.textContent = 'Bitte geben Sie eine Laufzeit ein.';
        msg.className = 'message error';
        return;
      }

      if (!price.includes('€/kWh')) {
        price = price.trim() + ' €/kWh';
      }

      if (!duration.includes('Monate')) {
        duration = duration.trim() + ' Monate';
      }

      try {
        const companyDoc = await db.collection('companies').doc(companyId).get();
        const companyData = companyDoc.data() || {};
        const companyName = companyData.name || 'Unbekannt';

        const offerData = {
          companyId: companyId,
          companyName: companyName,
          companyLogo: companyData.logo || '',
          type: energyType.value,
          price: price,
          duration: duration
        };

        if (editId) {
          await db.collection('offers').doc(editId).update(offerData);
          msg.textContent = `✅ Angebot für ${companyName} erfolgreich aktualisiert!`;
          delete offerForm.dataset.editId;
        } else {
          offerData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
          await db.collection('offers').add(offerData);
          msg.textContent = `✅ Angebot für ${companyName} (${energyType.value === 'strom' ? '⚡ Strom' : '🔥 Gas'}) erfolgreich hinzugefügt!`;
        }

        msg.className = 'message success';
        offerForm.reset();
        setOfferCompanySelection('', '', '');

        loadOffersAdmin();
        loadCompaniesForOfferSelect();

        setTimeout(() => {
          offerFormContainer.style.display = 'none';
          if (toggleOfferBtn) toggleOfferBtn.textContent = '➕ Angebot hinzufügen';
          msg.textContent = '';
          msg.className = 'message';
        }, 1500);

      } catch (error) {
        console.error('❌ Fehler beim Speichern des Angebots:', error);
        msg.textContent = '❌ Fehler: ' + error.message;
        msg.className = 'message error';
      }
    });
  }
}

async function loadOffersAdmin() {
  const container = document.getElementById('offerList');
  if (!container) return;

  try {
    const snapshot = await db.collection('offers').orderBy('createdAt', 'desc').get();
    if (snapshot.empty) {
      container.innerHTML = '<p style="color:#6a7b91;">Keine Angebote vorhanden.</p>';
      return;
    }
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const typeLabel = data.type === 'strom' ? '⚡ Strom' : '🔥 Gas';

      html += `
        <div class="company-item" data-id="${doc.id}">
          <div class="company-info">
            ${data.companyLogo ? `<img src="${data.companyLogo}" style="width:40px; height:40px; object-fit:contain; border-radius:4px; background:#fff; padding:2px;" />` : ''}
            <div>
              <strong style="color:#54e50d; font-weight:700;">${data.companyName || 'Unbekannt'}</strong>
              <span style="color:#ffffff; margin-left:12px;">${typeLabel}</span>
              <span style="color:#6a7b91; margin-left:12px;">💰 ${data.price || 'k.A.'}</span>
              <span style="color:#6a7b91; margin-left:12px;">⏱ ${data.duration || 'k.A.'}</span>
            </div>
          </div>
          <div class="company-actions">
            <button class="edit-btn" data-id="${doc.id}" onclick="editOffer('${doc.id}')">Bearbeiten</button>
            <button class="delete-btn" data-id="${doc.id}" onclick="deleteOffer('${doc.id}')">Löschen</button>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  } catch (error) {
    console.error('❌ Fehler beim Laden der Angebote:', error);
    container.innerHTML = '<p style="color:#ff6b6b;">Fehler beim Laden.</p>';
  }
}

window.editOffer = async function(id) {
  try {
    const doc = await db.collection('offers').doc(id).get();
    if (doc.exists) {
      const data = doc.data();

      const toggleBtn = document.getElementById('toggleOfferForm');
      const formContainer = document.getElementById('offerFormContainer');
      if (toggleBtn && formContainer) {
        formContainer.style.display = 'block';
        toggleBtn.textContent = '✖ Angebot schließen';
      }

      setOfferCompanySelection(data.companyId || '', data.companyName || '', data.companyLogo || '');

      const radio = document.querySelector(`input[name="offerEnergyType"][value="${data.type}"]`);
      if (radio) radio.checked = true;

      let priceValue = data.price || '';
      let durationValue = data.duration || '';

      priceValue = priceValue.replace(/\s*€\/kWh\s*$/, '');
      durationValue = durationValue.replace(/\s*Monate\s*$/, '');

      document.getElementById('offerPrice').value = priceValue;
      document.getElementById('offerDuration').value = durationValue;

      document.getElementById('offerMessage').textContent = '✏️ Angebot wird bearbeitet...';
      document.getElementById('offerMessage').className = 'message';

      document.getElementById('offerForm').dataset.editId = id;
    }
  } catch (error) {
    console.error('Fehler beim Laden des Angebots:', error);
    alert('Fehler beim Laden des Angebots.');
  }
};

window.deleteOffer = async function(id) {
  if (confirm('Möchten Sie dieses Angebot wirklich löschen?')) {
    try {
      await db.collection('offers').doc(id).delete();
      loadOffersAdmin();
      const msg = document.getElementById('offerMessage');
      if (msg) {
        msg.textContent = '✅ Angebot gelöscht.';
        msg.className = 'message success';
        setTimeout(() => { msg.textContent = ''; msg.className = 'message'; }, 3000);
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Angebots:', error);
      alert('Fehler beim Löschen des Angebots.');
    }
  }
};

// =====================================================================
// ===== CONTRATS - GESTION ============================================
// =====================================================================

let allUsers = [];
let allOffers = [];

async function loadUsersForContract() {
  try {
    const snapshot = await db.collection('users').get();
    allUsers = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      allUsers.push({
        email: doc.id,
        vorname: data.vorname || '',
        nachname: data.nachname || '',
        fullName: (data.vorname || '') + ' ' + (data.nachname || '')
      });
    });
  } catch (error) {
    console.error('Fehler beim Laden der Benutzer:', error);
  }
}

async function loadOffersForContractSelect() {
  const panel = document.getElementById('contractOfferPanel');
  if (!panel) return;

  panel.innerHTML = '<p style="color:#6a7b91; padding:10px;">Lade Angebote...</p>';

  try {
    const snapshot = await db.collection('offers').orderBy('companyName').get();

    if (snapshot.empty) {
      panel.innerHTML = '<p style="color:#6a7b91; padding:10px;">Keine Angebote vorhanden.</p>';
      return;
    }

    allOffers = [];
    const currentId = document.getElementById('contractOfferId')?.value || '';
    let html = '';

    snapshot.forEach(doc => {
      const data = doc.data();
      const offerData = {
        id: doc.id,
        companyName: data.companyName || 'Unbekannt',
        companyLogo: data.companyLogo || '',
        type: data.type || 'strom',
        price: data.price || 'k.A.',
        duration: data.duration || 'k.A.'
      };
      allOffers.push(offerData);

      const label = `${data.companyName || 'Unbekannt'} - ${data.type === 'strom' ? '⚡ Strom' : '🔥 Gas'} - ${data.price || 'k.A.'}`;
      const selectedClass = doc.id === currentId ? ' selected' : '';

      html += `
        <div class="custom-select-option${selectedClass}" data-id="${doc.id}" data-name="${data.companyName}" data-logo="${data.companyLogo}" data-price="${data.price || ''}" data-duration="${data.duration || ''}" data-type="${data.type || 'strom'}">
          <img src="${data.companyLogo || DEFAULT_LOGO}" alt="${data.companyName}" class="custom-select-option-logo" onerror="this.onerror=null;this.src='${DEFAULT_LOGO}';" />
          <span class="custom-select-option-name">${label}</span>
        </div>
      `;
    });

    panel.innerHTML = html;

    panel.querySelectorAll('.custom-select-option').forEach(opt => {
      opt.addEventListener('click', () => {
        setContractOfferSelection(opt.dataset.id, opt.dataset.name, opt.dataset.logo, opt.dataset.price, opt.dataset.duration, opt.dataset.type);
        closeContractOfferPanel();
      });
    });

  } catch (error) {
    console.error('Fehler beim Laden der Angebote:', error);
    panel.innerHTML = '<p style="color:#ff6b6b; padding:10px;">Fehler beim Laden.</p>';
  }
}

function setContractOfferSelection(id, name, logoUrl, price, duration, type) {
  const hiddenInput = document.getElementById('contractOfferId');
  const trigger = document.getElementById('contractOfferTrigger');
  const infoContainer = document.getElementById('contractOfferInfo');

  if (hiddenInput) hiddenInput.value = id || '';

  if (trigger) {
    if (id) {
      trigger.innerHTML = `
        <img src="${logoUrl || DEFAULT_LOGO}" alt="${name || ''}" class="custom-select-trigger-logo" onerror="this.onerror=null;this.src='${DEFAULT_LOGO}';" />
        <span class="custom-select-trigger-name">${name || ''} - ${type === 'strom' ? '⚡ Strom' : '🔥 Gas'}</span>
      `;
    } else {
      trigger.innerHTML = '<span class="custom-select-trigger-placeholder">-- Angebot auswählen --</span>';
    }
  }

  if (id && infoContainer) {
    infoContainer.style.display = 'block';
    document.getElementById('contractOfferCompanyName').textContent = name || '-';
    document.getElementById('contractOfferPrice').textContent = price || '-';
    document.getElementById('contractOfferDuration').textContent = duration || '-';
  } else if (infoContainer) {
    infoContainer.style.display = 'none';
  }

  document.querySelectorAll('#contractOfferPanel .custom-select-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.id === id);
  });
}

function openContractOfferPanel() {
  const wrap = document.getElementById('contractOfferSelect');
  if (wrap) wrap.classList.add('open');
}

function closeContractOfferPanel() {
  const wrap = document.getElementById('contractOfferSelect');
  if (wrap) wrap.classList.remove('open');
}

function setupContractOfferSelect() {
  const trigger = document.getElementById('contractOfferTrigger');
  const wrap = document.getElementById('contractOfferSelect');
  if (!trigger || !wrap) return;

  const newTrigger = trigger.cloneNode(true);
  trigger.parentNode.replaceChild(newTrigger, trigger);

  newTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    wrap.classList.toggle('open');
    loadOffersForContractSelect();
  });

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) closeContractOfferPanel();
  });
}

function setupUserSearch() {
  const searchInput = document.getElementById('contractUserSearch');
  const resultsContainer = document.getElementById('contractUserResults');
  const selectedContainer = document.getElementById('contractUserSelected');
  const selectedName = document.getElementById('contractUserSelectedName');
  const clearBtn = document.getElementById('contractUserClear');
  const hiddenInput = document.getElementById('contractUserId');

  if (!searchInput) return;

  searchInput.addEventListener('input', function() {
    const query = this.value.toLowerCase().trim();

    if (query.length < 2) {
      resultsContainer.classList.remove('show');
      return;
    }

    const filtered = allUsers.filter(user => {
      const searchStr = (user.fullName + ' ' + user.email).toLowerCase();
      return searchStr.includes(query);
    });

    if (filtered.length === 0) {
      resultsContainer.innerHTML = '<div class="result-item" style="color:#6a7b91;">Keine Benutzer gefunden</div>';
      resultsContainer.classList.add('show');
      return;
    }

    let html = '';
    filtered.slice(0, 10).forEach(user => {
      html += `
        <div class="result-item" data-email="${user.email}">
          <div>${user.fullName || user.email}</div>
          <div class="result-email">${user.email}</div>
        </div>
      `;
    });
    resultsContainer.innerHTML = html;
    resultsContainer.classList.add('show');

    resultsContainer.querySelectorAll('.result-item').forEach(item => {
      item.addEventListener('click', function() {
        const email = this.dataset.email;
        const user = allUsers.find(u => u.email === email);
        if (user) {
          searchInput.value = user.fullName || user.email;
          hiddenInput.value = email;
          selectedName.textContent = user.fullName || user.email + ' (' + user.email + ')';
          selectedContainer.style.display = 'block';
          resultsContainer.classList.remove('show');
        }
      });
    });
  });

  document.addEventListener('click', function(e) {
    if (!resultsContainer.contains(e.target) && e.target !== searchInput) {
      resultsContainer.classList.remove('show');
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      searchInput.value = '';
      hiddenInput.value = '';
      selectedContainer.style.display = 'none';
      resultsContainer.classList.remove('show');
    });
  }
}

function initDatePickers() {
  const dateFrom = document.getElementById('contractDateFrom');
  const dateTo = document.getElementById('contractDateTo');

  if (typeof flatpickr === 'undefined') {
    console.warn('Flatpickr nicht geladen. Utilisation des datepickers natifs.');
    return;
  }

  if (dateFrom) {
    try {
      flatpickr(dateFrom, {
        dateFormat: "Y-m-d",
        locale: "de",
        allowInput: true,
        minDate: "today",
        onChange: function(selectedDates, dateStr, instance) {
          if (dateTo && dateTo._flatpickr) {
            dateTo._flatpickr.set('minDate', dateStr);
          }
        }
      });
    } catch (e) {
      console.warn('Erreur Flatpickr sur dateFrom:', e);
    }
  }

  if (dateTo) {
    try {
      flatpickr(dateTo, {
        dateFormat: "Y-m-d",
        locale: "de",
        allowInput: true,
        minDate: "today"
      });
    } catch (e) {
      console.warn('Erreur Flatpickr sur dateTo:', e);
    }
  }
}

function initContractForm() {
  const contractForm = document.getElementById('contractForm');
  const toggleContractBtn = document.getElementById('toggleContractForm');
  const contractFormContainer = document.getElementById('contractFormContainer');
  const cancelContractBtn = document.getElementById('cancelContractForm');
  const contractMessage = document.getElementById('contractMessage');
  const editContractModeIndicator = document.getElementById('editContractModeIndicator');

  loadUsersForContract();
  setupContractOfferSelect();
  setupUserSearch();
  initDatePickers();

  if (toggleContractBtn && contractFormContainer) {
    toggleContractBtn.addEventListener('click', function() {
      if (!contractFormContainer.classList.contains('active')) {
        contractFormContainer.classList.add('active');
        this.textContent = '✖ Vertrag schließen';
        loadOffersForContractSelect();
        loadUsersForContract();
        setTimeout(initDatePickers, 100);
      } else {
        contractFormContainer.classList.remove('active');
        this.textContent = '➕ Vertrag hinzufügen';
      }
    });
  }

  if (cancelContractBtn && contractFormContainer) {
    cancelContractBtn.addEventListener('click', function() {
      contractFormContainer.classList.remove('active');
      if (toggleContractBtn) {
        toggleContractBtn.textContent = '➕ Vertrag hinzufügen';
      }
      if (contractMessage) {
        contractMessage.textContent = '';
        contractMessage.className = 'message';
      }
      if (contractForm) {
        contractForm.reset();
        delete contractForm.dataset.editId;
      }
      if (editContractModeIndicator) {
        editContractModeIndicator.classList.remove('active');
      }
      document.getElementById('contractOfferInfo').style.display = 'none';
      document.getElementById('contractUserSelected').style.display = 'none';
      document.getElementById('contractUserId').value = '';
      document.getElementById('contractOfferId').value = '';
      setContractOfferSelection('', '', '', '', '', '');
    });
  }

  if (contractForm) {
    contractForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const editId = this.dataset.editId;
      const userId = document.getElementById('contractUserId').value;
      const offerId = document.getElementById('contractOfferId').value;
      const energyType = document.querySelector('input[name="contractEnergyType"]:checked');
      const dateFrom = document.getElementById('contractDateFrom').value;
      const dateTo = document.getElementById('contractDateTo').value;
      const msg = document.getElementById('contractMessage');

      if (!userId) {
        msg.textContent = 'Bitte wählen Sie einen Benutzer aus.';
        msg.className = 'message error';
        return;
      }

      if (!offerId) {
        msg.textContent = 'Bitte wählen Sie ein Angebot aus.';
        msg.className = 'message error';
        return;
      }

      if (!energyType) {
        msg.textContent = 'Bitte wählen Sie einen Energietyp.';
        msg.className = 'message error';
        return;
      }

      if (!dateFrom || !dateTo) {
        msg.textContent = 'Bitte geben Sie beide Daten ein.';
        msg.className = 'message error';
        return;
      }

      if (new Date(dateFrom) > new Date(dateTo)) {
        msg.textContent = 'Das Startdatum muss vor dem Enddatum liegen.';
        msg.className = 'message error';
        return;
      }

      const offerDoc = await db.collection('offers').doc(offerId).get();
      const offerData = offerDoc.exists ? offerDoc.data() : {};
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : {};

      const contractData = {
        userId: userId,
        userEmail: userId,
        userName: (userData.vorname || '') + ' ' + (userData.nachname || ''),
        offerId: offerId,
        companyName: offerData.companyName || 'Unbekannt',
        companyLogo: offerData.companyLogo || '',
        energyType: energyType.value,
        price: offerData.price || 'k.A.',
        duration: offerData.duration || 'k.A.',
        dateFrom: dateFrom,
        dateTo: dateTo,
        status: 'active',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      try {
        if (editId) {
          await db.collection('contracts').doc(editId).update(contractData);
          msg.textContent = '✅ Vertrag erfolgreich aktualisiert!';
          delete contractForm.dataset.editId;
          if (editContractModeIndicator) {
            editContractModeIndicator.classList.remove('active');
          }
        } else {
          contractData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
          await db.collection('contracts').add(contractData);
          msg.textContent = '✅ Vertrag erfolgreich erstellt!';
        }

        msg.className = 'message success';
        contractForm.reset();
        document.getElementById('contractOfferInfo').style.display = 'none';
        document.getElementById('contractUserSelected').style.display = 'none';
        document.getElementById('contractUserId').value = '';
        document.getElementById('contractOfferId').value = '';
        setContractOfferSelection('', '', '', '', '', '');

        loadContractsAdmin();

        setTimeout(() => {
          contractFormContainer.classList.remove('active');
          if (toggleContractBtn) toggleContractBtn.textContent = '➕ Vertrag hinzufügen';
          msg.textContent = '';
          msg.className = 'message';
        }, 1500);

      } catch (error) {
        console.error('❌ Fehler beim Speichern des Vertrags:', error);
        msg.textContent = '❌ Fehler: ' + error.message;
        msg.className = 'message error';
      }
    });
  }
}

async function loadContractsAdmin() {
  const container = document.getElementById('contractList');
  if (!container) return;

  try {
    const snapshot = await db.collection('contracts').orderBy('createdAt', 'desc').get();
    if (snapshot.empty) {
      container.innerHTML = '<p style="color:#6a7b91;">Keine Verträge vorhanden.</p>';
      return;
    }

    let html = '';
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const typeLabel = data.energyType === 'strom' ? '⚡ Strom' : '🔥 Gas';
      const statusLabel = data.status === 'active' ? '🟢 Aktiv' : '🔴 Beendet';

      html += `
        <div class="contract-item" data-id="${doc.id}">
          <div class="contract-info">
            <div class="contract-user">${data.userName || data.userEmail || 'Unbekannt'}</div>
            <div class="contract-details">
              ${data.companyName || 'Unbekannt'} - ${typeLabel}
              <span style="color:#6a7b91; margin-left:12px;">💰 ${data.price || 'k.A.'}</span>
              <span style="color:#6a7b91; margin-left:12px;">⏱ ${data.duration || 'k.A.'}</span>
            </div>
            <div class="contract-dates">
              📅 ${data.dateFrom || '?'} → ${data.dateTo || '?'}
              <span style="margin-left:12px; color:${data.status === 'active' ? '#54e50d' : '#ff6b6b'};">${statusLabel}</span>
            </div>
          </div>
          <div class="contract-actions">
            <button class="edit-btn" onclick="editContract('${doc.id}')">Bearbeiten</button>
            <button class="delete-btn" onclick="deleteContract('${doc.id}')">Löschen</button>
          </div>
        </div>
      `;
    }
    container.innerHTML = html;
  } catch (error) {
    console.error('❌ Fehler beim Laden der Verträge:', error);
    container.innerHTML = '<p style="color:#ff6b6b;">Fehler beim Laden.</p>';
  }
}

window.editContract = async function(id) {
  try {
    const doc = await db.collection('contracts').doc(id).get();
    if (doc.exists) {
      const data = doc.data();

      const toggleBtn = document.getElementById('toggleContractForm');
      const formContainer = document.getElementById('contractFormContainer');
      const editModeIndicator = document.getElementById('editContractModeIndicator');

      if (toggleBtn && formContainer) {
        formContainer.classList.add('active');
        toggleBtn.textContent = '✖ Vertrag schließen';
      }
      if (editModeIndicator) {
        editModeIndicator.classList.add('active');
      }

      const userSearch = document.getElementById('contractUserSearch');
      const userHidden = document.getElementById('contractUserId');
      const userSelected = document.getElementById('contractUserSelected');
      const userSelectedName = document.getElementById('contractUserSelectedName');

      if (userSearch) userSearch.value = data.userName || data.userEmail || '';
      if (userHidden) userHidden.value = data.userId || '';
      if (userSelected && userSelectedName) {
        userSelectedName.textContent = data.userName || data.userEmail || '';
        userSelected.style.display = 'block';
      }

      const radio = document.querySelector(`input[name="contractEnergyType"][value="${data.energyType}"]`);
      if (radio) radio.checked = true;

      setContractOfferSelection(
        data.offerId || '',
        data.companyName || '',
        data.companyLogo || '',
        data.price || '',
        data.duration || '',
        data.energyType || 'strom'
      );

      document.getElementById('contractDateFrom').value = data.dateFrom || '';
      document.getElementById('contractDateTo').value = data.dateTo || '';

      document.getElementById('contractMessage').textContent = '✏️ Vertrag wird bearbeitet...';
      document.getElementById('contractMessage').className = 'message';

      document.getElementById('contractForm').dataset.editId = id;

      setTimeout(initDatePickers, 100);
    }
  } catch (error) {
    console.error('Fehler beim Laden des Vertrags:', error);
    alert('Fehler beim Laden des Vertrags.');
  }
};

window.deleteContract = async function(id) {
  if (confirm('Möchten Sie diesen Vertrag wirklich löschen?')) {
    try {
      await db.collection('contracts').doc(id).delete();
      loadContractsAdmin();
      const msg = document.getElementById('contractMessage');
      if (msg) {
        msg.textContent = '✅ Vertrag gelöscht.';
        msg.className = 'message success';
        setTimeout(() => { msg.textContent = ''; msg.className = 'message'; }, 3000);
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Vertrags:', error);
      alert('Fehler beim Löschen des Vertrags.');
    }
  }
};

// =====================================================================
// ===== BLOC 9 : Effet de scroll sur le bandeau social ===============
// =====================================================================
function initSocialScroll() {
    const socialBar = document.querySelector('.social-top-bar');
    if (!socialBar) return;
    
    const threshold = 50;
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > threshold) {
            socialBar.classList.add('scrolled');
        } else {
            socialBar.classList.remove('scrolled');
        }
    });
}

// =====================================================================
// ===== INITIALISATION ================================================
// =====================================================================
document.addEventListener('DOMContentLoaded', function() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const protectedPages = ['dashboard.html', 'admin.html', 'stat.html', 'mein-portal.html', 'portail.html'];

  if (protectedPages.includes(currentPage)) {
    const isLoggedIn = localStorage.getItem('userEmail') !== null;
    if (!isLoggedIn && currentPage !== 'login.html') {
      window.location.href = 'login.html';
      return;
    }
  }
  

  initLoginPage();
  initAdminPage();
  initCompanyPage();
  initStatsPage();
  initMeinPortalPage();
  updateLoginButton();
  updateUserDisplay();
  updateDashboardMenu();
  initScrollHeader();
  initHamburger();
  initTawkTo();
  initSocialScroll();  // <- AJOUT DE LA FONCTION
});