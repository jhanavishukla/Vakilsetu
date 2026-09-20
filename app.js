/* ==========================================================================
   VAKILSETU CORE APPLICATION LOGIC & DATA ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // ==================== THEME SYSTEM ====================
  const themeToggles = document.querySelectorAll('.btn-theme-toggle');

  const updateToggleIcons = (theme) => {
    themeToggles.forEach(btn => {
      const sun = btn.querySelector('.icon-sun');
      const moon = btn.querySelector('.icon-moon');
      if (theme === 'light') {
        if (sun) sun.style.display = 'none';
        if (moon) moon.style.display = 'inline-block';
      } else {
        if (sun) sun.style.display = 'inline-block';
        if (moon) moon.style.display = 'none';
      }
    });
  };

  // Apply stored theme on load
  const currentTheme = localStorage.getItem('VAKILSETU_THEME') || 'dark';
  if (currentTheme === 'light') {
    document.documentElement.classList.add('light-theme');
    updateToggleIcons('light');
  } else {
    document.documentElement.classList.remove('light-theme');
    updateToggleIcons('dark');
  }

  themeToggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const isLight = document.documentElement.classList.toggle('light-theme');
      const newTheme = isLight ? 'light' : 'dark';
      localStorage.setItem('VAKILSETU_THEME', newTheme);
      updateToggleIcons(newTheme);
    });
  });

  // ==================== SPLASH SCREEN TIMING ====================
  const splashScreen = document.getElementById('splash-screen');
  if (splashScreen) {
    setTimeout(() => {
      splashScreen.classList.add('fade-out');
      setTimeout(() => {
        splashScreen.remove();
      }, 800);
    }, 2500); // 2.5s display time
  }

  // Dynamic API Base URL to allow client-side preview on other servers (e.g. Live Server on port 5500) while communicating with backend on port 3000
  // Set this to your deployed cloud backend URL in production (e.g. 'https://vakilsetu-backend.onrender.com')
  const PRODUCTION_BACKEND_URL = '';

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API_BASE = (isLocalhost && window.location.port !== '3000')
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : '';

  // ==================== SESSION PERSISTENCE HELPERS ====================
  function persistSession() {
    if (state.userType && state.userProfile) {
      localStorage.setItem('VAKILSETU_USER_TYPE', state.userType);
      localStorage.setItem('VAKILSETU_USER_ID', state.userProfile.id);
      localStorage.removeItem('VAKILSETU_USER_PROFILE');
    } else {
      localStorage.removeItem('VAKILSETU_USER_TYPE');
      localStorage.removeItem('VAKILSETU_USER_ID');
      localStorage.removeItem('VAKILSETU_USER_PROFILE');
    }
  }

  function restoreUserSession(role, user) {
    state.userType = role;
    state.userProfile = user;

    // Update UI Status Card in header
    const userRoleEl = document.querySelector('.user-role');
    const statusTextEl = document.querySelector('.status-text');
    const statusIndicator = document.querySelector('.status-indicator');

    userRoleEl.textContent = user.name;

    if (role === 'lawyer') {
      statusTextEl.textContent = user.status === 'Pending Verification'
        ? 'Pending Verification'
        : 'Bar Verified & Active';

      statusIndicator.className = 'status-indicator';
      statusIndicator.style.backgroundColor = user.status === 'Pending Verification'
        ? 'var(--text-muted)'
        : 'var(--accent-cyan)';
      statusIndicator.style.boxShadow = user.status === 'Pending Verification'
        ? 'none'
        : '0 0 8px var(--accent-cyan)';
    } else {
      statusTextEl.textContent = `${user.city} • Client`;
      statusIndicator.className = 'status-indicator active';
      statusIndicator.style.backgroundColor = 'var(--accent-indigo)';
    }

    // Update avatar circle in header status card
    const userStatusCard = document.getElementById('user-status');
    let avatarCircle = userStatusCard.querySelector('.avatar-header-circle');
    if (!avatarCircle) {
      avatarCircle = document.createElement('div');
      avatarCircle.className = 'avatar-header-circle';
      avatarCircle.style.width = '32px';
      avatarCircle.style.height = '32px';
      avatarCircle.style.borderRadius = '50%';
      avatarCircle.style.marginRight = '0';
      avatarCircle.style.overflow = 'hidden';
      avatarCircle.style.background = role === 'lawyer'
        ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))'
        : 'linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))';
      avatarCircle.style.display = 'flex';
      avatarCircle.style.alignItems = 'center';
      avatarCircle.style.justifyContent = 'center';
      avatarCircle.style.color = 'white';
      avatarCircle.style.fontSize = '10px';
      avatarCircle.style.fontWeight = 'bold';
      userStatusCard.insertBefore(avatarCircle, userStatusCard.firstChild);
    }

    const avatarSrc = role === 'lawyer' ? user.avatarBase64 : user.avatar;
    if (avatarSrc) {
      avatarCircle.innerHTML = `<img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover;">`;
    } else {
      avatarCircle.textContent = role === 'lawyer'
        ? user.avatarText
        : (user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CL');
    }

    // If restoring a lawyer and they are not in the local in-memory LAWYERS_DATABASE, let's prepend them
    if (role === 'lawyer') {
      const index = LAWYERS_DATABASE.findIndex(l => l.id === user.id);
      if (index === -1) {
        LAWYERS_DATABASE.unshift(user);
        renderLawyers();
      }
    }

    linkSwitchRole.style.display = 'inline-block';
    const _myAccLink = document.getElementById('link-my-account');
    if (_myAccLink) _myAccLink.style.display = 'inline-block';
    updateNavForUserRole();
    switchTab('workspace');
    onboardingOverlay.style.display = 'none';
    lucide.createIcons();
    checkDigiLockerLock();
  }

  // ==================== STATE MANAGEMENT ====================
  const state = {
    activeTab: 'analyzer',
    isCaseAnalyzed: false,
    analyzedCategory: null,
    analyzedData: null,
    selectedLawyer: null,
    isWorkspaceInitialized: false,
    userType: null, // 'client' or 'lawyer'
    userProfile: null,
    activeConsultation: null,
    workspaceData: {
      lawyer: null,
      caseTitle: '',
      caseCategory: '',
      pricing: { name: '', price: '', desc: '' },
      messages: [],
      documents: [],
      activeDocument: null,
      roadmapPhase: 1
    }
  };

  // ==================== AUTO LOGIN EXISTING ACCOUNT ====================
  // Called when a 409 Duplicate is returned during signup — silently logs in the existing account
  async function autoLoginExistingAccount(contact, preferredRole) {
    // Hide all onboarding steps and show a loading toast
    [onboardingStep3Client, onboardingStep3Lawyer, onboardingStep2, onboardingStep1].forEach(el => {
      if (el) el.style.display = 'none';
    });

    // Show a non-blocking toast instead of an alert
    const toast = document.createElement('div');
    toast.id = 'auto-login-toast';
    toast.style.cssText = `
      position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
      background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.15));
      border: 1px solid rgba(16,185,129,0.4); border-radius: 12px;
      padding: 14px 24px; color: var(--text-primary); font-size: 13px;
      font-family: var(--font-mono); backdrop-filter: blur(12px);
      z-index: 99999; display: flex; align-items: center; gap: 10px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    `;
    toast.innerHTML = `<span style="color:var(--accent-emerald);">✓</span> Account found — logging you in automatically...`;
    document.body.appendChild(toast);

    try {
      // Try preferred role first, then the other
      const rolesToTry = preferredRole === 'lawyer' ? ['lawyer', 'client'] : ['client', 'lawyer'];

      for (const role of rolesToTry) {
        const loginResponse = await fetch(`${API_BASE}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contact, role })
        });

        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          if (loginData.exists && loginData.user) {
            const user = loginData.user;
            // Update onboardingRole to the matched role
            onboardingRole = role;
            restoreUserSession(role, user);
            linkSwitchRole.style.display = 'inline-block';
            const myAccLnk = document.getElementById('link-my-account');
            if (myAccLnk) myAccLnk.style.display = 'inline-block';
            updateNavForUserRole();
            switchTab('workspace');
            onboardingOverlay.style.display = 'none';
            persistSession();
            lucide.createIcons();
            checkDigiLockerLock();

            // Update toast to success
            toast.innerHTML = `<span style="color:var(--accent-emerald);">✓</span> Welcome back, ${user.name}! Redirecting to your dashboard...`;
            setTimeout(() => toast.remove(), 3000);
            return;
          }
        }
      }

      // If still not found, just show step 1 login cleanly
      toast.innerHTML = `<span style="color:var(--accent-rose);">!</span> Could not find your account. Please log in manually.`;
      setTimeout(() => toast.remove(), 3000);
      onboardingStep1.style.display = 'flex';
      if (contact) contactInput.value = contact;

    } catch (err) {
      console.error('Auto-login error:', err);
      toast.innerHTML = `<span style="color:var(--accent-rose);">!</span> Connection error. Please try again.`;
      setTimeout(() => toast.remove(), 3000);
      onboardingStep1.style.display = 'flex';
    }
  }


  // ==================== ONBOARDING FLOW CONTROLLER ====================
  let onboardingRole = 'client'; // 'client' or 'lawyer'
  let onboardingContactType = 'phone'; // 'phone' or 'email'
  let onboardingContactVal = '';
  let otpTimerInterval = null;
  let clientAvatarBase64 = null;
  let lawyerAvatarBase64 = null;

  // Onboarding selectors
  const onboardingOverlay = document.getElementById('onboarding-overlay');
  const onboardingStep1 = document.getElementById('onboarding-step-1');
  const onboardingStep2 = document.getElementById('onboarding-step-2');
  const onboardingStep3Client = document.getElementById('onboarding-step-3-client');
  const onboardingStep3Lawyer = document.getElementById('onboarding-step-3-lawyer');
  const authForm = document.getElementById('onboarding-auth-form');
  const otpForm = document.getElementById('onboarding-otp-form');
  const clientProfileForm = document.getElementById('onboarding-client-profile-form');
  const lawyerProfileForm = document.getElementById('onboarding-lawyer-profile-form');
  const contactInput = document.getElementById('onboarding-contact-input');
  const otpTimerSeconds = document.getElementById('otp-timer-seconds');
  const btnResendOtp = document.getElementById('btn-resend-otp');
  const btnBackStep1 = document.getElementById('btn-back-to-step1');

  // Official Advocate Signup selectors
  const linkGoToAdvocateSignup = document.getElementById('link-go-to-advocate-signup');
  const btnBackSignupToStep1 = document.getElementById('btn-back-signup-to-step1');
  const onboardingStepAdvocateSignup = document.getElementById('onboarding-step-advocate-signup');
  const advocateSignupForm = document.getElementById('advocate-signup-form');
  const linkSwitchRole = document.getElementById('link-switch-role');
  const linkMyAccount = document.getElementById('link-my-account');

  // Avatar inputs
  const clientAvatarFile = document.getElementById('client-avatar-file');
  const clientAvatarPreview = document.getElementById('client-avatar-preview');
  const lawyerAvatarFile = document.getElementById('lawyer-avatar-file');
  const lawyerAvatarPreview = document.getElementById('lawyer-avatar-preview');

  // Toggle authentication fields (Email vs Phone)
  const authToggleBtns = document.querySelectorAll('.auth-toggle-btn');
  authToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      authToggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onboardingContactType = btn.getAttribute('data-type');
      if (onboardingContactType === 'phone') {
        contactInput.type = 'text';
        contactInput.placeholder = 'Enter your mobile number...';
      } else {
        contactInput.type = 'text';
        contactInput.placeholder = 'Enter your email address...';
      }
      contactInput.value = '';
    });
  });

  // Navigate back to Step 1 from Advocate Signup page
  btnBackSignupToStep1.addEventListener('click', () => {
    onboardingStepAdvocateSignup.style.display = 'none';
    onboardingStep1.style.display = 'flex';
  });

  // Switch Account / Log Out Handler
  linkSwitchRole.addEventListener('click', (e) => {
    e.preventDefault();

    // Reset state
    state.userType = null;
    state.userProfile = null;
    localStorage.removeItem("VAKILSETU_USER_ID");
    localStorage.removeItem("VAKILSETU_USER_TYPE");
    localStorage.removeItem("VAKILSETU_USER_PROFILE");

    // Reset status UI
    const userRoleEl = document.querySelector('.user-role');
    const statusTextEl = document.querySelector('.status-text');
    const statusIndicator = document.querySelector('.status-indicator');

    userRoleEl.textContent = 'Anonymous Client';
    statusTextEl.textContent = 'Encrypted Connection';
    statusIndicator.className = 'status-indicator active';
    statusIndicator.style.backgroundColor = 'var(--accent-cyan)';
    statusIndicator.style.boxShadow = '';

    // Remove custom header avatar circle if present
    const userStatusCard = document.getElementById('user-status');
    const avatarCircle = userStatusCard.querySelector('.avatar-header-circle');
    if (avatarCircle) {
      avatarCircle.remove();
    }

    linkSwitchRole.style.display = 'none';
    if (linkMyAccount) linkMyAccount.style.display = 'none';

    // Show step 1 of onboarding again
    onboardingStep1.style.display = 'flex';
    onboardingStep2.style.display = 'none';
    onboardingStep3Client.style.display = 'none';
    onboardingStep3Lawyer.style.display = 'none';
    onboardingStepAdvocateSignup.style.display = 'none';
    onboardingOverlay.style.display = 'flex';

    // Update navigation to default client view
    updateNavForUserRole();
    switchTab('analyzer');
  });

  // ==================== MY ACCOUNT MODAL ====================
  const myAccountModal = document.getElementById('my-account-modal');
  const btnCloseAccountModal = document.getElementById('btn-close-account-modal');
  const btnDeleteAccount = document.getElementById('btn-delete-account');

  if (linkMyAccount) {
    linkMyAccount.addEventListener('click', (e) => {
      e.preventDefault();
      if (!state.userProfile) return;

      // Populate modal
      const nameEl = document.getElementById('account-modal-name');
      const roleEl = document.getElementById('account-modal-role-badge');
      const avatarEl = document.getElementById('account-modal-avatar');
      const verificationEl = document.getElementById('account-modal-verification');
      const barCouncilEl = document.getElementById('account-modal-bar-council-id');

      nameEl.textContent = state.userProfile.name;
      roleEl.textContent = state.userType === 'lawyer' ? '⚖ Advocate Account' : '👤 Client Account';

      const avatarSrc = state.userType === 'lawyer' ? state.userProfile.avatarBase64 : state.userProfile.avatar;
      if (avatarSrc) {
        avatarEl.innerHTML = `<img src="${avatarSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      } else {
        const initials = state.userType === 'lawyer'
          ? (state.userProfile.avatarText || 'AV')
          : (state.userProfile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CL');
        avatarEl.style.color = 'white';
        avatarEl.style.fontSize = '18px';
        avatarEl.style.fontWeight = 'bold';
        avatarEl.textContent = initials;
      }

      if (state.userType === 'lawyer') {
        verificationEl.style.display = 'block';
        if (state.userProfile.barCouncilId) {
          barCouncilEl.textContent = `Bar Council ID: ${state.userProfile.barCouncilId}`;
        } else {
          barCouncilEl.textContent = 'No Bar Council ID submitted.';
        }
      } else {
        verificationEl.style.display = 'none';
      }

      myAccountModal.style.display = 'flex';
      lucide.createIcons();
    });
  }

  if (btnCloseAccountModal) {
    btnCloseAccountModal.addEventListener('click', () => {
      myAccountModal.style.display = 'none';
    });
  }

  // Close modal on backdrop click
  if (myAccountModal) {
    myAccountModal.addEventListener('click', (e) => {
      if (e.target === myAccountModal) myAccountModal.style.display = 'none';
    });
  }

  // Delete account
  if (btnDeleteAccount) {
    btnDeleteAccount.addEventListener('click', async () => {
      if (!state.userProfile || !state.userType) return;

      const confirmDelete = confirm(`Are you sure you want to permanently delete your account as "${state.userProfile.name}"? This cannot be undone.`);
      if (!confirmDelete) return;

      try {
        const endpoint = state.userType === 'lawyer'
          ? `${API_BASE}/api/lawyers/${state.userProfile.id}`
          : `${API_BASE}/api/clients/${state.userProfile.id}`;

        const res = await fetch(endpoint, { method: 'DELETE' });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Deletion failed.');
        }

        // Remove from local DB if lawyer
        if (state.userType === 'lawyer') {
          const idx = LAWYERS_DATABASE.findIndex(l => l.id === state.userProfile.id);
          if (idx > -1) LAWYERS_DATABASE.splice(idx, 1);
          renderLawyers();
        }

        myAccountModal.style.display = 'none';
        alert('Your account has been deleted successfully.');

        // Log out
        linkSwitchRole.click();
      } catch (err) {
        console.error('Delete account error:', err);
        alert(`Failed to delete account: ${err.message}`);
      }
    });
  }


  // Step 1: Submit Contact info
  authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    onboardingContactVal = contactInput.value.trim();
    onboardingRole = document.querySelector('input[name="onboarding-role"]:checked').value;

    // Update OTP text
    const hint = document.getElementById('otp-hint-text');
    hint.textContent = `We sent a 4-digit code to your ${onboardingContactType === 'phone' ? 'phone' : 'email'} at ${onboardingContactVal}. (Use code 1234 to proceed)`;

    // Swap steps
    onboardingStep1.style.display = 'none';
    onboardingStep2.style.display = 'flex';

    // Start countdown timer
    startOtpCountdown();

    // Clear and focus first OTP box
    const otpBoxes = document.querySelectorAll('.otp-input-box');
    otpBoxes.forEach(box => { box.value = ''; });
    otpBoxes[0].focus();
    lucide.createIcons();
  });

  // Back button in Step 2
  btnBackStep1.addEventListener('click', () => {
    onboardingStep2.style.display = 'none';
    onboardingStep1.style.display = 'flex';
    clearInterval(otpTimerInterval);
  });

  // OTP Countdown timer
  function startOtpCountdown() {
    let timeLeft = 30;
    otpTimerSeconds.textContent = timeLeft;
    btnResendOtp.disabled = true;
    clearInterval(otpTimerInterval);

    otpTimerInterval = setInterval(() => {
      timeLeft--;
      otpTimerSeconds.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(otpTimerInterval);
        btnResendOtp.disabled = false;
      }
    }, 1000);
  }

  // Resend OTP button
  btnResendOtp.addEventListener('click', () => {
    startOtpCountdown();
    alert('Mock OTP Code resent successfully! Type "1234" to proceed.');
  });

  // OTP inputs auto-tabbing
  const otpBoxes = document.querySelectorAll('.otp-input-box');
  otpBoxes.forEach((box, index) => {
    // Keydown for backspace deletion support
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && index > 0) {
        otpBoxes[index - 1].value = '';
        otpBoxes[index - 1].focus();
      }
    });

    // Input event for character entry (fully compatible with mobile keyboards)
    box.addEventListener('input', (e) => {
      const val = box.value;
      if (val && index < otpBoxes.length - 1) {
        otpBoxes[index + 1].focus();
      }
    });
  });

  // Handle direct clipboard paste in the first OTP box
  if (otpBoxes[0]) {
    otpBoxes[0].addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text');
      if (pasteData && pasteData.length >= 4) {
        otpBoxes.forEach((box, idx) => {
          if (pasteData[idx]) {
            box.value = pasteData[idx];
          }
        });
        otpBoxes[otpBoxes.length - 1].focus();
      }
    });
  }

  // Step 2: Submit OTP verification
  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let enteredCode = '';
    otpBoxes.forEach(box => { enteredCode += box.value; });

    // Validate (accept any code for prototype, default 1234)
    clearInterval(otpTimerInterval);
    onboardingStep2.style.display = 'none';

    try {
      // Check the database via login API
      const loginResponse = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: onboardingContactVal,
          role: onboardingRole
        })
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();

        if (loginData.exists) {
          const user = loginData.user;

          if (!user.isProfileCompleted) {
            // Profile is not complete (legacy accounts or stub records)
            onboardingOverlay.style.display = 'flex';
            onboardingStep1.style.display = 'none';
            if (onboardingRole === 'lawyer') {
              onboardingStep3Lawyer.style.display = 'flex';
            } else {
              onboardingStep3Client.style.display = 'flex';
            }
            return;
          }

          state.userType = onboardingRole;
          state.userProfile = user;

          // Update UI Status Card in header
          const userRoleEl = document.querySelector('.user-role');
          const statusTextEl = document.querySelector('.status-text');
          const statusIndicator = document.querySelector('.status-indicator');

          userRoleEl.textContent = user.name;

          if (onboardingRole === 'lawyer') {
            statusTextEl.textContent = user.status === 'Pending Verification'
              ? 'Pending Verification'
              : 'Bar Verified & Active';

            statusIndicator.className = 'status-indicator';
            statusIndicator.style.backgroundColor = user.status === 'Pending Verification'
              ? 'var(--text-muted)'
              : 'var(--accent-cyan)';
            statusIndicator.style.boxShadow = user.status === 'Pending Verification'
              ? 'none'
              : '0 0 8px var(--accent-cyan)';
          } else {
            statusTextEl.textContent = `${user.city} • Client`;
            statusIndicator.className = 'status-indicator active';
            statusIndicator.style.backgroundColor = 'var(--accent-indigo)';
          }

          // Update avatar circle in header status card
          const userStatusCard = document.getElementById('user-status');
          let avatarCircle = userStatusCard.querySelector('.avatar-header-circle');
          if (!avatarCircle) {
            avatarCircle = document.createElement('div');
            avatarCircle.className = 'avatar-header-circle';
            avatarCircle.style.width = '32px';
            avatarCircle.style.height = '32px';
            avatarCircle.style.borderRadius = '50%';
            avatarCircle.style.marginRight = '0';
            avatarCircle.style.overflow = 'hidden';
            avatarCircle.style.background = onboardingRole === 'lawyer'
              ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))'
              : 'linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))';
            avatarCircle.style.display = 'flex';
            avatarCircle.style.alignItems = 'center';
            avatarCircle.style.justifyContent = 'center';
            avatarCircle.style.color = 'white';
            avatarCircle.style.fontSize = '10px';
            avatarCircle.style.fontWeight = 'bold';
            userStatusCard.insertBefore(avatarCircle, userStatusCard.firstChild);
          }

          const avatarSrc = onboardingRole === 'lawyer' ? user.avatarBase64 : user.avatar;
          if (avatarSrc) {
            avatarCircle.innerHTML = `<img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover;">`;
          } else {
            avatarCircle.textContent = onboardingRole === 'lawyer'
              ? user.avatarText
              : (user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CL');
          }

          // If logging in as lawyer and they are not in the local in-memory LAWYERS_DATABASE, let's prepend them
          if (onboardingRole === 'lawyer') {
            const index = LAWYERS_DATABASE.findIndex(l => l.id === user.id);
            if (index === -1) {
              LAWYERS_DATABASE.unshift(user);
              renderLawyers();
            }
          }

          linkSwitchRole.style.display = 'inline-block';
          if (linkMyAccount) linkMyAccount.style.display = 'inline-block';
          updateNavForUserRole();
          switchTab('workspace');
          onboardingOverlay.style.display = 'none';
          persistSession();
          lucide.createIcons();
          checkDigiLockerLock();
          return;
        }
      }
    } catch (err) {
      console.error('Error during login check:', err);
    }

    // Fallback: Check local memory LAWYERS_DATABASE if database check failed (for seeded data in UI)
    const existingLawyer = onboardingRole === 'lawyer' && onboardingContactVal
      ? LAWYERS_DATABASE.find(lawyer =>
        (lawyer.contactInfo && lawyer.contactInfo.toLowerCase() === onboardingContactVal.toLowerCase()) ||
        (lawyer.barNumber && lawyer.barNumber.toLowerCase() === onboardingContactVal.toLowerCase())
      )
      : null;

    if (existingLawyer) {
      state.userType = 'lawyer';
      state.userProfile = existingLawyer;

      // Update UI
      const userRoleEl = document.querySelector('.user-role');
      const statusTextEl = document.querySelector('.status-text');
      const statusIndicator = document.querySelector('.status-indicator');

      userRoleEl.textContent = existingLawyer.name;
      statusTextEl.textContent = existingLawyer.status === 'Pending Verification'
        ? 'Pending Verification'
        : 'Bar Verified & Active';

      statusIndicator.className = 'status-indicator';
      statusIndicator.style.backgroundColor = existingLawyer.status === 'Pending Verification'
        ? 'var(--text-muted)'
        : 'var(--accent-cyan)';
      statusIndicator.style.boxShadow = existingLawyer.status === 'Pending Verification'
        ? 'none'
        : '0 0 8px var(--accent-cyan)';

      // Update avatar
      const userStatusCard = document.getElementById('user-status');
      let avatarCircle = userStatusCard.querySelector('.avatar-header-circle');
      if (!avatarCircle) {
        avatarCircle = document.createElement('div');
        avatarCircle.className = 'avatar-header-circle';
        avatarCircle.style.width = '32px';
        avatarCircle.style.height = '32px';
        avatarCircle.style.borderRadius = '50%';
        avatarCircle.style.marginRight = '0';
        avatarCircle.style.overflow = 'hidden';
        avatarCircle.style.background = 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))';
        avatarCircle.style.display = 'flex';
        avatarCircle.style.alignItems = 'center';
        avatarCircle.style.justifyContent = 'center';
        avatarCircle.style.color = 'white';
        avatarCircle.style.fontSize = '10px';
        avatarCircle.style.fontWeight = 'bold';
        userStatusCard.insertBefore(avatarCircle, userStatusCard.firstChild);
      }
      avatarCircle.textContent = existingLawyer.avatarText;

      linkSwitchRole.style.display = 'inline-block';
      updateNavForUserRole();
      switchTab('workspace');
      onboardingOverlay.style.display = 'none';
      persistSession();
      checkDigiLockerLock();
    } else {
      // Route to appropriate profile builder
      if (onboardingRole === 'client') {
        onboardingStep3Client.style.display = 'flex';
      } else {
        onboardingStep3Lawyer.style.display = 'flex';
      }
    }
    lucide.createIcons();
  });

  // Image Upload FileReaders
  clientAvatarFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        clientAvatarBase64 = event.target.result;
        clientAvatarPreview.innerHTML = `<img src="${clientAvatarBase64}" alt="Client Avatar" style="width: 100%; height: 100%; object-fit: cover;">`;
        clientAvatarPreview.classList.add('loaded');
      };
      reader.readAsDataURL(file);
    }
  });

  lawyerAvatarFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        lawyerAvatarBase64 = event.target.result;
        lawyerAvatarPreview.innerHTML = `<img src="${lawyerAvatarBase64}" alt="Lawyer Avatar" style="width: 100%; height: 100%; object-fit: cover;">`;
        lawyerAvatarPreview.classList.add('loaded');
      };
      reader.readAsDataURL(file);
    }
  });

  // Step 3A: Submit Client Profile
  clientProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('client-name').value.trim();
    const city = document.getElementById('client-city').value.trim();
    const interestVal = document.getElementById('client-interest').value;
    const password = document.getElementById('client-password') ? document.getElementById('client-password').value : null;

    try {
      const response = await fetch(`${API_BASE}/api/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          city: city,
          contact: onboardingContactVal,
          avatar: clientAvatarBase64,
          interest: interestVal,
          password: password || null
        })
      });

      if (!response.ok) {
        if (response.status === 409) {
          // Account already exists — auto login and redirect to dashboard
          await autoLoginExistingAccount(onboardingContactVal, 'client');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register client profile');
      }

      const result = await response.json();
      const savedClient = result.client;

      state.userType = 'client';
      state.userProfile = savedClient;

      // Update Client Status UI in header
      const userRoleEl = document.querySelector('.user-role');
      const statusTextEl = document.querySelector('.status-text');
      const statusIndicator = document.querySelector('.status-indicator');

      userRoleEl.textContent = savedClient.name;
      statusTextEl.textContent = `${savedClient.city} • Client`;
      statusIndicator.className = 'status-indicator active';
      statusIndicator.style.backgroundColor = 'var(--accent-indigo)';

      // Update avatar circle in header status card
      const userStatusCard = document.getElementById('user-status');
      let avatarCircle = userStatusCard.querySelector('.avatar-header-circle');
      if (!avatarCircle) {
        avatarCircle = document.createElement('div');
        avatarCircle.className = 'avatar-header-circle';
        avatarCircle.style.width = '32px';
        avatarCircle.style.height = '32px';
        avatarCircle.style.borderRadius = '50%';
        avatarCircle.style.marginRight = '0';
        avatarCircle.style.overflow = 'hidden';
        avatarCircle.style.background = 'linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))';
        avatarCircle.style.display = 'flex';
        avatarCircle.style.alignItems = 'center';
        avatarCircle.style.justifyContent = 'center';
        avatarCircle.style.color = 'white';
        avatarCircle.style.fontSize = '10px';
        avatarCircle.style.fontWeight = 'bold';

        userStatusCard.insertBefore(avatarCircle, userStatusCard.firstChild);
      }

      if (savedClient.avatar) {
        avatarCircle.innerHTML = `<img src="${savedClient.avatar}" style="width:100%; height:100%; object-fit:cover;">`;
      } else {
        const initials = savedClient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        avatarCircle.textContent = initials || 'CL';
      }

      // Dynamic case analyzer autofill city/interest
      filterSpecialty.value = savedClient.interest;

      // Update navigation tabs based on role
      updateNavForUserRole();

      // Show switch account option
      linkSwitchRole.style.display = 'inline-block';

      // Hide onboarding overlay
      onboardingOverlay.style.display = 'none';
      linkSwitchRole.style.display = 'inline-block';
      if (linkMyAccount) linkMyAccount.style.display = 'inline-block';
      persistSession();
    } catch (err) {
      console.warn('Backend client registration failed, falling back to local session:', err);

      const savedClient = {
        id: `client-${Date.now()}`,
        name: name,
        city: city,
        contact: onboardingContactVal,
        avatar: clientAvatarBase64,
        interest: interestVal
      };

      state.userType = 'client';
      state.userProfile = savedClient;

      // Update Client Status UI in header
      const userRoleEl = document.querySelector('.user-role');
      const statusTextEl = document.querySelector('.status-text');
      const statusIndicator = document.querySelector('.status-indicator');

      userRoleEl.textContent = savedClient.name;
      statusTextEl.textContent = `${savedClient.city} • Client`;
      statusIndicator.className = 'status-indicator active';
      statusIndicator.style.backgroundColor = 'var(--accent-indigo)';

      // Update avatar circle in header status card
      const userStatusCard = document.getElementById('user-status');
      let avatarCircle = userStatusCard.querySelector('.avatar-header-circle');
      if (!avatarCircle) {
        avatarCircle = document.createElement('div');
        avatarCircle.className = 'avatar-header-circle';
        avatarCircle.style.width = '32px';
        avatarCircle.style.height = '32px';
        avatarCircle.style.borderRadius = '50%';
        avatarCircle.style.marginRight = '0';
        avatarCircle.style.overflow = 'hidden';
        avatarCircle.style.background = 'linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))';
        avatarCircle.style.display = 'flex';
        avatarCircle.style.alignItems = 'center';
        avatarCircle.style.justifyContent = 'center';
        avatarCircle.style.color = 'white';
        avatarCircle.style.fontSize = '10px';
        avatarCircle.style.fontWeight = 'bold';

        userStatusCard.insertBefore(avatarCircle, userStatusCard.firstChild);
      }

      if (savedClient.avatar) {
        avatarCircle.innerHTML = `<img src="${savedClient.avatar}" style="width:100%; height:100%; object-fit:cover;">`;
      } else {
        const initials = savedClient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        avatarCircle.textContent = initials || 'CL';
      }

      // Dynamic case analyzer autofill city/interest
      filterSpecialty.value = savedClient.interest;

      // Update navigation tabs based on role
      updateNavForUserRole();

      // Show switch account option
      linkSwitchRole.style.display = 'inline-block';

      // Hide onboarding overlay
      onboardingOverlay.style.display = 'none';
      linkSwitchRole.style.display = 'inline-block';
      if (linkMyAccount) linkMyAccount.style.display = 'inline-block';
      persistSession();
    }
  });

  // Step 3B: Submit Lawyer Profile
  lawyerProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('lawyer-name').value.trim();
    const gender = document.getElementById('lawyer-gender').value;
    const city = document.getElementById('lawyer-city').value.trim();
    const position = document.getElementById('lawyer-position').value;
    const specialty = document.getElementById('lawyer-specialty-type').value;
    const exp = document.getElementById('lawyer-exp').value;
    const fought = parseInt(document.getElementById('lawyer-fought').value);
    const ongoing = parseInt(document.getElementById('lawyer-ongoing').value);
    const fees = document.getElementById('lawyer-fees').value.trim();
    const contactInfo = document.getElementById('lawyer-contact-info').value.trim();
    const barCouncilId = document.getElementById('signup-bar-council-id') ? document.getElementById('signup-bar-council-id').value.trim() : null;
    const password = document.getElementById('signup-lawyer-password') ? document.getElementById('signup-lawyer-password').value : null;

    try {
      const response = await fetch(`${API_BASE}/api/lawyers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          gender,
          city,
          position,
          specialty,
          exp,
          fought,
          ongoing,
          fees,
          contactInfo,
          avatarBase64: lawyerAvatarBase64,
          barCouncilId: barCouncilId || null,
          password: password || null
        })
      });

      if (!response.ok) {
        if (response.status === 409) {
          // Account already exists — auto login and redirect to dashboard
          await autoLoginExistingAccount(contactInfo, 'lawyer');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register advocate profile');
      }

      const result = await response.json();
      const savedLawyer = result.lawyer;

      // Prepend to lawyers array
      LAWYERS_DATABASE.unshift(savedLawyer);

      state.userType = 'lawyer';
      state.userProfile = savedLawyer;

      // Update Status UI in header
      const userRoleEl = document.querySelector('.user-role');
      const statusTextEl = document.querySelector('.status-text');
      const statusIndicator = document.querySelector('.status-indicator');

      userRoleEl.textContent = savedLawyer.name;
      statusTextEl.textContent = `${city} • Advocate`;
      statusIndicator.className = 'status-indicator active';
      statusIndicator.style.backgroundColor = 'var(--accent-cyan)';

      // Update avatar circle in header status card
      const userStatusCard = document.getElementById('user-status');
      let avatarCircle = userStatusCard.querySelector('.avatar-header-circle');
      if (!avatarCircle) {
        avatarCircle = document.createElement('div');
        avatarCircle.className = 'avatar-header-circle';
        avatarCircle.style.width = '32px';
        avatarCircle.style.height = '32px';
        avatarCircle.style.borderRadius = '50%';
        avatarCircle.style.marginRight = '0';
        avatarCircle.style.overflow = 'hidden';
        avatarCircle.style.background = 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))';
        avatarCircle.style.display = 'flex';
        avatarCircle.style.alignItems = 'center';
        avatarCircle.style.justifyContent = 'center';
        avatarCircle.style.color = 'white';
        avatarCircle.style.fontSize = '10px';
        avatarCircle.style.fontWeight = 'bold';

        userStatusCard.insertBefore(avatarCircle, userStatusCard.firstChild);
      }

      if (savedLawyer.avatarBase64) {
        avatarCircle.innerHTML = `<img src="${savedLawyer.avatarBase64}" style="width:100%; height:100%; object-fit:cover;">`;
      } else {
        avatarCircle.textContent = savedLawyer.avatarText;
      }

      // Update navigation tabs visibility based on role
      updateNavForUserRole();

      // Show switch account option
      linkSwitchRole.style.display = 'inline-block';

      // Close overlay
      onboardingOverlay.style.display = 'none';

      // Route to Case Workspace caseload page
      switchTab('workspace');
      linkSwitchRole.style.display = 'inline-block';
      if (linkMyAccount) linkMyAccount.style.display = 'inline-block';
      persistSession();
      checkDigiLockerLock();
    } catch (err) {
      console.warn('Backend lawyer registration failed, falling back to local session:', err);

      const barNumber = `BAR #${Math.floor(100000 + Math.random() * 900000)}`;

      const savedLawyer = {
        id: name.toLowerCase().replace(/[^a-z]/g, '-'),
        name: name,
        gender: gender,
        specialty: specialty,
        specialtyLabel: document.querySelector(`#lawyer-specialty-type option[value="${specialty}"]`).textContent,
        avatarText: name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
        avatarBase64: lawyerAvatarBase64,
        rating: '5.0',
        casesHandled: fought,
        ongoingCases: ongoing,
        bio: `Verified Advocate practicing in ${position} of ${city}. Dedicated representing clients in ${specialty} matters with upfront flat-fee options.`,
        barNumber: barNumber,
        contactInfo: contactInfo,
        packages: [
          { name: 'Initial Brief Consultation', price: '₹1,000', desc: 'Up to 45 min consultation online or offline.' },
          { name: 'Standard Case Representation', price: fees, desc: 'General counsel and document preparation.' }
        ],
        verified_cases: [
          { case_type: `Verdict in ${position} Matter`, year: 2024, court_level: position, role: "Petitioner's Counsel" },
          { case_type: `Dispute Resolution under State Codes`, year: 2023, court_level: position, role: "Respondent's Counsel" },
          { case_type: `Compliance Review & Arbitration`, year: 2022, court_level: "Tribunal", role: "Petitioner's Counsel" }
        ]
      };

      // Prepend to memory
      LAWYERS_DATABASE.unshift(savedLawyer);

      state.userType = 'lawyer';
      state.userProfile = savedLawyer;

      // Update Status UI in header
      const userRoleEl = document.querySelector('.user-role');
      const statusTextEl = document.querySelector('.status-text');
      const statusIndicator = document.querySelector('.status-indicator');

      userRoleEl.textContent = name;
      statusTextEl.textContent = `${city} • Advocate`;
      statusIndicator.className = 'status-indicator active';
      statusIndicator.style.backgroundColor = 'var(--accent-cyan)';

      // Update avatar circle in header status card
      const userStatusCard = document.getElementById('user-status');
      let avatarCircle = userStatusCard.querySelector('.avatar-header-circle');
      if (!avatarCircle) {
        avatarCircle = document.createElement('div');
        avatarCircle.className = 'avatar-header-circle';
        avatarCircle.style.width = '32px';
        avatarCircle.style.height = '32px';
        avatarCircle.style.borderRadius = '50%';
        avatarCircle.style.marginRight = '0';
        avatarCircle.style.overflow = 'hidden';
        avatarCircle.style.background = 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))';
        avatarCircle.style.display = 'flex';
        avatarCircle.style.alignItems = 'center';
        avatarCircle.style.justifyContent = 'center';
        avatarCircle.style.color = 'white';
        avatarCircle.style.fontSize = '10px';
        avatarCircle.style.fontWeight = 'bold';

        userStatusCard.insertBefore(avatarCircle, userStatusCard.firstChild);
      }

      if (savedLawyer.avatarBase64) {
        avatarCircle.innerHTML = `<img src="${savedLawyer.avatarBase64}" style="width:100%; height:100%; object-fit:cover;">`;
      } else {
        avatarCircle.textContent = savedLawyer.avatarText;
      }

      // Update navigation tabs visibility based on role
      updateNavForUserRole();

      // Show switch account option
      linkSwitchRole.style.display = 'inline-block';

      // Close overlay
      onboardingOverlay.style.display = 'none';

      // Route to Case Workspace caseload page
      switchTab('workspace');
      linkSwitchRole.style.display = 'inline-block';
      if (linkMyAccount) linkMyAccount.style.display = 'inline-block';
      persistSession();
      checkDigiLockerLock();
    }
  });

  // ==================== MOCK DATABASES ====================
  let LAWYERS_DATABASE = [
    {
      id: 'neha-sharma',
      name: 'Neha Sharma, Esq.',
      specialty: 'tenancy',
      specialtyLabel: 'Tenancy & Housing Law',
      avatarText: 'NS',
      rating: '4.9',
      casesHandled: 42,
      ongoingCases: 4,
      bio: 'Former RERA Counsel. Dedicated to representing tenants against predatory landlords, security deposit withholding, and illegal lockouts.',
      barNumber: 'MAH/123/2012',
      contactInfo: 'sarah@lawyer.com',
      packages: [
        { name: 'Demand Letter & Review', price: '₹1,500', desc: 'Drafting formal notice to landlord and reviewing response.' },
        { name: 'District Court Prep', price: '₹4,500', desc: 'Full evidence compilation, witness sheets, and courtroom rehearsal.' },
        { name: 'Full Litigation Retainer', price: '₹18,000', desc: 'Comprehensive court representation and mediation filings.' }
      ],
      verified_cases: [
        { case_type: "Security Deposit Recovery Claim", year: 2024, court_level: "District Court", role: "Petitioner's Counsel" },
        { case_type: "Illegal Eviction Notice Defense", year: 2023, court_level: "District Court", role: "Respondent's Counsel" },
        { case_type: "Rent Control Compliance Audit", year: 2023, court_level: "Tribunal", role: "Respondent's Counsel" },
        { case_type: "Habitability Failure & Repair Suit", year: 2022, court_level: "District Court", role: "Petitioner's Counsel" }
      ]
    },
    {
      id: 'rajesh-kumar',
      name: 'Rajesh Kumar',
      specialty: 'employment',
      specialtyLabel: 'Employment & Labor Law',
      avatarText: 'RK',
      rating: '4.8',
      casesHandled: 67,
      ongoingCases: 6,
      bio: 'Fierce advocate for freelance designers, contractors, and employees facing unpaid wages, wage theft, misclassification, and overtime violations.',
      barNumber: 'DEL/456/2015',
      contactInfo: 'marcus@lawyer.com',
      packages: [
        { name: 'Freelancer Invoice Recovery', price: '₹2,500', desc: 'Official breach of contract letter and settlement negotiations.' },
        { name: 'Labor Board Filing Support', price: '₹6,000', desc: 'Drafting Labour Court claims and evidence audit.' },
        { name: 'Employment Suit Representation', price: 'Contingency', desc: 'No upfront fee. 30% of recovered settlement.' }
      ],
      verified_cases: [
        { case_type: "Freelance Unpaid Invoice Suit", year: 2024, court_level: "District Court", role: "Petitioner's Counsel" },
        { case_type: "Employee Wage & Overtime Misclassification", year: 2023, court_level: "Tribunal", role: "Petitioner's Counsel" },
        { case_type: "Covenant Not to Compete Invalidation", year: 2023, court_level: "High Court", role: "Petitioner's Counsel" },
        { case_type: "Severance Package Discrepancy Dispute", year: 2022, court_level: "District Court", role: "Respondent's Counsel" }
      ]
    },
    {
      id: 'priya-desai',
      name: 'Priya Desai',
      specialty: 'contract',
      specialtyLabel: 'Contracts & Freelance',
      avatarText: 'PD',
      rating: '4.9',
      casesHandled: 84,
      ongoingCases: 8,
      bio: 'Specializes in tech freelance agreements, IP transfers, non-compete clauses, and drafting robust service agreements to prevent litigation.',
      barNumber: 'GUJ/789/2018',
      contactInfo: 'elena@lawyer.com',
      packages: [
        { name: 'Contract Revision Audit', price: '₹2,000', desc: 'Line-by-line contract review and markup with redlines.' },
        { name: 'Template Suite Bundle', price: '₹4,000', desc: '3 customized client contract templates for your business.' },
        { name: 'Custom Agreement Drafting', price: '₹7,500', desc: 'Full custom contract drafting tailored to your specific project.' }
      ],
      verified_cases: [
        { case_type: "SaaS IP Assignment Breach", year: 2024, court_level: "High Court", role: "Respondent's Counsel" },
        { case_type: "NDA Violation Enforcement Claim", year: 2023, court_level: "District Court", role: "Petitioner's Counsel" },
        { case_type: "Contractor Service Default Arbitration", year: 2023, court_level: "Tribunal", role: "Respondent's Counsel" }
      ]
    },
    {
      id: 'amit-patel',
      name: 'Amit Patel',
      specialty: 'consumer',
      specialtyLabel: 'Consumer Protection',
      avatarText: 'AP',
      rating: '4.7',
      casesHandled: 53,
      ongoingCases: 5,
      bio: 'Helping buyers challenge dishonest dealerships, defective appliances (lemon laws), hidden billing subscriptions, and credit reporting errors.',
      barNumber: 'KAR/234/2014',
      contactInfo: 'david@lawyer.com',
      packages: [
        { name: 'Dealer Demand Notice', price: '₹2,200', desc: 'Official letter detailing Lemon Law codes and replacement demand.' },
        { name: 'Consumer Forum Filing Pack', price: '₹5,000', desc: 'Drafting files and evidence binders for consumer arbitration boards.' },
        { name: 'Court Action Retainer', price: '₹12,000', desc: 'Filing state civil action against manufacturer or dealer.' }
      ],
      verified_cases: [
        { case_type: "Used Car Dealership Odometer Fraud", year: 2024, court_level: "District Court", role: "Petitioner's Counsel" },
        { case_type: "Unfair Subscription Billing Class Action", year: 2023, court_level: "High Court", role: "Petitioner's Counsel" },
        { case_type: "Appliances Lemon Law Compensation Claim", year: 2023, court_level: "Tribunal", role: "Petitioner's Counsel" },
        { case_type: "Credit Bureau Reporting Error Settlement", year: 2022, court_level: "District Court", role: "Petitioner's Counsel" }
      ]
    },
    {
      id: 'samira-patel',
      name: 'Samira Patel',
      specialty: 'tenancy',
      specialtyLabel: 'Tenancy & Housing Law',
      avatarText: 'SP',
      rating: '4.9',
      casesHandled: 31,
      ongoingCases: 3,
      bio: 'Passionate about housing access. Specializes in habitability issues (mold, water leaks), retaliatory rent hikes, and local rent control disputes.',
      barNumber: 'MAH/567/2016',
      contactInfo: 'samira@lawyer.com',
      packages: [
        { name: 'Notice of Violation Draft', price: '₹1,800', desc: 'Official notice demanding repairs with code inspector cites.' },
        { name: 'Mediation Representation', price: '₹5,000', desc: 'Preparation and advocacy at voluntary mediation boards.' },
        { name: 'Rent Escrow Filing Support', price: '₹8,000', desc: 'Filing to deposit rent with court until repairs are finished.' }
      ],
      verified_cases: [
        { case_type: "Illegal Lockout & Security Deposit Refund", year: 2024, court_level: "District Court", role: "Petitioner's Counsel" },
        { case_type: "Retaliatory Rent Increase Appeal", year: 2023, court_level: "Tribunal", role: "Petitioner's Counsel" },
        { case_type: "Water Intrusion & Black Mold Liability", year: 2022, court_level: "District Court", role: "Petitioner's Counsel" }
      ]
    },
    {
      id: 'vikram-singh',
      name: 'Vikram Singh, Esq.',
      specialty: 'criminal',
      specialtyLabel: 'Criminal Defense',
      avatarText: 'VS',
      rating: '4.8',
      casesHandled: 92,
      ongoingCases: 9,
      bio: 'Providing aggressive representation for criminal defense. Specialized in theft, traffic violations, misdemeanors, and civil rights disputes.',
      barNumber: 'UP/890/2010',
      contactInfo: 'robert@lawyer.com',
      packages: [
        { name: 'Arrest & Bail consultation', price: '₹3,000', desc: 'Urgent consultation on legal rights and bail structure.' },
        { name: 'Trial Defense Retainer', price: '₹25,000', desc: 'Court appearance defense and discovery audit.' }
      ],
      verified_cases: [
        { case_type: "Misdemeanor Theft Charge Dismissal", year: 2024, court_level: "District Court", role: "Respondent's Counsel" },
        { case_type: "First-Offense DUI Citation Appeal", year: 2023, court_level: "District Court", role: "Respondent's Counsel" },
        { case_type: "Search Warrant Evidence Suppression Hearing", year: 2023, court_level: "High Court", role: "Respondent's Counsel" },
        { case_type: "Civil Rights Arrest Warrant Invalidation", year: 2022, court_level: "High Court", role: "Respondent's Counsel" }
      ]
    },
    {
      id: 'priya-sharma',
      name: 'Priya Sharma',
      specialty: 'family',
      specialtyLabel: 'Family Law & Divorce',
      avatarText: 'PS',
      rating: '4.9',
      casesHandled: 58,
      ongoingCases: 5,
      bio: 'Compassionate family law attorney. Focused on mutual consent divorce, child custody rights, alimony audits, and marital property settlements.',
      barNumber: 'DEL/112/2017',
      contactInfo: 'priya@lawyer.com',
      packages: [
        { name: 'Divorce Mediation Consultation', price: '₹2,500', desc: 'Review of mediation steps, asset splits, and child custody rules.' },
        { name: 'Mutual Consent Filing Pack', price: '₹8,000', desc: 'Drafting all mutual separation agreements and court filing support.' }
      ],
      verified_cases: [
        { case_type: "Mutual Separation Agreement Petition", year: 2024, court_level: "District Court", role: "Petitioner's Counsel" },
        { case_type: "Joint Custody & Visitation Dispute", year: 2023, court_level: "District Court", role: "Petitioner's Counsel" },
        { case_type: "Alimony Support Revision Appeal", year: 2023, court_level: "High Court", role: "Respondent's Counsel" },
        { case_type: "Marital Asset Partition Dispute", year: 2022, court_level: "Tribunal", role: "Petitioner's Counsel" }
      ]
    }
  ];

  const MOCK_CONTRACT_AUDITS = {
    lease: {
      fileName: 'LeaseAgreement_Draft.pdf',
      fileSize: '1.8 MB',
      score: '3 Warnings Found',
      clauses: [
        {
          num: 'Section 14(b) - Fees',
          severity: 'warning',
          severityText: 'Legal Violation',
          original: '“In the event Rent is not received by the 2nd day, Tenant agrees to pay a late fee of ₹1,500.00, plus an additional ₹250.00 for every day the payment remains unpaid.”',
          explanation: 'This late fee structure is punitive and disproportionate. Local laws limit late fees to a reasonable cost incurred by the landlord, typically capped at 5% of monthly rent.',
          remedy: 'Request that the daily compounding fee be deleted and the late fee capped at 5% after a 5-day grace period.'
        },
        {
          num: 'Section 8(c) - Entry',
          severity: 'warning',
          severityText: 'Legal Violation',
          original: '“Landlord reserves the full right to enter the leased premises at any hour, without prior notification, for inspection, cleaning, repairs, or showing.”',
          explanation: 'Violates the tenant’s right to Quiet Enjoyment. State law requires landlords to give at least 24 hours advance written notice before entry, except in emergencies.',
          remedy: 'Change wording to: "Landlord shall provide at least 24 hours advance written notice of intent to enter, and entry must occur during normal business hours."'
        },
        {
          num: 'Section 22 - Liability',
          severity: 'caution',
          severityText: 'Severely Landlord-Tilted',
          original: '“Tenant waives all rights to sue Landlord for damages, personal injuries, or theft occurring on the premises, regardless of Landlord’s negligence.”',
          explanation: 'Courts routinely strike down clauses that attempt to exempt landlords from liability for their own negligence. This clause is likely unenforceable but remains in lease to deter lawsuits.',
          remedy: 'Request that "regardless of Landlord’s negligence" be replaced with "except in cases of Landlord’s negligence or willful misconduct."'
        }
      ]
    },
    freelance: {
      fileName: 'FreelanceDesign_NDA_Services.docx',
      fileSize: '412 KB',
      score: '2 Warnings, 1 Caution',
      clauses: [
        {
          num: 'Section 4(a) - IP Transfer',
          severity: 'warning',
          severityText: 'Extreme Risk',
          original: '“All intellectual property rights in the designs transfer to the Client immediately upon creation, irrespective of invoice payment status.”',
          explanation: 'This means the client legally owns your work before they pay you. If they fail to pay, you cannot sue for copyright infringement, only for breach of contract.',
          remedy: 'Change wording to: "Intellectual property rights shall transfer to the Client only upon receipt of full payment of all outstanding invoices."'
        },
        {
          num: 'Section 7(e) - Revisions',
          severity: 'caution',
          severityText: 'Scope Creep Risk',
          original: '“Designer agrees to make edits, additions, and modifications to the work as requested by the Client until Client is fully satisfied.”',
          explanation: 'Allows client to demand unlimited revisions without additional compensation, leading to severe scope creep.',
          remedy: 'Amend to: "Pricing includes up to two (2) rounds of major revisions. Any additional revisions will be billed at ₹1,000/hour."'
        },
        {
          num: 'Section 11 - Disputes',
          severity: 'warning',
          severityText: 'Waives Rights',
          original: '“Any dispute under this Agreement must be submitted to binding arbitration in Wilmington, Delaware. Designer waives all rights to bring class action claims.”',
          explanation: 'Delaware arbitration is extremely expensive for an individual contractor and forces you to travel/hire out-of-state lawyers for small invoice disputes.',
          remedy: 'Request that the dispute venue be set to your local county court, and allow Small Claims action as an option before arbitration.'
        }
      ]
    }
  };

  const MOCK_CHAT_ANSWERS = [
    {
      keywords: ['hello', 'hi', 'hey', 'start'],
      response: 'Hello! I’m glad to connect with you here. Let’s make sure we have your documents in place. Have you uploaded your lease or agreement in the Files section on the right? That’s our best starting point.'
    },
    {
      keywords: ['uploaded', 'file', 'lease', 'contract', 'document'],
      response: 'Excellent, I see the file. If you haven’t done so already, go ahead and click the "Scan File" button next to it. Our system runs an instant legal health-check, and then I will outline exactly which sections are problematic so we can draft our demand letter.'
    },
    {
      keywords: ['court', 'sue', 'judge', 'small claims'],
      response: 'Small Claims is highly effective for this amount. The judge will look for three things: a signed contract, evidence of breach (like photos or invoices), and proof that we tried to resolve it beforehand (our formal demand letter). We are currently on Step 1: drafting that letter.'
    },
    {
      keywords: ['fee', 'payment', 'money', 'cost', 'escrow'],
      response: 'Your payment is currently held securely in VakilSetu Escrow. I will only receive those funds once we conclude this phase (sending the formal letter and receiving their response). You have complete control over releases.'
    },
    {
      keywords: ['help', 'advice', 'should i'],
      response: 'Based on the facts, the law is on your side. My advice is to maintain all communication in writing. If they call you, follow up with an email summarizing what was said. This creates a paper trail that judges love.'
    }
  ];

  // ==================== ELEMENTS SELECTORS ====================
  const navTabsContainer = document.getElementById('nav-tabs-container');
  const sections = document.querySelectorAll('.content-section');
  const navTabButtons = document.querySelectorAll('.nav-tab');

  // Tab 1 Elements
  const caseInput = document.getElementById('case-description-input');
  const charCount = document.getElementById('char-count');
  const btnRunAnalysis = document.getElementById('btn-run-analysis');
  const promptChips = document.querySelectorAll('.prompt-chip');
  const analyzerInitialState = document.getElementById('analyzer-initial-state');
  const analyzerLoadingState = document.getElementById('analyzer-loading-state');
  const analyzerSuccessState = document.getElementById('analyzer-success-state');
  const loadingStatusText = document.getElementById('loading-status-text');

  // Tab 1 Success Outputs
  const resCaseCategory = document.getElementById('result-case-category');
  const resCaseTitle = document.getElementById('result-case-title');
  const resViabilityCircle = document.getElementById('viability-progress-circle');
  const resViabilityPercent = document.getElementById('viability-percent');
  const resClaimValue = document.getElementById('result-claim-value');
  const resActionability = document.getElementById('result-actionability');
  const resFilingCosts = document.getElementById('result-filing-costs');
  const resNarrative = document.getElementById('result-narrative');
  const resStepsList = document.getElementById('result-steps-list');
  const btnGoToMatchmaker = document.getElementById('btn-go-to-matchmaker');

  // Tab 2 Elements
  const filterSpecialty = document.getElementById('filter-specialty');
  const filterPricing = document.getElementById('filter-pricing');
  const filterExperience = document.getElementById('filter-experience');
  const activeCaseFilterTag = document.getElementById('active-case-filter-tag');
  const activeCaseCategoryName = document.getElementById('active-case-category-name');
  const btnClearCaseFilter = document.getElementById('btn-clear-case-filter');
  const lawyersListContainer = document.getElementById('lawyers-list-container');

  // Case Search Engine Elements
  const caseSearchBar = document.getElementById('case-search-bar');
  const btnSearchCases = document.getElementById('btn-search-cases');
  const searchRecommendationBox = document.getElementById('search-recommendation-box');
  const recCategoryName = document.getElementById('rec-category-name');

  // Booking Modal
  const bookingModal = document.getElementById('booking-modal');
  const bookingModalTitle = document.getElementById('booking-modal-title');
  const bookingLawyerMini = document.getElementById('booking-lawyer-mini');
  const modalPackagesContainer = document.getElementById('modal-packages-container');
  const bookingForm = document.getElementById('booking-form');
  const btnCloseModal = document.getElementById('btn-close-modal');

  // Tab 3 Elements
  const workspaceBadge = document.getElementById('workspace-badge');
  const workspaceEmptyContainer = document.getElementById('workspace-empty-container');
  const workspaceActiveContainer = document.getElementById('workspace-active-container');
  const btnWorkspaceQuickstart = document.getElementById('btn-workspace-quickstart');

  const wsLawyerAvatar = document.getElementById('ws-lawyer-avatar');
  const wsLawyerName = document.getElementById('ws-lawyer-name');
  const wsLawyerRole = document.getElementById('ws-lawyer-role');
  const wsRoadmapSteps = document.getElementById('ws-roadmap-steps');
  const wsPricingTag = document.getElementById('ws-pricing-tag');
  const wsPricingPrice = document.getElementById('ws-pricing-price');
  const wsPricingDesc = document.getElementById('ws-pricing-desc');

  const chatMessagesBox = document.getElementById('chat-messages-box');
  const chatInputForm = document.getElementById('chat-input-form');
  const chatMessageInput = document.getElementById('chat-message-input');

  const docUploadDropzone = document.getElementById('doc-upload-dropzone');
  const uploadedFilesList = document.getElementById('uploaded-files-list');
  const clauseAuditorContainer = document.getElementById('clause-auditor-container');
  const auditFileName = document.getElementById('audit-file-name');
  const auditScore = document.getElementById('audit-score');
  const auditClausesBox = document.getElementById('audit-clauses-box');
  const btnCloseAudit = document.getElementById('btn-close-audit');
  const mockDocBtns = document.querySelectorAll('.mock-doc-btn');
  const wsDocsCount = document.getElementById('ws-docs-count');

  // Accordion faq
  const faqQuestions = document.querySelectorAll('.faq-question');

  // ==================== SPA ROUTING ====================
  function switchTab(tabId) {
    state.activeTab = tabId;

    // Update navbar class
    navTabButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update section visibility
    sections.forEach(section => {
      if (section.id === `section-${tabId}`) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    // Clear workspace badge if user clicks workspace
    if (tabId === 'workspace') {
      workspaceBadge.style.display = 'none';
    }

    // Special scroll triggers or logic when entering tabs
    if (tabId === 'matchmaker') {
      renderLawyers();
    }
    if (tabId === 'settings') {
      populateSettingsForm();
    }
    // Re-render lawyer caseload every time the workspace/caseload tab is opened
    // so any new client bookings (state.activeConsultation) appear immediately
    if (tabId === 'workspace' && state.userType === 'lawyer' && typeof renderLawyerCaseload === 'function') {
      renderLawyerCaseload();
    }
  }

  // Bind tab clicks
  navTabsContainer.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.nav-tab');
    if (tabBtn) {
      const tabId = tabBtn.getAttribute('data-tab');
      switchTab(tabId);
    }
  });

  // ==================== TEXTAREA & CHIPS ====================
  caseInput.addEventListener('input', () => {
    charCount.textContent = caseInput.value.length;
  });

  promptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.getAttribute('data-text');
      caseInput.value = text;
      charCount.textContent = text.length;
      caseInput.focus();
    });
  });

  // ==================== MULTILINGUAL VOICE INTAKE ====================
  const btnVoiceInput = document.getElementById('btn-voice-input');
  const voiceLangSelect = document.getElementById('voice-lang-select');
  const voiceStatusText = document.getElementById('voice-status-text');
  
  if (btnVoiceInput && caseInput) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isRecording = false;
    let startText = '';

    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        isRecording = true;
        btnVoiceInput.classList.add('recording');
        btnVoiceInput.setAttribute('title', 'Stop Recording');
        if (voiceStatusText) {
          voiceStatusText.style.display = 'inline';
          voiceStatusText.textContent = 'Listening... Speak your legal issue';
        }
        
        startText = caseInput.value;
        if (startText.length > 0 && !startText.endsWith(' ')) {
          startText += ' ';
        }
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        caseInput.value = startText + finalTranscript + interimTranscript;
        charCount.textContent = caseInput.value.length;
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopRecording();
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone permission in your browser to use voice intake.');
        }
      };

      recognition.onend = () => {
        if (isRecording) {
          stopRecording();
        }
      };

      const startRecording = () => {
        recognition.lang = voiceLangSelect ? voiceLangSelect.value : 'en-IN';
        try {
          recognition.start();
        } catch (e) {
          console.error("Error starting speech recognition:", e);
        }
      };

      const stopRecording = () => {
        isRecording = false;
        try {
          recognition.stop();
        } catch(e) {}
        btnVoiceInput.classList.remove('recording');
        btnVoiceInput.setAttribute('title', 'Voice Input');
        if (voiceStatusText) {
          voiceStatusText.style.display = 'none';
        }
        // Auto-trigger case analysis
        setTimeout(() => {
          if (caseInput.value.trim().length > 0) {
            btnRunAnalysis.click();
          }
        }, 800);
      };

      btnVoiceInput.addEventListener('click', () => {
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      });
    } else {
      btnVoiceInput.addEventListener('click', () => {
        alert('Web Speech recognition is not supported by your current browser. Please try Chrome, Edge, or Safari.');
      });
      if (voiceLangSelect) voiceLangSelect.style.display = 'none';
    }
  }

  // ==================== CASE ANALYZER LOGIC ====================
  btnRunAnalysis.addEventListener('click', async () => {
    const description = caseInput.value.trim();
    if (!description) {
      alert('Please describe your legal situation before running the audit.');
      return;
    }
    if (description.length > 2000) {
      alert('Case description must be under 2000 characters.');
      return;
    }

    // Read city + budget fields
    const cityEl = document.getElementById('analyzer-city');
    const budgetEl = document.getElementById('analyzer-budget');
    const city = cityEl ? cityEl.value.trim().substring(0, 100) : '';
    const budget = budgetEl ? budgetEl.value.substring(0, 100) : '';

    // Disable button while processing
    btnRunAnalysis.disabled = true;
    const originalBtnHTML = btnRunAnalysis.innerHTML;
    btnRunAnalysis.innerHTML = '<i data-lucide="loader"></i> Analyzing…';
    lucide.createIcons();

    // Trigger loading UI
    analyzerInitialState.style.display = 'none';
    analyzerSuccessState.style.display = 'none';
    analyzerLoadingState.style.display = 'flex';

    // Animate loading steps
    const steps = [
      { id: 'step-1', text: 'Parsing statement & compiling entities...', delay: 0 },
      { id: 'step-2', text: 'Classifying domain, legal remedies & jurisdiction...', delay: 800 },
      { id: 'step-3', text: 'Estimating claim worth, costs & feasibility...', delay: 1600 },
      { id: 'step-4', text: 'Mapping strategic next steps & pre-vetted matching...', delay: 2400 }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        loadingStatusText.textContent = step.text;
        const stepEl = document.getElementById(step.id);
        if (stepEl) {
          stepEl.classList.add('active');
          if (index > 0) {
            const prevEl = document.getElementById(steps[index - 1].id);
            if (prevEl) {
              prevEl.classList.remove('active');
              prevEl.classList.add('complete');
              prevEl.innerHTML = '<i data-lucide="check-circle-2" class="text-emerald"></i> ' + prevEl.textContent.trim();
              lucide.createIcons({ attrs: { class: 'text-emerald' } });
            }
          }
        }
        if (index === steps.length - 1) {
          const finalEl = document.getElementById(step.id);
          if (finalEl) {
            finalEl.classList.remove('active');
            finalEl.classList.add('complete');
            finalEl.innerHTML = '<i data-lucide="check-circle-2" class="text-emerald"></i> ' + finalEl.textContent.trim();
            lucide.createIcons({ attrs: { class: 'text-emerald' } });
          }
        }
      }, step.delay);
    });

    // Call the secure backend proxy
    try {
      const response = await fetch('/api/analyze-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseText: description, budget, urgency: '', city })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Analysis failed. Please try again.');
      }

      // Render results using the response
      renderAnalysisReport(data, city, budget);

    } catch (err) {
      analyzerLoadingState.style.display = 'none';
      analyzerInitialState.style.display = 'flex';
      alert(err.message || 'Something went wrong. Please try again.');
    } finally {
      // 5-second cooldown to prevent abuse
      setTimeout(() => {
        btnRunAnalysis.disabled = false;
        btnRunAnalysis.innerHTML = originalBtnHTML;
        lucide.createIcons();
      }, 5000);
    }
  });

  function generateAnalysisReport(inputText) {
    const text = inputText.toLowerCase();

    // ── Helper: count how many of these keywords appear ──────────────────
    const hits = (keywords) => keywords.filter(k => text.includes(k)).length;

    // ── CASE PROFILES ────────────────────────────────────────────────────
    const caseProfiles = [
      {
        id: 'tenancy',
        filterTag: 'tenancy',
        keywords: ['landlord', 'tenant', 'deposit', 'security deposit', 'rent', 'lease', 'apartment',
                   'roommate', 'eviction', 'lockout', 'maintenance', 'repair', 'flat', 'pg',
                   'makan malik', 'kiraya', 'ghar', 'zameen', 'makaan', 'bahar nikala', 'house'],
        category: 'Tenancy & Real Estate',
        title: 'Tenancy, Deposit or Housing Dispute',
        viability: 82,
        actionability: 'Strong',
        claimValue: '₹15,000 – ₹50,000',
        filingCosts: '₹450 – ₹900 (Rent Controller)',
        narrative: 'Under the Rent Control Act and general tenancy law, a landlord cannot withhold your security deposit without providing a written, itemized breakdown of deductions within the statutory deadline (usually 21–30 days). Deductions for normal wear-and-tear (e.g., minor wall marks, cabinet scratches) are legally invalid. Illegal lockouts without a court order are a criminal offence (IPC §448). Based on your description, you have a strong claim if you have photographs, messages, or the original lease agreement.',
        steps: [
          'Send a Tenant Demand Letter via registered post or email with read-receipt, citing the specific clause breached.',
          'Compile all move-in/move-out photographs, WhatsApp/email threads, and rent receipts into one folder.',
          'File a complaint with the local Rent Controller or Civil Court if no response within 15 days.',
          'Consider filing an FIR under IPC §448 if locks were changed without a court order.',
          'Connect with a Tenancy Law advocate through the Matchmaker to send a formal legal notice (₹500–₹1,500).'
        ]
      },
      {
        id: 'employment',
        filterTag: 'employment',
        keywords: ['wage', 'salary', 'freelance', 'invoice', 'unpaid', 'contractor', 'designer',
                   'payment', 'job', 'fired', 'terminated', 'employer', 'notice period', 'gratuity',
                   'pf', 'provident fund', 'overtime', 'naukri', 'paisa nahi', 'boss', 'kaam', 'baki'],
        category: 'Employment & Labor Law',
        title: 'Unpaid Wages, Freelance Invoice or Wrongful Termination',
        viability: 78,
        actionability: 'Strong',
        claimValue: '₹20,000 – ₹1,50,000',
        filingCosts: '₹0 – ₹600 (Labour Commissioner is free)',
        narrative: 'Freelance agreements and employment contracts are legally enforceable documents. If services were rendered and accepted, withholding payment is a clear breach of contract (Indian Contract Act §73). For salaried employees, wrongful termination without the contractual notice period or severance is actionable under the Industrial Disputes Act. The Labour Commissioner can be approached at zero filing cost for salary disputes, and the MSME Samadhaan portal provides interest on delayed payments for MSME clients.',
        steps: [
          'Send a formal "Letter of Intent to Sue" by registered post giving the employer/client 7 business days to settle.',
          'Export PDFs of your signed contract, all approval emails, and submitted invoices.',
          'File an online complaint on MSME Samadhaan (msme.gov.in) if the debtor is a registered MSME.',
          'File a wage claim with the local Labour Commissioner (no fee required).',
          'If above ₹50,000, file a summary suit under Order 37 CPC in the Civil Court.'
        ]
      },
      {
        id: 'consumer',
        filterTag: 'consumer',
        keywords: ['car', 'vehicle', 'dealer', 'warranty', 'lemon', 'defective', 'product', 'refund',
                   'online', 'amazon', 'flipkart', 'shopping', 'ecommerce', 'fraud', 'returned', 'replace',
                   'subscription', 'service', 'restaurant', 'hospital', 'bill', 'overcharged', 'deficiency',
                   'cheating', 'dhoka', 'saman', 'kharab', 'product kharab', 'nahi mila', 'scam'],
        category: 'Consumer Protection',
        title: 'Consumer Fraud, Product Defect or Service Deficiency',
        viability: 70,
        actionability: 'Moderate–Strong',
        claimValue: '₹10,000 – ₹2,00,000',
        filingCosts: '₹200 – ₹1,000 (Consumer Forum)',
        narrative: 'The Consumer Protection Act 2019 is one of India\'s strongest pieces of legislation for ordinary citizens. Complaints can be filed online at edaakhil.nic.in for free (up to ₹5 lakh claims). You are entitled to replacement/refund AND compensation for mental agony. E-commerce companies like Amazon/Flipkart are now directly liable under the Act. Verbal warranties during a sale can be proven through WhatsApp screenshots or call recordings (legal to record in India).',
        steps: [
          'File a complaint on the National Consumer Helpline (NCH): Call 1800-11-4000 or use consumerhelpline.gov.in for immediate escalation.',
          'File an online consumer complaint at edaakhil.nic.in (District Commission handles claims up to ₹50 lakh).',
          'Preserve screenshots of product listings, delivery confirmations, chat logs, and the original invoice.',
          'Send a formal Notice to the company via their Grievance Officer (required by law to respond within 48 hrs for e-commerce).',
          'If a vehicle defect, get an independent inspection report from an authorized service centre documenting the fault.'
        ]
      },
      {
        id: 'family',
        filterTag: 'family',
        keywords: ['divorce', 'wife', 'husband', 'marriage', 'matrimonial', 'alimony', 'maintenance',
                   'custody', 'child', 'dowry', 'domestic violence', 'dv', 'talaaq', 'talak', 'separation',
                   'cheating', 'affair', 'desertion', 'cruelty', 'harassment', 'shadi', 'pati', 'patni',
                   'bachche', 'dahej', 'ghar se nikala'],
        category: 'Family Law & Matrimonial',
        title: 'Matrimonial Dispute, Divorce or Domestic Violence',
        viability: 72,
        actionability: 'Moderate',
        claimValue: 'Maintenance + Alimony (Case Specific)',
        filingCosts: '₹500 – ₹2,500 (Family Court)',
        narrative: 'Family disputes are handled by dedicated Family Courts and are governed by personal law (Hindu Marriage Act, Special Marriage Act, Muslim Personal Law, etc.). For domestic violence cases, the Protection of Women from Domestic Violence Act 2005 provides fast-track relief including a Protection Order, Residence Order, and Maintenance Order — all within days if needed. Dowry harassment is a cognizable offence under IPC §498A, which is a non-bailable and non-compoundable crime.',
        steps: [
          'If facing physical violence or immediate danger, call 100 (Police) or 181 (Women Helpline) immediately.',
          'File a complaint under the DV Act with the Protection Officer at your local District Court — no lawyer needed initially.',
          'For divorce, file a petition in the Family Court of the district where you last resided together.',
          'Preserve all communications (texts, emails, call logs), medical reports if any, and witness contact details.',
          'For child custody, document your parenting routine and capacity. Courts prioritize the "best interest of the child".'
        ]
      },
      {
        id: 'criminal',
        filterTag: 'criminal',
        keywords: ['fir', 'police', 'theft', 'robbery', 'assault', 'attack', 'beat', 'hit',
                   'mara', 'maar', 'peeta', 'chori', 'dakaiti', 'fraud', 'criminal', 'bail', 'arrested',
                   'chargesheet', 'accused', 'complaint', 'murder', 'threat', 'dhaki', 'dhamki',
                   'blackmail', 'extortion', 'abduction', 'kidnap'],
        category: 'Criminal Law',
        title: 'Criminal Complaint, FIR or Defence',
        viability: 68,
        actionability: 'Urgent – Act Immediately',
        claimValue: 'Criminal Prosecution (No monetary claim)',
        filingCosts: '₹0 (FIR Filing) – ₹5,000+ (Legal Defence)',
        narrative: 'Filing an FIR is your constitutional right (Section 154 CrPC) — police cannot legally refuse to register it for cognizable offences like theft, assault, or fraud. If police refuse, you can file a complaint directly to the Superintendent of Police (SP) or use the online portal at your state\'s police website. For bail matters, a criminal lawyer needs to be engaged immediately. Courts must hear bail applications within 24 hours of arrest.',
        steps: [
          'File an FIR at the nearest police station. If refused, file a complaint to the SP or at the Judicial Magistrate\'s court directly.',
          'Note the FIR number and get a copy — this is your legal right and it is free.',
          'Preserve all evidence: CCTV footage, witnesses, messages, photos of injuries or damaged property.',
          'If arrested: you have the right to inform one person of your choice and to consult a lawyer before interrogation.',
          'Engage a criminal defence lawyer immediately if accused; approach Legal Aid Services if you cannot afford one (free under Sec 12 Legal Services Authority Act).'
        ]
      },
      {
        id: 'property',
        filterTag: 'contract',
        keywords: ['property', 'land', 'plot', 'zameen', 'registry', 'sale deed', 'possession',
                   'encroachment', 'boundary', 'builder', 'flat purchase', 'rera', 'construction delay',
                   'possession not given', 'agreement to sell', 'title', 'dispute', 'inheritance',
                   'will', 'vasiyat', 'succession', 'partition', 'bhai', 'baap ki zameen'],
        category: 'Property & Real Estate Law',
        title: 'Property Dispute, Builder Default or Land Encroachment',
        viability: 65,
        actionability: 'Moderate',
        claimValue: '₹50,000 – ₹50,00,000 (Case-specific)',
        filingCosts: '₹1,000 – ₹5,000 (Civil/RERA Court)',
        narrative: 'Property disputes are among the most complex matters in Indian law. For builder defaults (delayed possession, construction defects), the Real Estate (Regulation & Development) Act 2016 (RERA) provides a fast-track, dedicated regulator in every state. Filing a RERA complaint is relatively cheap and fast (3–6 months) compared to civil court (3–5 years). For inheritance disputes, a suit for partition can be filed in civil court. Encroachment must be documented with survey records from the tehsil office.',
        steps: [
          'For builder disputes: file a complaint on your state\'s RERA portal (e.g., MahaRERA, HRERA). This is the fastest and cheapest option.',
          'Collect original title documents, sale agreement, payment receipts, and builder communications.',
          'Get a certified copy of the property\'s land record (Jamabandi/7-12 extract) from the tehsil office to verify ownership.',
          'For land encroachment, file a police complaint and then a civil suit for declaration + injunction.',
          'Engage a property lawyer to conduct a thorough title search before filing any suit.'
        ]
      },
      {
        id: 'cyber',
        filterTag: 'consumer',
        keywords: ['cyber', 'online fraud', 'upi', 'paytm', 'phonepe', 'bank fraud', 'phishing',
                   'otp fraud', 'hacked', 'account hack', 'social media', 'defamation', 'fake account',
                   'photo misuse', 'morphed', 'identity theft', 'extortion online', 'sextortion',
                   'intimate photo', 'saiber', 'online theek'],
        category: 'Cyber Crime & Digital Fraud',
        title: 'Online Fraud, UPI Scam or Cyber Harassment',
        viability: 60,
        actionability: 'Moderate – Report Immediately',
        claimValue: 'Recovery of Defrauded Amount',
        filingCosts: '₹0 (Cybercrime Portal is free)',
        narrative: 'India\'s IT Act 2000 (Sections 43, 66C, 66D, 67) and IPC cover cyber fraud, identity theft, and online harassment. The golden rule: report within 24-48 hours. RBI\'s zero-liability rule means if you report an unauthorized UPI/bank transaction within 3 working days, you are entitled to a full refund. For sextortion or intimate photo misuse, this is a non-bailable offence under IT Act §67 and POCSO if a minor is involved — police must act.',
        steps: [
          'Immediately report on cybercrime.gov.in or call the National Cybercrime Helpline: 1930.',
          'For UPI/bank fraud: call your bank immediately to freeze the transaction, then file a complaint at the bank branch AND at 1930.',
          'Do NOT delete any messages, screenshots, or emails — they are evidence. Take screenshots of everything.',
          'File an FIR at the cyber crime police station in your city (most major cities have dedicated units).',
          'For social media harassment/defamation: report the content on the platform AND file a legal complaint simultaneously.'
        ]
      },
      {
        id: 'contract',
        filterTag: 'contract',
        keywords: ['contract', 'agreement', 'breach', 'promise', 'deal', 'business', 'partner',
                   'cheated', 'money stuck', 'loan', 'borrowed', 'return', 'promissory note',
                   'nahi lautaya', 'paise wapas', 'dost ne', 'bhai ne', 'relative ne'],
        category: 'Contract & Civil Dispute',
        title: 'Breach of Contract or Money Recovery',
        viability: 68,
        actionability: 'Moderate',
        claimValue: '₹10,000 – ₹5,00,000 (Claim Amount)',
        filingCosts: '₹500 – ₹2,000 (Civil Court)',
        narrative: 'Any oral or written agreement to do something (or pay something) is a contract under the Indian Contract Act 1872. If one party fails to perform, the aggrieved party is entitled to compensation equal to the actual loss suffered. For money recovery disputes, a summary suit under Order 37 CPC is the fastest civil court option, especially when the debt is based on a written agreement, cheque, or promissory note. Cheque bounce (under Sec 138 Negotiable Instruments Act) is a criminal matter that can result in imprisonment.',
        steps: [
          'Send a formal Legal Notice via an advocate (₹500–₹1,000) — this often resolves matters without going to court.',
          'If based on a bounced cheque: file a criminal complaint under Sec 138 NI Act within 30 days of receiving the bank\'s dishonour memo.',
          'Collect all evidence of the agreement: written contract, WhatsApp chats, bank transfer records, witnesses.',
          'File a recovery suit in the Civil Court of appropriate jurisdiction (District Court for above ₹3 lakh).',
          'Consider Lok Adalat for a quick settlement — if both parties agree, it has the force of a court decree and is appeal-proof.'
        ]
      }
    ];

    // ── MATCHING LOGIC: score each profile by keyword hits ───────────────
    let bestProfile = null;
    let bestScore = 0;

    caseProfiles.forEach(profile => {
      const score = hits(profile.keywords);
      if (score > bestScore) {
        bestScore = score;
        bestProfile = profile;
      }
    });

    // Fallback if nothing matched
    const analysis = bestProfile || caseProfiles.find(p => p.id === 'contract');

    // Count matching lawyers for this category
    const matchingLawyerCount = LAWYERS_DATABASE.filter(l => l.specialty === analysis.filterTag).length;
    const advocateCountEl = document.getElementById('matchmaker-advocate-count');
    if (advocateCountEl) {
      advocateCountEl.textContent = matchingLawyerCount > 0
        ? `We found ${matchingLawyerCount} pre-vetted advocate${matchingLawyerCount > 1 ? 's' : ''} specializing in ${analysis.category}.`
        : `We are matching you to our best available advocates for ${analysis.category}.`;
    }

    // Set state
    state.isCaseAnalyzed = true;
    state.analyzedCategory = analysis.filterTag;
    state.analyzedData = analysis;

    // Render results
    resCaseCategory.textContent = analysis.category;
    resCaseCategory.className = `pill-tag text-accent ${analysis.filterTag}`;
    resCaseTitle.textContent = analysis.title;

    // Viability circle computation
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (analysis.viability / 100) * circumference;
    resViabilityCircle.style.strokeDashoffset = strokeDashoffset;
    resViabilityCircle.style.stroke = analysis.viability >= 75 ? '#10b981' : (analysis.viability >= 60 ? '#f59e0b' : '#f43f5e');
    resViabilityPercent.textContent = `${analysis.viability}%`;

    resClaimValue.textContent = analysis.claimValue;
    resActionability.textContent = analysis.actionability;
    resActionability.className = `value ${analysis.viability >= 75 ? 'text-emerald' : 'text-cyan'}`;
    resFilingCosts.textContent = analysis.filingCosts;
    resNarrative.textContent = analysis.narrative;

    // Next steps checklist
    resStepsList.innerHTML = '';
    analysis.steps.forEach((step, i) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <i data-lucide="check-square" class="text-emerald"></i>
        <div>
          <strong>Step ${i + 1}:</strong> ${step}
        </div>
      `;
      resStepsList.appendChild(li);
    });

    lucide.createIcons();

    // Show result dashboard
    analyzerLoadingState.style.display = 'none';
    analyzerSuccessState.style.display = 'block';

    // Show filter tag for lawyers
    activeCaseCategoryName.textContent = analysis.category.split(' ')[0];
    activeCaseFilterTag.style.display = 'flex';
  }

  // ==================== RENDER FROM API RESPONSE ====================
  // Called with the JSON returned by /api/analyze-case (real or fallback)
  function renderAnalysisReport(analysis, city, budget) {
    const category = analysis.practiceArea || analysis.category || "General legal issue";
    const viability = Number(analysis.viabilityScore || analysis.viability) || 70;
    const filingCosts = analysis.estimatedCosts || analysis.filingCosts || "Case Specific";
    const stepsList = analysis.actionPlan || analysis.steps || [];

    // Count matching lawyers for this category
    const matchingLawyerCount = LAWYERS_DATABASE.filter(l => l.specialty === analysis.filterTag).length;
    const advocateCountEl = document.getElementById('matchmaker-advocate-count');
    if (advocateCountEl) {
      let msg = matchingLawyerCount > 0
        ? `We found ${matchingLawyerCount} pre-vetted advocate${matchingLawyerCount > 1 ? 's' : ''} specializing in ${category}.`
        : `We are matching you to our best available advocates for ${category}.`;
      if (city) msg += ` (${city} area)`;
      if (analysis.matchNote) msg = analysis.matchNote;
      advocateCountEl.textContent = msg;
    }

    // Set state
    state.isCaseAnalyzed = true;
    state.analyzedCategory = analysis.filterTag;
    state.analyzedData = analysis;

    // Render results
    resCaseCategory.textContent = category;
    resCaseCategory.className = `pill-tag text-accent ${analysis.filterTag}`;
    resCaseTitle.textContent = analysis.title;

    // Viability circle computation
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (viability / 100) * circumference;
    resViabilityCircle.style.strokeDashoffset = strokeDashoffset;
    resViabilityCircle.style.stroke = viability >= 75 ? '#10b981' : (viability >= 60 ? '#f59e0b' : '#f43f5e');
    resViabilityPercent.textContent = `${viability}%`;

    resClaimValue.textContent = analysis.claimValue;
    resActionability.textContent = analysis.actionability;
    resActionability.className = `value ${viability >= 75 ? 'text-emerald' : 'text-cyan'}`;
    resFilingCosts.textContent = filingCosts;
    resNarrative.textContent = analysis.narrative;

    // Next steps checklist
    resStepsList.innerHTML = '';
    stepsList.forEach((step, i) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <i data-lucide="check-square" class="text-emerald"></i>
        <div>
          <strong>Step ${i + 1}:</strong> ${step}
        </div>
      `;
      resStepsList.appendChild(li);
    });

    // Control visibility of generate PDF notice controls and banner
    const btnGenerateNotice = document.getElementById('btn-generate-notice');
    const btnTakeToLawyer = document.getElementById('btn-take-to-lawyer');
    const artifactReadyBanner = document.getElementById('artifact-ready-banner');
    
    if (analysis.legalNotice) {
      if (btnGenerateNotice) btnGenerateNotice.style.display = 'flex';
      if (btnTakeToLawyer) btnTakeToLawyer.style.display = 'flex';
      if (artifactReadyBanner) artifactReadyBanner.style.display = 'flex';
    } else {
      if (btnGenerateNotice) btnGenerateNotice.style.display = 'none';
      if (btnTakeToLawyer) btnTakeToLawyer.style.display = 'none';
      if (artifactReadyBanner) artifactReadyBanner.style.display = 'none';
    }

    lucide.createIcons();

    // Show result dashboard
    analyzerLoadingState.style.display = 'none';
    analyzerSuccessState.style.display = 'block';

    // Show filter tag for lawyers
    activeCaseCategoryName.textContent = (category || '').split(' ')[0];
    activeCaseFilterTag.style.display = 'flex';
  }

  // Generate Notice PDF Action
  const btnGenerateNotice = document.getElementById('btn-generate-notice');
  if (btnGenerateNotice) {
    btnGenerateNotice.addEventListener('click', () => {
      if (!state.analyzedData || !state.analyzedData.legalNotice) {
        alert("No legal notice template data found for this case.");
        return;
      }
      generateNoticePDF(state.analyzedData.legalNotice);
    });
  }

  // Take Notice to Verified Lawyer Action (demo flow)
  const btnTakeToLawyer = document.getElementById('btn-take-to-lawyer');
  if (btnTakeToLawyer) {
    btnTakeToLawyer.addEventListener('click', () => {
      if (!state.analyzedData) return;
      const filterTag = state.analyzedData.filterTag;
      
      // 1. Switch to matchmaker tab
      switchTab('matchmaker');
      
      // 2. Pre-filter select list
      const filterSpecialty = document.getElementById('filter-specialty');
      if (filterSpecialty) {
        filterSpecialty.value = filterTag;
        // Trigger render
        if (typeof renderLawyers === 'function') {
          renderLawyers();
        }
      }
      
      // 3. Smooth scroll down to the matchmaker section
      const sectionMatchmaker = document.getElementById('section-matchmaker');
      if (sectionMatchmaker) {
        sectionMatchmaker.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  function generateNoticePDF(notice) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    let y = 20;

    const addCenteredText = (text, fontSize, isBold = false) => {
      doc.setFont('Helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      const textWidth = doc.getTextWidth(text);
      doc.text(text, (pageWidth - textWidth) / 2, y);
      y += fontSize * 0.4 + 4;
    };

    const addParagraph = (text, fontSize = 11, lineSpacing = 6) => {
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(fontSize);
      const splitText = doc.splitTextToSize(text, contentWidth);
      splitText.forEach(line => {
        if (y > pageHeight - margin - 15) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineSpacing;
      });
      y += 4;
    };

    const addLabeledField = (label, value) => {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(label, margin, y);
      
      doc.setFont('Helvetica', 'normal');
      const valX = margin + doc.getTextWidth(label) + 2;
      const valWidth = pageWidth - valX - margin;
      const splitVal = doc.splitTextToSize(value, valWidth);
      
      splitVal.forEach((line, index) => {
        if (y > pageHeight - margin - 15) {
          doc.addPage();
          y = margin;
        }
        if (index === 0) {
          doc.text(line, valX, y);
        } else {
          doc.text(line, margin, y);
        }
        y += 6;
      });
      y += 2;
    };

    // Header stamp
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("VAKILSETU ADVOCATES ALLIANCE // AUTOMATED LEGAL DRAFT", margin, y);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 10;

    // Date
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const currentDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    doc.text(`Date: ${currentDate}`, margin, y);
    y += 10;

    // Title
    addCenteredText(notice.noticeTitle || "LEGAL DEMAND NOTICE", 13, true);
    y += 4;

    // Party sections
    addLabeledField("FROM (Claimant): ", notice.claimantNamePlaceholder || "[Claimant's Name]");
    addLabeledField("TO (Recipient): ", notice.recipientNamePlaceholder || "[Recipient's Name]");
    
    // Separator line
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Subjects and grounds
    addLabeledField("SUBJECT MATTER: ", notice.disputeSummary || "Legal recovery dispute.");
    addLabeledField("LEGAL GROUNDS: ", notice.legalGrounds || "Indian Civil Codes");
    addLabeledField("DEMANDED SUM/REMEDY: ", notice.demandedAmount || "Case Specific");
    addLabeledField("COMPLIANCE DEADLINE: ", `${notice.remedyDeadlineDays || 15} Days from receipt of notice`);

    y += 6;

    // Body
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text("FORMAL DEMAND STATEMENT OF FACTS:", margin, y);
    y += 6;

    addParagraph(notice.noticeBodyText || "You are hereby called upon to comply with the demands outlined in this document. Failure to do so will result in civil and criminal litigation without further delay.");

    y += 10;

    // Signature Block
    if (y > pageHeight - margin - 35) {
      doc.addPage();
      y = margin + 10;
    }
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text("Drafted & Endorsed by:", margin, y);
    y += 15;
    
    doc.line(margin, y, margin + 60, y);
    y += 5;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text("Endorsing Counsel / Advocate", margin, y);
    
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("VakilSetu Online Advocacy Network Stamp", margin, y + 4);

    doc.save("VakilSetu_Legal_Demand_Notice.pdf");
  }

  // Copy Report button
  const btnCopyReport = document.getElementById('btn-copy-report');
  if (btnCopyReport) {
    btnCopyReport.addEventListener('click', () => {
      if (!state.analyzedData) return;
      const d = state.analyzedData;
      const category = d.practiceArea || d.category || "General";
      const viability = d.viabilityScore || d.viability || 70;
      const filingCosts = d.estimatedCosts || d.filingCosts || "Case Specific";
      const stepsList = d.actionPlan || d.steps || [];
      const reportText = [
        `=== VAKILSETU LEGAL ANALYSIS REPORT ===`,
        `Category: ${category}`,
        `Case: ${d.title}`,
        `Viability Score: ${viability}%`,
        `Actionability: ${d.actionability}`,
        `Estimated Claim Value: ${d.claimValue}`,
        `Filing Costs: ${filingCosts}`,
        `\nLegal Assessment:\n${d.narrative}`,
        `\nRecommended Steps:\n${stepsList.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
        `\nGenerated by VakilSetu Legal Platform — For educational purposes only.`
      ].join('\n');
      navigator.clipboard.writeText(reportText).then(() => {
        btnCopyReport.innerHTML = `<i data-lucide="check"></i> Copied!`;
        lucide.createIcons();
        setTimeout(() => {
          btnCopyReport.innerHTML = `<i data-lucide="clipboard-copy"></i> Copy Report`;
          lucide.createIcons();
        }, 2000);
      });
    });
  }

  // Reset Analyzer button
  const btnResetAnalyzer = document.getElementById('btn-reset-analyzer');
  if (btnResetAnalyzer) {
    btnResetAnalyzer.addEventListener('click', () => {
      caseInput.value = '';
      charCount.textContent = '0';
      analyzerSuccessState.style.display = 'none';
      analyzerLoadingState.style.display = 'none';
      analyzerInitialState.style.display = 'flex';
      // Reset loading steps
      ['step-1','step-2','step-3','step-4'].forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) {
          el.className = 'loading-step' + (i === 0 ? ' active' : '');
          const labels = ['Parsing plain text statement', 'Classifying legal domain and jurisdiction', 'Projecting financial feasibility & damages', 'Recommending immediate steps & advocates'];
          el.innerHTML = `<i data-lucide="${i === 0 ? 'loader' : 'circle'}"></i> ${labels[i]}`;
        }
      });
      lucide.createIcons();
      state.isCaseAnalyzed = false;
      activeCaseFilterTag.style.display = 'none';
    });
  }

  // Link results to advocate matchmaker
  btnGoToMatchmaker.addEventListener('click', () => {
    switchTab('matchmaker');
    filterSpecialty.value = state.analyzedCategory;
    renderLawyers();
  });

  // ==================== ADVOCATE DIRECTORY FILTER LOGIC ====================
  function getLawyerSearchScore(lawyer, query) {
    if (!query) return 0;
    const queryLower = query.toLowerCase();
    const tokens = queryLower.split(/\W+/).filter(t => t.length > 2 && !STOP_WORDS_SET.has(t));
    if (tokens.length === 0) return 0;

    let score = 0;
    const textToSearch = [
      lawyer.name,
      lawyer.specialtyLabel,
      lawyer.bio,
      ...(lawyer.packages || []).map(p => `${p.name} ${p.desc}`),
      ...(lawyer.verified_cases || []).map(c => c.case_type)
    ].join(' ').toLowerCase();

    tokens.forEach(token => {
      let pos = textToSearch.indexOf(token);
      while (pos !== -1) {
        score++;
        pos = textToSearch.indexOf(token, pos + 1);
      }
    });

    return score;
  }

  // ==================== ADVOCATE DIRECTORY FILTER LOGIC ====================
  function renderLawyers() {
    const specialtyVal = filterSpecialty.value;
    const pricingVal = filterPricing.value;
    const expVal = filterExperience.value;

    lawyersListContainer.innerHTML = '';

    const filtered = LAWYERS_DATABASE.filter(lawyer => {
      // Specialty Filter
      if (specialtyVal !== 'all' && lawyer.specialty !== specialtyVal) return false;

      // Pricing Filter
      if (pricingVal !== 'all') {
        const hasMatchingPackage = lawyer.packages.some(pkg => {
          if (pricingVal === 'flat' && (pkg.price.includes('₹') || pkg.price.includes('Rs.')) && parseInt(pkg.price.replace('₹', '').replace('Rs.', '').replace(',', '')) < 10000) return true;
          if (pricingVal === 'hourly' && pkg.name.toLowerCase().includes('hourly')) return true;
          if (pricingVal === 'contingency' && pkg.price.toLowerCase().includes('contingency')) return true;
          return false;
        });

        // Add manual check since some prices represent flat package rates
        if (pricingVal === 'flat' && !lawyer.packages.some(p => p.price !== 'Contingency')) return false;
        if (pricingVal === 'contingency' && !lawyer.packages.some(p => p.price.toLowerCase().includes('contingency'))) return false;
      }

      // Experience Filter (based on Total Cases Handled)
      if (expVal === 'high') {
        if (lawyer.casesHandled < 50) return false;
      } else if (expVal === 'medium') {
        if (lawyer.casesHandled < 20) return false;
      }

      return true;
    });

    const searchQuery = caseSearchBar.value.trim();
    if (searchQuery) {
      filtered.sort((a, b) => {
        const scoreA = getLawyerSearchScore(a, searchQuery);
        const scoreB = getLawyerSearchScore(b, searchQuery);
        return scoreB - scoreA;
      });
    }

    // Create and append the status message card
    const cardStatus = document.createElement('div');
    cardStatus.id = 'search-status-message';
    cardStatus.className = 'glass-card';
    cardStatus.style.gridColumn = '1 / -1';
    cardStatus.style.padding = '12px 16px';
    cardStatus.style.marginBottom = '8px';
    cardStatus.style.fontSize = '14px';
    cardStatus.style.fontWeight = '500';
    cardStatus.style.color = 'var(--text-secondary)';
    cardStatus.style.display = 'flex';
    cardStatus.style.alignItems = 'center';
    cardStatus.style.gap = '8px';
    cardStatus.style.border = '1px solid rgba(255, 255, 255, 0.05)';
    cardStatus.style.background = 'rgba(255, 255, 255, 0.02)';
    cardStatus.style.borderRadius = '8px';

    let statusText = '';
    let statusIcon = 'info';

    if (searchQuery) {
      const bestCategory = determineBestCategory(searchQuery);
      if (bestCategory) {
        const label = SPECIALTY_LABELS_MAP[bestCategory] || bestCategory;
        statusText = `Showing ${filtered.length} advocates for ${label}`;
        statusIcon = 'sparkles';
      } else {
        statusText = 'No exact practice area matched. Showing all verified advocates.';
        statusIcon = 'alert-circle';
      }
    } else {
      if (specialtyVal !== 'all') {
        const label = SPECIALTY_LABELS_MAP[specialtyVal] || specialtyVal;
        statusText = `Showing ${filtered.length} advocates for ${label}`;
      } else {
        statusText = 'Showing all verified advocates';
      }
    }

    cardStatus.innerHTML = `<i data-lucide="${statusIcon}" style="width: 16px; height: 16px; color: var(--accent-cyan);"></i><span>${statusText}</span>`;
    lawyersListContainer.appendChild(cardStatus);

    if (filtered.length === 0) {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'glass-card';
      emptyCard.style.gridColumn = 'span 3';
      emptyCard.style.textAlign = 'center';
      emptyCard.style.padding = '40px';
      emptyCard.innerHTML = `
        <i data-lucide="users-round" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 12px;"></i>
        <h4>No advocates match this specific filter</h4>
        <p style="color: var(--text-secondary); margin-top: 4px;">Try loosening your filters or resetting the category.</p>
      `;
      lawyersListContainer.appendChild(emptyCard);
      lucide.createIcons();
      return;
    }

    filtered.forEach(lawyer => {
      const card = document.createElement('div');
      card.className = 'glass-card lawyer-card file-folder-card';

      // Build package elements
      let packagesHTML = '';
      lawyer.packages.forEach(pkg => {
        packagesHTML += `
          <div class="package-item">
            <span class="package-name">${pkg.name}</span>
            <span class="package-price">${pkg.price}</span>
          </div>
        `;
      });

      const avatarHTML = lawyer.avatarBase64
        ? `<img src="${lawyer.avatarBase64}" alt="${lawyer.name}" style="width:100%; height:100%; object-fit:cover;">`
        : lawyer.avatarText;

      const verificationBadge = lawyer.status === 'Pending Verification'
        ? `<span class="tag pending" style="border: 1px dashed var(--text-muted); color: var(--text-secondary); background: rgba(255, 255, 255, 0.02); font-family: var(--font-mono); font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; margin-top: 4px; display: inline-flex; align-items: center; gap: 4px; letter-spacing: 0.05em;"><i data-lucide="clock" style="width:12px; height:12px;"></i> Pending Verification</span>`
        : `<span class="bar-verification-tag"><i data-lucide="shield-check"></i> Bar Verified & Active</span>`;

      card.innerHTML = `
        <div class="lawyer-card-header">
          <div class="avatar">${avatarHTML}</div>
          <div class="lawyer-meta">
            <h3>${lawyer.name}</h3>
            <span class="specialty-label text-accent ${lawyer.specialty}">${lawyer.specialtyLabel}</span>
            ${verificationBadge}
          </div>
        </div>
        <div class="lawyer-perf">
          <div class="perf-stat">
            <span class="label">total cases</span>
            <span class="val">${lawyer.casesHandled}</span>
          </div>
          <div class="perf-stat">
            <span class="label">ongoing cases</span>
            <span class="val">${lawyer.ongoingCases || 0}</span>
          </div>
        </div>
        <p class="lawyer-card-desc">${lawyer.bio}</p>
        <div class="lawyer-packages">
          <span class="packages-heading">fixed packages</span>
          <div class="packages-list">
            ${packagesHTML}
          </div>
        </div>

        <!-- Expandable Track Record Timeline -->
        <button class="btn-track-record-toggle" data-id="${lawyer.id}">
          <span>📁 Track Record (${lawyer.verified_cases ? lawyer.verified_cases.length : 0} Verified Cases)</span>
          <i data-lucide="chevron-down" style="width:14px; height:14px;"></i>
        </button>
        <div class="track-record-timeline" id="tr-timeline-${lawyer.id}" style="display: none;">
          ${(lawyer.verified_cases || []).map(c => `
            <div class="timeline-case-item">
              <span class="timeline-case-year">${c.year}</span>
              <div class="timeline-case-title">${c.case_type}</div>
              <div class="timeline-case-meta">${c.court_level} • ${c.role}</div>
            </div>
          `).join('')}
          <div class="demo-data-disclaimer">
            Demo data — a production version would pull verified case history from eCourts/NJDG public advocate records.
          </div>
        </div>

        <!-- AI Plausibility Check Box -->
        <div class="ai-plausibility-check-box">
          <label>Check if they've handled a case like yours:</label>
          <div class="ai-check-input-wrapper">
            <input type="text" class="ai-check-text-input" id="ai-input-${lawyer.id}" placeholder="Describe your case context..." required>
            <button type="button" class="btn-ai-submit" data-id="${lawyer.id}">
              <i data-lucide="sparkles" style="width:12px; height:12px;"></i> Check
            </button>
          </div>
          <div class="verdict-stamp-container" id="ai-verdict-container-${lawyer.id}" style="display: none;"></div>
        </div>

        <div class="lawyer-footer" style="margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.05);">
          <button class="btn btn-primary btn-book-consult w-full" data-id="${lawyer.id}">
            Book Consultation
          </button>
        </div>
      `;

      lawyersListContainer.appendChild(card);
    });

    // Add listeners to book consultation buttons
    const bookBtns = lawyersListContainer.querySelectorAll('.btn-book-consult');
    bookBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const lawyerId = btn.getAttribute('data-id');
        openBookingModal(lawyerId);
      });
    });

    // Add listeners to track record toggle buttons
    const trBtns = lawyersListContainer.querySelectorAll('.btn-track-record-toggle');
    trBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const lawyerId = btn.getAttribute('data-id');
        const timelineDiv = document.getElementById(`tr-timeline-${lawyerId}`);
        const icon = btn.querySelector('i');

        if (timelineDiv.style.display === 'none') {
          timelineDiv.style.display = 'block';
          icon.setAttribute('data-lucide', 'chevron-up');
        } else {
          timelineDiv.style.display = 'none';
          icon.setAttribute('data-lucide', 'chevron-down');
        }
        lucide.createIcons();
      });
    });

    // Add listeners to AI Plausibility check buttons
    const aiBtns = lawyersListContainer.querySelectorAll('.btn-ai-submit');
    aiBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const lawyerId = btn.getAttribute('data-id');
        const lawyer = LAWYERS_DATABASE.find(l => l.id === lawyerId);
        const inputField = document.getElementById(`ai-input-${lawyerId}`);
        const verdictContainer = document.getElementById(`ai-verdict-container-${lawyerId}`);
        const queryText = inputField.value.trim();

        if (!queryText) {
          alert('Please enter a description of your case first!');
          return;
        }

        // Show loading state
        btn.disabled = true;
        verdictContainer.style.display = 'block';
        verdictContainer.innerHTML = `
          <div style="font-family: var(--font-mono); font-size:11px; color: var(--text-secondary); display: flex; align-items:center; gap:6px;">
            <span class="pulse" style="width:8px; height:8px; background:var(--color-thread); border-radius:50%;"></span>
            Auditing case database with Claude...
          </div>
        `;

        try {
          // Perform check (Anthropic API with mock fallback)
          const result = await checkPlausibilityWithClaude(lawyer, queryText);

          const stampClass = result.plausible_match ? 'match' : 'no-match';
          const stampText = result.plausible_match ? 'PLAUSIBLE MATCH' : 'LOW PLAUSIBILITY';

          verdictContainer.innerHTML = `
            <div class="verdict-stamp ${stampClass}">
              ${stampText}
            </div>
            <p class="verdict-stamp-explanation">${result.explanation}</p>
          `;
        } catch (err) {
          verdictContainer.innerHTML = `
            <p style="color:var(--accent-rose); font-size:11px; font-family:var(--font-mono);">
              Audit failed. Please try again.
            </p>
          `;
        } finally {
          btn.disabled = false;
        }
      });
    });

    lucide.createIcons();
  }

  // Filter triggers
  filterSpecialty.addEventListener('change', renderLawyers);
  filterPricing.addEventListener('change', renderLawyers);
  filterExperience.addEventListener('change', renderLawyers);

  btnClearCaseFilter.addEventListener('click', () => {
    state.analyzedCategory = null;
    filterSpecialty.value = 'all';
    activeCaseFilterTag.style.display = 'none';
    caseSearchBar.value = '';
    searchRecommendationBox.style.display = 'none';
    renderLawyers();
  });

  // Configurable Keyword Dictionary for Case search matching
  const SEARCH_KEYWORDS_DICTIONARY = {
    tenancy: ['landlord', 'tenant', 'eviction', 'rent', 'lease', 'deposit', 'housing', 'apartment', 'habitability'],
    employment: ['salary', 'wages', 'fired', 'termination', 'employer', 'employee', 'labour', 'overtime', 'wage', 'job', 'boss'],
    contract: ['contract', 'agreement', 'invoice', 'freelance', 'payment', 'breach', 'nda', 'signing', 'intellectual', 'ip'],
    family: ['divorce', 'custody', 'marriage', 'alimony', 'family', 'wife', 'husband', 'child'],
    property: ['land', 'registry', 'property', 'plot', 'mutation'],
    consumer: ['refund', 'defective', 'warranty', 'online purchase', 'car', 'dealer', 'lemon', 'consumer', 'billing', 'scam'],
    criminal: ['theft', 'assault', 'fraud', 'police', 'fir', 'criminal', 'arrest', 'bail', 'jail', 'robbery', 'court case'],
    corporate: ['corporate', 'company', 'incorporation', 'shares', 'partnership']
  };

  const SPECIALTY_LABELS_MAP = {
    tenancy: 'Tenancy & Housing Law',
    employment: 'Employment & Labor Law',
    contract: 'Contracts & Freelance',
    consumer: 'Consumer Protection',
    family: 'Family Law & Divorce',
    criminal: 'Criminal Defense',
    property: 'Property Law',
    corporate: 'Corporate Law'
  };

  const STOP_WORDS_SET = new Set(['a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves']);

  // ==================== DYNAMIC CASE SEARCH ENGINE ====================
  function determineBestCategory(query) {
    if (!query) return null;
    const queryLower = query.toLowerCase();
    let maxScore = 0;
    let bestCategory = null;

    for (const [cat, keywords] of Object.entries(SEARCH_KEYWORDS_DICTIONARY)) {
      let score = 0;
      keywords.forEach(kw => {
        const hasSpace = kw.includes(' ');
        if (hasSpace) {
          if (queryLower.includes(kw)) {
            score++;
          }
        } else {
          const regex = new RegExp('\\b' + kw + '\\b');
          if (regex.test(queryLower)) {
            score++;
          }
        }
      });
      if (score > maxScore) {
        maxScore = score;
        bestCategory = cat;
      }
    }
    return bestCategory;
  }

  function executeCaseSearch() {
    const query = caseSearchBar.value.trim().toLowerCase();
    if (!query) {
      searchRecommendationBox.style.display = 'none';
      filterSpecialty.value = 'all';
      renderLawyers();
      return;
    }

    const bestCategory = determineBestCategory(query);

    if (bestCategory) {
      const label = SPECIALTY_LABELS_MAP[bestCategory];
      recCategoryName.textContent = label;
      searchRecommendationBox.style.display = 'flex';

      // Ensure the category exists in select options
      const optionExists = Array.from(filterSpecialty.options).some(opt => opt.value === bestCategory);
      if (optionExists) {
        filterSpecialty.value = bestCategory;
      } else {
        filterSpecialty.value = 'all';
      }
      renderLawyers();
    } else {
      searchRecommendationBox.style.display = 'none';
      filterSpecialty.value = 'all';
      renderLawyers();
    }
    lucide.createIcons();
  }

  btnSearchCases.addEventListener('click', executeCaseSearch);
  caseSearchBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      executeCaseSearch();
    }
  });

  // ==================== BOOKING MODAL & WORKSPACE INITIALIZATION ====================
  function openBookingModal(lawyerId) {
    const lawyer = LAWYERS_DATABASE.find(l => l.id === lawyerId);
    if (!lawyer) return;

    state.selectedLawyer = lawyer;

    // Mini profile
    bookingLawyerMini.innerHTML = `
      <div class="avatar">${lawyer.avatarText}</div>
      <div class="mini-info">
        <h4>${lawyer.name}</h4>
        <span>${lawyer.specialtyLabel} • ${lawyer.barNumber}</span>
      </div>
    `;

    // Packages radio select
    modalPackagesContainer.innerHTML = '';
    lawyer.packages.forEach((pkg, index) => {
      const radioDiv = document.createElement('div');
      radioDiv.innerHTML = `
        <input type="radio" name="modal-package-select" id="pkg-rad-${index}" class="package-radio-input" value="${index}" ${index === 0 ? 'checked' : ''}>
        <label for="pkg-rad-${index}" class="package-radio-label">
          <div>
            <span class="pkg-name">${pkg.name}</span>
            <p style="font-size:10px; color:var(--text-muted); margin-top:2px;">${pkg.desc}</p>
          </div>
          <span class="pkg-cost">${pkg.price}</span>
        </label>
      `;
      modalPackagesContainer.appendChild(radioDiv);
    });

    // Date pre-set
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('booking-date').value = tomorrow.toISOString().substring(0, 10);

    bookingModal.style.display = 'flex';
  }

  btnCloseModal.addEventListener('click', () => {
    bookingModal.style.display = 'none';
  });

  // Close modal clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === bookingModal) {
      bookingModal.style.display = 'none';
    }
  });

  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const lawyer = state.selectedLawyer;
    const selectedRadioIndex = document.querySelector('input[name="modal-package-select"]:checked').value;
    const selectedPkg = lawyer.packages[selectedRadioIndex];
    const notes = document.getElementById('booking-notes').value.trim();
    const dateVal = document.getElementById('booking-date').value;
    const modeVal = document.querySelector('input[name="consult-mode"]:checked').value;
    const backupContact = document.getElementById('booking-contact-backup').value.trim();

    // Close Modal
    bookingModal.style.display = 'none';

    state.activeConsultation = {
      brief: notes || `${lawyer.specialtyLabel} Consultation Request`,
      date: dateVal,
      mode: modeVal,
      clientName: state.userProfile ? state.userProfile.name : 'Demo Client',
      lawyerId: lawyer.id
    };
    
    // Save to Turso Database via API
    try {
      await fetch(`${API_BASE}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lawyerId: lawyer.id,
          clientId: state.userProfile ? state.userProfile.id : 'client-demo',
          clientName: state.activeConsultation.clientName,
          brief: state.activeConsultation.brief,
          date: state.activeConsultation.date,
          mode: state.activeConsultation.mode
        })
      });
    } catch (err) {
      console.error("Failed to save booking to database", err);
    }

    // Set Workspace variables
    state.isWorkspaceInitialized = true;
    state.workspaceData.lawyer = lawyer;
    state.workspaceData.caseCategory = lawyer.specialty;
    state.workspaceData.caseTitle = state.isCaseAnalyzed ? state.analyzedData.title : `${lawyer.specialtyLabel} Dispute`;
    state.workspaceData.pricing = {
      name: selectedPkg.name,
      price: selectedPkg.price,
      desc: selectedPkg.desc
    };

    // Load template timeline based on category
    let steps = [];
    if (lawyer.specialty === 'tenancy') {
      steps = [
        { label: `Initial Consultation (${modeVal})`, date: dateVal, status: 'active' },
        { label: 'Demand Letter Drafting', date: 'Scheduled', status: 'pending' },
        { label: 'Wait for Response (10 Days)', date: 'Pending', status: 'pending' },
        { label: 'Prepare Court Filings', date: 'Pending', status: 'pending' }
      ];
    } else if (lawyer.specialty === 'employment') {
      steps = [
        { label: `Consultation (${modeVal})`, date: dateVal, status: 'active' },
        { label: 'Contract Breach Notice', date: 'Scheduled', status: 'pending' },
        { label: 'Mediation & Labor Filing', date: 'Pending', status: 'pending' }
      ];
    } else if (lawyer.specialty === 'family') {
      steps = [
        { label: `Divorce Consultation (${modeVal})`, date: dateVal, status: 'active' },
        { label: 'Separation Agreement Review', date: 'Scheduled', status: 'pending' },
        { label: 'Family Court Petition', date: 'Pending', status: 'pending' }
      ];
    } else if (lawyer.specialty === 'criminal') {
      steps = [
        { label: `Defense Audit (${modeVal})`, date: dateVal, status: 'active' },
        { label: 'Police Discovery Request', date: 'Scheduled', status: 'pending' },
        { label: 'Bail & Charge Hearing', date: 'Pending', status: 'pending' }
      ];
    } else {
      steps = [
        { label: `Consultation (${modeVal})`, date: dateVal, status: 'active' },
        { label: 'Demand Packet Sent', date: 'Scheduled', status: 'pending' },
        { label: 'Settlement Negotiation', date: 'Pending', status: 'pending' }
      ];
    }

    wsRoadmapSteps.innerHTML = '';
    steps.forEach(step => {
      const stepDiv = document.createElement('div');
      stepDiv.className = `roadmap-step-item ${step.status}`;
      stepDiv.innerHTML = `
        <div class="roadmap-dot"></div>
        <span class="roadmap-text">${step.label}</span>
        <span class="roadmap-date">${step.date}</span>
      `;
      wsRoadmapSteps.appendChild(stepDiv);
    });

    // Populate Sidebar values
    wsLawyerAvatar.textContent = lawyer.avatarText;
    wsLawyerName.textContent = lawyer.name;
    wsLawyerRole.textContent = lawyer.specialtyLabel;
    wsPricingTag.textContent = selectedPkg.name;
    wsPricingPrice.textContent = selectedPkg.price;
    wsPricingDesc.textContent = selectedPkg.desc;

    // Reset Chat Messages
    chatMessagesBox.innerHTML = '';

    // Add Welcome messages (simulated conversation flow)
    const welcomeMsg1 = `Hello! I'm ${lawyer.name}. I've successfully received your consultation request. Let's schedule our **${modeVal}** consultation on **${dateVal}**.`;
    const welcomeMsg2 = `I have reviewed your case description summary: <br><em>"${notes}"</em>.<br>In case of any date changes, I have saved your backup contact detail: <strong>${backupContact}</strong>.`;

    appendChatMessage('received', welcomeMsg1, lawyer.avatarText);

    setTimeout(() => {
      appendChatMessage('received', welcomeMsg2, lawyer.avatarText);
    }, 600);

    setTimeout(() => {
      let welcomeMsg3 = '';
      if (modeVal === 'Online') {
        welcomeMsg3 = `For our **Online video consultation**, I'll send a secure meeting URL to this thread. Please upload any contracts, agreements, or pictures in the right sidebar uploader beforehand so I can audit them.`;
      } else {
        welcomeMsg3 = `For our **In-Office consultation**, please note my coordinates. It's best if you upload files (lease, contract) here on the right beforehand, so we can run our AI compliance scanner and save time in person!`;
      }
      appendChatMessage('received', welcomeMsg3, lawyer.avatarText);
    }, 1200);

    // Set initial file counts
    wsDocsCount.textContent = '0';
    uploadedFilesList.innerHTML = `
      <div class="file-list-item" style="border-style: dashed; background: transparent; justify-content: center; color: var(--text-muted); opacity: 0.7;">
        No documents uploaded yet
      </div>
    `;

    // Swap workspace containers
    workspaceEmptyContainer.style.display = 'none';
    workspaceActiveContainer.style.display = 'grid';

    // Show navigation badge alert
    workspaceBadge.style.display = 'inline-block';

    // If logged-in user is a lawyer, refresh their client caseload so the new booking appears
    // (In this demo both client & lawyer share one browser window — this handles cross-role visibility)
    if (typeof renderLawyerCaseload === 'function') {
      renderLawyerCaseload();
    }

    // Go to workspace tab
    switchTab('workspace');
  });

  // Quickstart Demo Workspace
  btnWorkspaceQuickstart.addEventListener('click', () => {
    // Select Neha Sharma and Tenancy package
    state.selectedLawyer = LAWYERS_DATABASE[0];
    const mockFormSubmitEvent = new Event('submit');

    // Populate fake selection
    state.isWorkspaceInitialized = true;
    state.workspaceData.lawyer = LAWYERS_DATABASE[0];
    state.workspaceData.caseCategory = 'tenancy';
    state.workspaceData.caseTitle = 'Security Deposit Recovery Dispute';
    state.workspaceData.pricing = {
      name: 'District Court Prep',
      price: '₹45,000',
      desc: 'Full evidence compilation, witness sheets, and courtroom rehearsal.'
    };

    // Load steps
    const steps = [
      { label: 'Demand Letter Sent', date: 'Completed Jun 24', status: 'complete' },
      { label: 'Await Landlord Response', date: 'Late (Due Jun 29)', status: 'active' },
      { label: 'Assemble Small Claims Suit', date: 'Scheduled', status: 'pending' },
      { label: 'Simulate Court Trial', date: 'Pending', status: 'pending' }
    ];

    wsRoadmapSteps.innerHTML = '';
    steps.forEach(step => {
      const stepDiv = document.createElement('div');
      stepDiv.className = `roadmap-step-item ${step.status}`;
      stepDiv.innerHTML = `
        <div class="roadmap-dot"></div>
        <span class="roadmap-text">${step.label}</span>
        <span class="roadmap-date">${step.date}</span>
      `;
      wsRoadmapSteps.appendChild(stepDiv);
    });

    // Populate Sidebar values
    wsLawyerAvatar.textContent = 'SJ';
    wsLawyerName.textContent = 'Neha Sharma, Esq.';
    wsLawyerRole.textContent = 'Tenancy Specialist';
    wsPricingTag.textContent = 'District Court Prep';
    wsPricingPrice.textContent = '₹45,000';
    wsPricingDesc.textContent = 'Full evidence compilation, witness sheets, and courtroom rehearsal.';

    // Reset Chat Messages
    chatMessagesBox.innerHTML = '';

    // Injected conversation
    appendChatMessage('received', "Hello! I reviewed the photos of the cabinet scratches you uploaded. Those are clearly normal wear and tear under local laws. Let's send the formal demand notice tomorrow. Do you have the landlord's mailing address?", 'SJ');
    appendChatMessage('sent', "Yes, I just added it to the files. It's written at the bottom of page 12 on the lease.", 'ME');
    appendChatMessage('received', "Excellent. I uploaded a copy of the lease agreement here as well. Can you click the 'Scan File' button next to the Lease Agreement PDF on the right sidebar? Let's check if there are other illegal clauses that we should cite to pressure them.", 'SJ');

    // Load mock documents in sidebar
    wsDocsCount.textContent = '1';
    uploadedFilesList.innerHTML = `
      <div class="file-list-item" id="mock-file-lease-item">
        <div class="file-info">
          <i data-lucide="file-text"></i>
          <div class="file-meta-text">
            <span class="file-name">LeaseAgreement.pdf</span>
            <span class="file-size">1.8 MB • Added Jun 25</span>
          </div>
        </div>
        <div class="file-actions">
          <button class="btn-file-scan" data-doc="lease">Scan File</button>
        </div>
      </div>
    `;

    // Swap workspace containers
    workspaceEmptyContainer.style.display = 'none';
    workspaceActiveContainer.style.display = 'grid';

    // Hook scanning buttons
    const scanBtn = uploadedFilesList.querySelector('.btn-file-scan');
    scanBtn.addEventListener('click', () => {
      triggerDocumentAudit('lease');
    });

    // Go to workspace tab
    switchTab('workspace');
    lucide.createIcons();
  });

  // ==================== MESSAGING WORKSPACE SIMULATION ====================
  function renderWorkspaceChat() {
    if (!chatMessagesBox) return;
    chatMessagesBox.innerHTML = '';

    if (!state.activeConsultation || !state.activeConsultation.chat) return;

    const advocateText = state.workspaceData.lawyer ? state.workspaceData.lawyer.avatarText : 'SJ';

    state.activeConsultation.chat.forEach(msg => {
      const sender = msg.sender === 'client' ? 'sent' : 'received';

      const msgWrapper = document.createElement('div');
      msgWrapper.className = `msg-wrapper ${sender}`;

      const time = msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let bubbleHTML = '';

      if (msg.type === 'file') {
        // File message — image or document
        const isImage = msg.fileType && msg.fileType.startsWith('image/');
        if (isImage && msg.fileDataUrl) {
          bubbleHTML = `
            <div class="msg-img-bubble">
              <img src="${msg.fileDataUrl}" alt="${msg.fileName}" title="Click to download">
            </div>
          `;
        } else {
          const ext = (msg.fileName || '').split('.').pop().toUpperCase();
          const extColors = { PDF: '#f43f5e', DOCX: '#3b82f6', DOC: '#3b82f6', TXT: '#8b5cf6', PNG: '#10b981', JPG: '#10b981', JPEG: '#10b981' };
          const iconColor = extColors[ext] || 'var(--accent-cyan)';
          bubbleHTML = `
            <div class="msg-file-bubble">
              <div class="file-icon" style="color:${iconColor}">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div class="file-details">
                <span class="file-name">${msg.fileName || 'Attachment'}</span>
                <span class="file-size">${msg.fileSize || ''} • Tap to download</span>
              </div>
            </div>
          `;
        }
      } else {
        bubbleHTML = `<div class="msg-bubble">${msg.text}</div>`;
      }

      msgWrapper.innerHTML = `${bubbleHTML}<span class="msg-timestamp">${time}</span>`;
      chatMessagesBox.appendChild(msgWrapper);
    });
    chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
  }

  function appendChatMessage(sender, text, avatar) {
    if (!state.activeConsultation) return;
    if (!state.activeConsultation.chat) {
      state.activeConsultation.chat = [];
    }

    const role = sender === 'sent' ? 'client' : 'lawyer';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    state.activeConsultation.chat.push({
      sender: role,
      text: text,
      time: time
    });

    renderWorkspaceChat();

    // Reload active lawyer view client detail if viewing same client
    if (state.userType === 'lawyer' && activeClient && (activeClient.id === 'client-current-user' || activeClient.name === state.userProfile.name)) {
      loadActiveClientDetail(activeClient);
    }
  }

  chatInputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatMessageInput.value.trim();
    if (!text) return;

    if (!state.activeConsultation) {
      state.activeConsultation = {
        brief: 'Consultation Ingress',
        date: new Date().toISOString().substring(0, 10),
        mode: 'Online',
        chat: []
      };
    }
    if (!state.activeConsultation.chat) {
      state.activeConsultation.chat = [];
    }

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    state.activeConsultation.chat.push({
      sender: 'client',
      text: text,
      time: time
    });

    chatMessageInput.value = '';
    renderWorkspaceChat();

    // Reload active lawyer view client detail if viewing same client
    if (state.userType === 'lawyer' && activeClient && (activeClient.id === 'client-current-user' || activeClient.name === state.userProfile.name)) {
      loadActiveClientDetail(activeClient);
    }

    // Create lawyer reply trigger
    const advocateText = state.workspaceData.lawyer ? state.workspaceData.lawyer.avatarText : 'SJ';

    // Simulate "typing..." element
    const typingBubble = document.createElement('div');
    typingBubble.className = 'msg-wrapper received typing-msg';
    typingBubble.innerHTML = `
      <div class="msg-bubble" style="padding: 10px 14px; opacity: 0.6;">
        <span style="font-style: italic;">Advocate typing...</span>
      </div>
    `;
    chatMessagesBox.appendChild(typingBubble);
    chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;

    setTimeout(() => {
      typingBubble.remove();

      let matchedResponse = "I hear you. Let me check our evidence files. Feel free to upload any screenshots or invoices so I can verify details.";
      const query = text.toLowerCase();

      for (let item of MOCK_CHAT_ANSWERS) {
        if (item.keywords.some(kw => query.includes(kw))) {
          matchedResponse = item.response;
          break;
        }
      }

      state.activeConsultation.chat.push({
        sender: 'lawyer',
        text: matchedResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      renderWorkspaceChat();

      // Reload active lawyer view client detail if viewing same client
      if (state.userType === 'lawyer' && activeClient && (activeClient.id === 'client-current-user' || activeClient.name === state.userProfile.name)) {
        loadActiveClientDetail(activeClient);
      }
    }, 1200);
  });

  // ==================== CHAT FILE ATTACH & DRAG-DROP ====================
  const chatContainer = document.querySelector('.workspace-chat-container');
  const chatDragOverlay = document.getElementById('chat-drag-overlay');
  const chatFileInput = document.getElementById('chat-file-input');

  // Helper: format file size
  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Helper: process and send a file as a chat message
  function sendFileInChat(file) {
    if (!file) return;
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      const toast = document.createElement('div');
      toast.style.cssText = `position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:rgba(244,63,94,0.15);border:1px solid rgba(244,63,94,0.4);border-radius:10px;padding:12px 20px;color:var(--text-primary);font-size:12px;font-family:var(--font-mono);z-index:99999;`;
      toast.textContent = `File too large: ${formatFileSize(file.size)} (max 25MB)`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
      return;
    }

    if (!state.activeConsultation) {
      state.activeConsultation = { brief: 'Consultation', date: new Date().toISOString().substring(0, 10), mode: 'Online', chat: [] };
    }
    if (!state.activeConsultation.chat) state.activeConsultation.chat = [];

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();

    reader.onload = (ev) => {
      const dataUrl = ev.target.result;

      // Push file message to chat
      state.activeConsultation.chat.push({
        sender: 'client',
        type: 'file',
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileType: file.type,
        fileDataUrl: isImage ? dataUrl : null,
        time
      });

      renderWorkspaceChat();

      // Also add to right-side document list
      addFileToDocumentSidebar(file, dataUrl);

      // Auto-reply from advocate
      const typingBubble = document.createElement('div');
      typingBubble.className = 'msg-wrapper received typing-msg';
      typingBubble.innerHTML = `<div class="msg-bubble" style="padding:10px 14px;opacity:0.6;"><span style="font-style:italic;">Advocate typing...</span></div>`;
      chatMessagesBox.appendChild(typingBubble);
      chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;

      setTimeout(() => {
        typingBubble.remove();
        const replyText = isImage
          ? `Thanks for the image — I can see the document clearly. I'll review it and note any relevant clauses for our case.`
          : `I've received your file "<strong>${file.name}</strong>". I'll review it shortly. You can also run the AI compliance scan from the Documents panel on the right.`;

        state.activeConsultation.chat.push({
          sender: 'lawyer',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        renderWorkspaceChat();
      }, 1400);
    };

    reader.readAsDataURL(file);
  }

  // Helper: add a real file to the documents sidebar
  function addFileToDocumentSidebar(file, dataUrl) {
    if (!uploadedFilesList || !wsDocsCount) return;
    const existingId = `user-file-${file.name.replace(/\W/g, '_')}`;
    if (document.getElementById(existingId)) return; // already added

    const currentCount = parseInt(wsDocsCount.textContent || '0', 10);
    wsDocsCount.textContent = currentCount + 1;

    const ext = file.name.split('.').pop().toUpperCase();
    const isImage = file.type.startsWith('image/');
    const itemEl = document.createElement('div');
    itemEl.className = 'file-list-item';
    itemEl.id = existingId;
    itemEl.innerHTML = `
      <div class="file-info">
        <i data-lucide="${isImage ? 'image' : 'file-text'}"></i>
        <div class="file-meta-text">
          <span class="file-name">${file.name}</span>
          <span class="file-size">${formatFileSize(file.size)} • Just added</span>
        </div>
      </div>
      <div class="file-actions">
        ${isImage
          ? `<a href="${dataUrl}" download="${file.name}" class="btn-file-scan" style="text-decoration:none;">Download</a>`
          : `<button class="btn-file-scan" onclick="alert('AI scan is available for mock documents. Upload LeaseAgreement.pdf or FreelanceContract.docx to run the full scan.')">Scan File</button>`
        }
      </div>
    `;
    uploadedFilesList.insertBefore(itemEl, uploadedFilesList.firstChild);
    lucide.createIcons();
  }

  // 1. Paperclip attach button → open file picker
  if (chatFileInput) {
    chatFileInput.addEventListener('change', () => {
      if (chatFileInput.files && chatFileInput.files.length > 0) {
        Array.from(chatFileInput.files).forEach(f => sendFileInChat(f));
        chatFileInput.value = ''; // reset so same file can be picked again
      }
    });
  }

  // 2. Drag over the CHAT CONTAINER → show overlay
  if (chatContainer) {
    chatContainer.addEventListener('dragenter', (e) => {
      if (e.dataTransfer.types.includes('Files')) {
        chatContainer.classList.add('chat-dragging');
        if (chatDragOverlay) {
          chatDragOverlay.style.display = 'flex';
          lucide.createIcons();
        }
      }
    });

    chatContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    chatContainer.addEventListener('dragleave', (e) => {
      // Only hide if we actually left the container (not just moved over a child)
      if (!chatContainer.contains(e.relatedTarget)) {
        chatContainer.classList.remove('chat-dragging');
        if (chatDragOverlay) chatDragOverlay.style.display = 'none';
      }
    });

    chatContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      chatContainer.classList.remove('chat-dragging');
      if (chatDragOverlay) chatDragOverlay.style.display = 'none';

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        Array.from(files).forEach(f => sendFileInChat(f));
      }
    });
  }

  // ==================== SECURE FILES & CLAUSE AUDITOR ====================
  // Mock file picker clicks
  mockDocBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const docType = btn.getAttribute('data-doc');
      addMockFileToWorkspace(docType);
    });
  });

  // Drag over dropzone
  docUploadDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    docUploadDropzone.classList.add('dragover');
  });

  docUploadDropzone.addEventListener('dragleave', () => {
    docUploadDropzone.classList.remove('dragover');
  });

  docUploadDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    docUploadDropzone.classList.remove('dragover');

    // Simulate random file upload
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const randomFile = files[0];
      const isLease = randomFile.name.toLowerCase().includes('lease') || randomFile.name.toLowerCase().includes('rental');
      const docType = isLease ? 'lease' : 'freelance';
      addMockFileToWorkspace(docType);
    }
  });

  function addMockFileToWorkspace(docType) {
    const data = MOCK_CONTRACT_AUDITS[docType];
    if (!data) return;

    // Check if file already added
    const existing = document.getElementById(`mock-file-${docType}-item`);
    if (existing) {
      alert(`Document "${data.fileName}" is already in your workspace.`);
      return;
    }

    // Remove empty placeholder if first file
    const docItems = uploadedFilesList.querySelectorAll('.file-list-item');
    if (docItems.length === 1 && docItems[0].textContent.includes('No documents')) {
      uploadedFilesList.innerHTML = '';
    }

    const fileDiv = document.createElement('div');
    fileDiv.className = 'file-list-item';
    fileDiv.id = `mock-file-${docType}-item`;
    fileDiv.innerHTML = `
      <div class="file-info">
        <i data-lucide="file-text"></i>
        <div class="file-meta-text">
          <span class="file-name">${data.fileName}</span>
          <span class="file-size">${data.fileSize} • Added just now</span>
        </div>
      </div>
      <div class="file-actions">
        <button class="btn-file-scan" data-doc="${docType}">Scan File</button>
      </div>
    `;

    uploadedFilesList.appendChild(fileDiv);

    // Update count
    const totalCount = uploadedFilesList.querySelectorAll('.file-list-item').length;
    wsDocsCount.textContent = totalCount;

    // Add scan listener
    const scanBtn = fileDiv.querySelector('.btn-file-scan');
    scanBtn.addEventListener('click', () => {
      triggerDocumentAudit(docType);
    });

    lucide.createIcons();

    // Trigger advocate comment in chat
    setTimeout(() => {
      const lawyer = state.workspaceData.lawyer ? state.workspaceData.lawyer.avatarText : 'SJ';
      appendChatMessage('received', `I noticed you uploaded ${data.fileName}. Please click the "Scan File" button next to it. It will highlight standard violations and suggest redlines instantly.`, lawyer);
    }, 1000);
  }

  function triggerDocumentAudit(docType) {
    const data = MOCK_CONTRACT_AUDITS[docType];
    if (!data) return;

    // Update uploader area to show scanning state
    const originalText = docUploadDropzone.innerHTML;
    docUploadDropzone.innerHTML = `
      <div class="loading-ring" style="width:36px; height:36px; border-width:3px; margin:0 auto 10px;"></div>
      <p style="font-size:12px; font-weight:700;">Auditing clauses for state compliance...</p>
    `;

    setTimeout(() => {
      // Revert dropzone text
      docUploadDropzone.innerHTML = originalText;
      lucide.createIcons();

      // Show Auditor Panel
      auditFileName.textContent = data.fileName;
      auditScore.textContent = data.score;

      // Select badge styling
      if (docType === 'lease') {
        auditScore.className = 'pill-tag text-rose';
      } else {
        auditScore.className = 'pill-tag text-amber';
      }

      // Populate clauses
      auditClausesBox.innerHTML = '';
      data.clauses.forEach((clause, index) => {
        const clauseDiv = document.createElement('div');
        clauseDiv.className = 'audit-clause-card';
        clauseDiv.style.borderLeftColor = clause.severity === 'warning' ? 'var(--accent-rose)' : 'var(--accent-amber)';
        clauseDiv.innerHTML = `
          <div class="clause-header">
            <span class="clause-num">${clause.num}</span>
            <span class="clause-severity ${clause.severity}">${clause.severityText}</span>
          </div>
          <div class="original-clause-text">${clause.original}</div>
          <div class="clause-explanation"><strong>Analysis:</strong> ${clause.explanation}</div>
          <div class="clause-remedy"><strong>Fix Code:</strong> ${clause.remedy}</div>
        `;
        auditClausesBox.appendChild(clauseDiv);
      });

      clauseAuditorContainer.style.display = 'block';

      // Push advocate text in chat
      setTimeout(() => {
        const lawyer = state.workspaceData.lawyer ? state.workspaceData.lawyer.avatarText : 'SJ';
        if (docType === 'lease') {
          appendChatMessage('received', "Wow. The auditor flagged the late fees and entry clauses. They are illegal under our civil code. I'll include citations for these in the demand draft. That gives us massive leverage.", lawyer);
        } else {
          appendChatMessage('received', "The IP transfer clause is highly predatory. They are asking for full ownership without paying you. We must demand changing Section 4(a) to link IP transfer to invoice clearance.", lawyer);
        }
      }, 800);

    }, 1500);
  }

  btnCloseAudit.addEventListener('click', () => {
    clauseAuditorContainer.style.display = 'none';
  });

  // ==================== FAQ ACCORDION LOGIC ====================
  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const item = question.parentElement;
      const isOpen = item.classList.contains('open');

      // Close all first
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('open');
      });

      // Toggle current
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });

  // ==================== CLAUDE API AUDITOR & SEMANTIC FALLBACK ====================
  async function checkPlausibilityWithClaude(lawyer, queryText) {
    const apiKey = localStorage.getItem('ANTHROPIC_API_KEY') || '';

    if (apiKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'dangerously-allow-browser': 'true'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            system: 'You are a legal matching auditor. Compare the user\'s legal dispute description with the advocate\'s verified cases. Return ONLY a JSON object: { "plausible_match": boolean, "explanation": "one sentence explaining why it is or is not a match" }.',
            messages: [
              {
                role: 'user',
                content: `Advocate cases: ${JSON.stringify(lawyer.verified_cases)}\nUser dispute: "${queryText}"`
              }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const textResponse = data.content[0].text;
          const parsed = JSON.parse(textResponse.trim());
          return parsed;
        }
      } catch (e) {
        console.error('Claude API call failed, falling back to local analysis:', e);
      }
    }

    // Mock API Fallback Algorithm (keyword matching)
    await new Promise(resolve => setTimeout(resolve, 800));

    const q = queryText.toLowerCase();

    // Check keywords overlap
    let match = false;
    let matchCount = 0;
    let matchedKeywords = [];

    const specialtyKeywords = {
      tenancy: ['landlord', 'tenant', 'deposit', 'rent', 'lease', 'evict', 'eviction', 'roommate', 'apartment', 'housing', 'mold', 'repair', 'habitability'],
      employment: ['wage', 'salary', 'invoice', 'unpaid', 'pay', 'overtime', 'freelance', 'contractor', 'boss', 'designer', 'work', 'job', 'severance'],
      contract: ['contract', 'nda', 'agreement', 'signing', 'clause', 'ip', 'breach', 'non-compete', 'shareholder'],
      consumer: ['car', 'warranty', 'dealer', 'lemon', 'purchase', 'bill', 'billing', 'scam', 'credit', 'reporting', 'refund'],
      criminal: ['theft', 'dui', 'police', 'arrest', 'bail', 'jail', 'warrant', 'charge', 'misdemeanor', 'citation', 'speeding'],
      family: ['divorce', 'custody', 'marriage', 'alimony', 'child', 'separation', 'marital', 'asset', 'family']
    };

    const targetKeywords = specialtyKeywords[lawyer.specialty] || [];
    targetKeywords.forEach(kw => {
      if (q.includes(kw)) {
        matchCount++;
        matchedKeywords.push(kw);
      }
    });

    if (matchCount >= 1) {
      match = true;
    }

    if (match) {
      return {
        plausible_match: true,
        explanation: `Plausible Match: Handles similar issues. Matched keywords: ${matchedKeywords.join(', ')}. Advocate has successfully resolved ${lawyer.verified_cases[0].case_type} in District Court.`
      };
    } else {
      return {
        plausible_match: false,
        explanation: `Low Plausibility: No keyword overlap found. This advocate's verified track record is focused primarily on ${lawyer.specialtyLabel}.`
      };
    }
  }

  // Handle Official Advocate Signup Form Submit
  advocateSignupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('signup-lawyer-name').value.trim();
    const city = document.getElementById('signup-lawyer-city').value.trim();
    const stateCode = document.getElementById('signup-lawyer-state').value;
    const enrolment = document.getElementById('signup-lawyer-enrolment').value.trim();
    const specialty = document.getElementById('signup-lawyer-specialty').value;
    const exp = parseInt(document.getElementById('signup-lawyer-exp').value);
    const verdictContainer = document.getElementById('signup-ai-verdict-container');
    const submitBtn = advocateSignupForm.querySelector('button[type="submit"]');

    // 1. Format Validation
    const enrolmentRegex = new RegExp(`^${stateCode}\\/(\\d+)\\/(\\d{4})$`, 'i');
    const match = enrolment.match(enrolmentRegex);

    if (!match) {
      alert(`Invalid Bar Enrolment number format! For the selected State Bar, it must match the pattern: ${stateCode}/[digits]/[4-digit-year] (e.g., ${stateCode}/1234/2015).`);
      return;
    }

    const number = parseInt(match[1]);
    const enrolmentYear = parseInt(match[2]);
    const currentYear = 2026;

    // Year limits: not in the future, not before 1961 (Advocates Act year)
    if (enrolmentYear > currentYear) {
      alert(`Enrolment year (${enrolmentYear}) cannot be in the future!`);
      return;
    }
    if (enrolmentYear < 1961) {
      alert(`Enrolment year (${enrolmentYear}) cannot be before the Advocates Act of 1961!`);
      return;
    }

    const maxExp = currentYear - enrolmentYear;
    if (exp > maxExp) {
      alert(`Invalid experience! Claimed experience (${exp} years) cannot exceed the time since your enrolment year ${enrolmentYear} (maximum possible is ${maxExp} years).`);
      return;
    }

    // 2. AI Consistency Check (Claude API or fallback)
    submitBtn.disabled = true;
    verdictContainer.style.display = 'block';
    verdictContainer.innerHTML = `
      <div style="font-family: var(--font-mono); font-size:11px; color: var(--text-secondary); display: flex; align-items:center; gap:6px;">
        <span class="pulse" style="width:8px; height:8px; background:var(--color-thread); border-radius:50%;"></span>
        Verifying enrolment consistency with Claude...
      </div>
    `;

    try {
      const checkResult = await checkEnrolmentConsistencyWithClaude(name, stateCode, enrolment, exp);

      const stampClass = checkResult.plausible ? 'match' : 'no-match';
      const stampText = checkResult.plausible ? 'SANITY CHECK PASSED' : 'CONSISTENCY CONFLICT';

      verdictContainer.innerHTML = `
        <div class="verdict-stamp ${stampClass}" style="margin-bottom: 6px;">
          ${stampText}
        </div>
        <p class="verdict-stamp-explanation" style="font-size: 11px; margin-bottom: 12px;">${checkResult.note}</p>
      `;

      if (!checkResult.plausible) {
        // Allow them to correct it if it fails
        submitBtn.disabled = false;
        return;
      }

      // If check passes, register the advocate (with Pending status)
      try {
        const response = await fetch(`${API_BASE}/api/lawyers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            gender: 'Not Specified',
            city,
            position: 'District Court',
            specialty,
            exp,
            fought: Math.max(5, exp * 4),
            ongoing: Math.max(1, Math.round(exp / 2)),
            fees: '₹1,500',
            contactInfo: onboardingContactVal || enrolment,
            avatarBase64: null
          })
        });

        if (!response.ok) {
          if (response.status === 409) {
            // Account already exists — auto login and redirect to dashboard
            await autoLoginExistingAccount(onboardingContactVal || enrolment, 'lawyer');
            return;
          }
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to register advocate profile');
        }

        const result = await response.json();
        const savedLawyer = result.lawyer;

        // Prepend to lawyers database
        LAWYERS_DATABASE.unshift(savedLawyer);

        // Update state
        state.userType = 'lawyer';
        state.userProfile = savedLawyer;

        // Update Status UI in header
        const userRoleEl = document.querySelector('.user-role');
        const statusTextEl = document.querySelector('.status-text');
        const statusIndicator = document.querySelector('.status-indicator');

        userRoleEl.textContent = name;
        statusTextEl.textContent = `${city} • Pending Verification`;
        statusIndicator.className = 'status-indicator';
        statusIndicator.style.backgroundColor = 'var(--text-muted)';
        statusIndicator.style.boxShadow = 'none';

        // Update avatar circle in header status card
        const userStatusCard = document.getElementById('user-status');
        let avatarCircle = userStatusCard.querySelector('.avatar-header-circle');
        if (!avatarCircle) {
          avatarCircle = document.createElement('div');
          avatarCircle.className = 'avatar-header-circle';
          avatarCircle.style.width = '32px';
          avatarCircle.style.height = '32px';
          avatarCircle.style.borderRadius = '50%';
          avatarCircle.style.marginRight = '0';
          avatarCircle.style.overflow = 'hidden';
          avatarCircle.style.background = 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))';
          avatarCircle.style.display = 'flex';
          avatarCircle.style.alignItems = 'center';
          avatarCircle.style.justifyContent = 'center';
          avatarCircle.style.color = 'white';
          avatarCircle.style.fontSize = '10px';
          avatarCircle.style.fontWeight = 'bold';
          userStatusCard.insertBefore(avatarCircle, userStatusCard.firstChild);
        }
        avatarCircle.textContent = savedLawyer.avatarText;

        // Reset forms and hide overlay
        advocateSignupForm.reset();
        verdictContainer.style.display = 'none';
        onboardingOverlay.style.display = 'none';

        // Update nav tabs for lawyer and redirect to caseload
        updateNavForUserRole();
        linkSwitchRole.style.display = 'inline-block';
        switchTab('workspace');
        persistSession();
        checkDigiLockerLock();
        submitBtn.disabled = false;
      } catch (err) {
        console.warn('Backend advocate registration failed, falling back to local session:', err);

        const newLawyer = {
          id: name.toLowerCase().replace(/[^a-z]/g, '-'),
          name: name,
          gender: 'Not Specified',
          specialty: specialty,
          specialtyLabel: document.querySelector(`#signup-lawyer-specialty option[value="${specialty}"]`).textContent,
          avatarText: name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
          avatarBase64: null,
          rating: '4.8',
          casesHandled: Math.max(5, exp * 4),
          ongoingCases: Math.max(1, Math.round(exp / 2)),
          bio: `Registered Advocate in ${city}, ${stateCode}. Practice focused on ${specialty} disputes. Profile pending background verification.`,
          barNumber: enrolment,
          contactInfo: onboardingContactVal || enrolment,
          packages: [
            { name: 'Case Assessment Consultation', price: '₹1,500', desc: 'Brief evaluation of legal options and merits.' }
          ],
          verified_cases: [
            { case_type: `Pending Case Audit`, year: 2025, court_level: "District Court", role: "Petitioner's Counsel" }
          ],
          status: 'Pending Verification'
        };

        LAWYERS_DATABASE.unshift(newLawyer);

        state.userType = 'lawyer';
        state.userProfile = newLawyer;

        // Update UI
        const userRoleEl = document.querySelector('.user-role');
        const statusTextEl = document.querySelector('.status-text');
        const statusIndicator = document.querySelector('.status-indicator');

        userRoleEl.textContent = name;
        statusTextEl.textContent = `${city} • Pending Verification`;
        statusIndicator.className = 'status-indicator';
        statusIndicator.style.backgroundColor = 'var(--text-muted)';
        statusIndicator.style.boxShadow = 'none';

        const userStatusCard = document.getElementById('user-status');
        let avatarCircle = userStatusCard.querySelector('.avatar-header-circle');
        if (!avatarCircle) {
          avatarCircle = document.createElement('div');
          avatarCircle.className = 'avatar-header-circle';
          avatarCircle.style.width = '32px';
          avatarCircle.style.height = '32px';
          avatarCircle.style.borderRadius = '50%';
          avatarCircle.style.marginRight = '0';
          avatarCircle.style.overflow = 'hidden';
          avatarCircle.style.background = 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))';
          avatarCircle.style.display = 'flex';
          avatarCircle.style.alignItems = 'center';
          avatarCircle.style.justifyContent = 'center';
          avatarCircle.style.color = 'white';
          avatarCircle.style.fontSize = '10px';
          avatarCircle.style.fontWeight = 'bold';
          userStatusCard.insertBefore(avatarCircle, userStatusCard.firstChild);
        }
        avatarCircle.textContent = newLawyer.avatarText;

        // Reset forms and hide overlay
        advocateSignupForm.reset();
        verdictContainer.style.display = 'none';
        onboardingOverlay.style.display = 'none';

        // Update nav tabs for lawyer and redirect to caseload
        updateNavForUserRole();
        linkSwitchRole.style.display = 'inline-block';
        switchTab('workspace');
        persistSession();
        checkDigiLockerLock();
        submitBtn.disabled = false;
      }

    } catch (error) {
      console.error(error);
      verdictContainer.innerHTML = `<p style="color:var(--accent-rose); font-size:11px;">Verification check failed. Please check your inputs.</p>`;
      submitBtn.disabled = false;
    }
  });

  // Claude Enrolment Consistency Sanity-Check
  async function checkEnrolmentConsistencyWithClaude(name, stateCode, enrolment, exp) {
    const apiKey = localStorage.getItem('ANTHROPIC_API_KEY') || '';

    if (apiKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'dangerously-allow-browser': 'true'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            system: 'You are a bar credential sanity-checker. Check if the claimed years of experience align with the enrolment year extracted from the bar council number. Format is STATE_CODE/NUMBER/YEAR (e.g. MAH/1234/2015 implies enrolment in 2015). Current year is 2026. A lawyer cannot have more years of experience than the time elapsed since their enrolment. Return ONLY a JSON object: { "plausible": boolean, "note": "one short sentence explaining the alignment check" }.',
            messages: [
              {
                role: 'user',
                content: `Advocate Name: ${name}\nState Bar: ${stateCode}\nBar Enrolment: ${enrolment}\nClaimed Experience: ${exp} years`
              }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.content[0].text;
          return JSON.parse(text.trim());
        }
      } catch (e) {
        console.error('Claude API enrolment check failed, falling back to local verification:', e);
      }
    }

    // Mock local verification logic
    await new Promise(resolve => setTimeout(resolve, 1000));

    const parts = enrolment.split('/');
    const enrolmentYear = parseInt(parts[2]);
    const maxExp = 2026 - enrolmentYear;

    if (exp <= maxExp && exp >= 0) {
      return {
        plausible: true,
        note: `Verification pass: Enrolment year (${enrolmentYear}) aligns with claimed experience of ${exp} years (maximum possible is ${maxExp} years).`
      };
    } else {
      return {
        plausible: false,
        note: `Conflict found: Enrolment year (${enrolmentYear}) does not support claimed experience of ${exp} years (only ${maxExp} years elapsed since enrolment).`
      };
    }
  }

  // Dynamic caseload state for Lawyer Dashboard
  let caseloadClients = [
    {
      id: 'client-rahul-verma',
      name: 'Rahul Verma',
      issue: 'Tenant Security Deposit Dispute',
      description: 'Landlord refusing to refund deposit of ₹1,50,000 claiming wear and tear. Lease ended June 1st.',
      date: '2026-07-01',
      mode: 'Online Consultation',
      status: 'Pending Consultation',
      docs: [
        { name: 'LeaseAgreement.pdf', size: '1.2 MB', scanned: false }
      ],
      chat: [
        { sender: 'client', text: 'Hello Advocate, I uploaded my lease agreement. Please let me know if we can file a small claims action.' },
        { sender: 'system', text: 'Secured case space initialized under legal privilege.' }
      ]
    },
    {
      id: 'client-meera-nair',
      name: 'Meera Nair',
      issue: 'Unpaid Freelance Invoice Claim',
      description: 'Client defaulted on payment of ₹2,40,000 for mobile app UI designs completed 3 months ago.',
      date: '2026-07-03',
      mode: 'Offline Meeting',
      status: 'Active Review',
      docs: [
        { name: 'ServiceContract.pdf', size: '840 KB', scanned: false }
      ],
      chat: [
        { sender: 'client', text: 'Advocate, they sent a cease and desist because I paused their production server. What are my rights?' },
        { sender: 'lawyer', text: 'Under state contract code, you have a lien on your work products if unpaid. Let me review your contract clauses.' }
      ]
    }
  ];

  function updateNavForUserRole() {
    const role = state.userType; // 'client' or 'lawyer'
    const tabAnalyzer = document.getElementById('tab-btn-analyzer');
    const tabMatchmaker = document.getElementById('tab-btn-matchmaker');
    const tabWorkspace = document.getElementById('tab-btn-workspace');
    const tabAcademy = document.getElementById('tab-btn-academy');
    const tabSettings = document.getElementById('tab-btn-settings');
    if (tabSettings) tabSettings.style.display = 'flex';

    if (role === 'lawyer') {
      if (tabAnalyzer) tabAnalyzer.style.display = 'none';
      if (tabMatchmaker) tabMatchmaker.style.display = 'none';
      if (tabWorkspace) {
        tabWorkspace.innerHTML = `<i data-lucide="folder-git-2"></i> Client Caseload`;
        tabWorkspace.style.display = 'flex';
      }
      if (tabAcademy) {
        tabAcademy.innerHTML = `<i data-lucide="shield-alert"></i> Lawyer Toolkit`;
        tabAcademy.style.display = 'flex';
      }
      document.getElementById('client-academy-view').style.display = 'none';
      document.getElementById('lawyer-toolkit-view').style.display = 'block';
      lucide.createIcons();

      // Populate dropdowns in toolkit
      const vSelect = document.getElementById('vakalatnama-client');
      const hSelect = document.getElementById('hearing-client');
      const bSelect = document.getElementById('bill-client');
      if (vSelect && hSelect && bSelect) {
        vSelect.innerHTML = '';
        hSelect.innerHTML = '';
        bSelect.innerHTML = '';

        // Build merged list: hardcoded + any new booking
        const allDropdownClients = [...caseloadClients];
        if (state.activeConsultation) {
          const bookedName = state.userProfile ? state.userProfile.name : 'New Client (Booked)';
          const alreadyExists = allDropdownClients.some(c => c.id === 'client-current-user');
          if (!alreadyExists) {
            allDropdownClients.unshift({
              id: 'client-current-user',
              name: bookedName,
              issue: state.activeConsultation.brief
            });
          }
        }

        allDropdownClients.forEach(c => {
          const opt1 = document.createElement('option');
          opt1.value = c.name;
          opt1.textContent = `${c.name} (${c.issue})`;
          vSelect.appendChild(opt1);

          const opt2 = document.createElement('option');
          opt2.value = c.name;
          opt2.textContent = c.name;
          hSelect.appendChild(opt2);

          const opt3 = document.createElement('option');
          opt3.value = c.id;
          opt3.textContent = c.name;
          bSelect.appendChild(opt3);
        });
      }

      // Update workspace layout for lawyer
      document.getElementById('workspace-empty-container').style.display = 'none';
      document.getElementById('workspace-active-container').style.display = 'none';
      document.getElementById('lawyer-caseload-container').style.display = 'grid';

      renderLawyerCaseload();
    } else {
      // client
      if (tabAnalyzer) tabAnalyzer.style.display = 'flex';
      if (tabMatchmaker) tabMatchmaker.style.display = 'flex';
      if (tabWorkspace) {
        tabWorkspace.innerHTML = `<i data-lucide="folder-git-2"></i> Case Workspace`;
        tabWorkspace.style.display = 'flex';
      }
      if (tabAcademy) {
        tabAcademy.innerHTML = `<i data-lucide="book-open"></i> Know Your Rights`;
        tabAcademy.style.display = 'flex';
      }
      document.getElementById('client-academy-view').style.display = 'block';
      document.getElementById('lawyer-toolkit-view').style.display = 'none';
      lucide.createIcons();

      // Check if logged in client has an active case in caseloadClients
      if (state.userProfile) {
        const matchingCaseload = caseloadClients.find(c => c.id === state.userProfile.id || c.name === state.userProfile.name);
        if (matchingCaseload) {
          state.activeConsultation = {
            brief: matchingCaseload.issue,
            date: matchingCaseload.date,
            mode: matchingCaseload.mode,
            chat: matchingCaseload.chat
          };
          state.isWorkspaceInitialized = true;
          state.workspaceData.lawyer = LAWYERS_DATABASE[0]; // Neha Sharma
          state.workspaceData.caseCategory = 'tenancy';
          state.workspaceData.caseTitle = matchingCaseload.issue;
          state.workspaceData.pricing = {
            name: 'Consultation & Review',
            price: '₹1,500',
            desc: 'Document audit and legal brief preparation.'
          };

          // Render step roadmap
          const steps = [
            { label: 'Demand Letter Sent', date: 'Completed', status: 'complete' },
            { label: 'Review Response', date: 'Active', status: 'active' },
            { label: 'Assemble Suit', date: 'Pending', status: 'pending' }
          ];
          wsRoadmapSteps.innerHTML = '';
          steps.forEach(step => {
            const stepDiv = document.createElement('div');
            stepDiv.className = `roadmap-step-item ${step.status}`;
            stepDiv.innerHTML = `
              <div class="roadmap-dot"></div>
              <span class="roadmap-text">${step.label}</span>
              <span class="roadmap-date">${step.date}</span>
            `;
            wsRoadmapSteps.appendChild(stepDiv);
          });

          // Set sidebar values
          wsLawyerAvatar.textContent = 'SJ';
          wsLawyerName.textContent = 'Neha Sharma, Esq.';
          wsLawyerRole.textContent = 'Tenancy Specialist';
          wsPricingTag.textContent = 'Consultation & Review';
          wsPricingPrice.textContent = '₹1,500';
          wsPricingDesc.textContent = 'Document audit and legal brief preparation.';

          // Populate documents
          wsDocsCount.textContent = matchingCaseload.docs.length.toString();
          uploadedFilesList.innerHTML = '';
          matchingCaseload.docs.forEach(doc => {
            const docDiv = document.createElement('div');
            docDiv.className = 'file-list-item';
            docDiv.innerHTML = `
              <div class="file-info">
                <i data-lucide="file-text"></i>
                <div>
                  <span class="file-name">${doc.name}</span>
                  <span class="file-size">${doc.size}</span>
                </div>
              </div>
              <button class="btn btn-secondary btn-mini btn-scan-clauses">Scan File</button>
            `;
            uploadedFilesList.appendChild(docDiv);
          });

          renderWorkspaceChat();
        }
      }

      // Update workspace layout for client
      document.getElementById('lawyer-caseload-container').style.display = 'none';
      if (state.activeConsultation) {
        document.getElementById('workspace-empty-container').style.display = 'none';
        document.getElementById('workspace-active-container').style.display = 'grid';
        renderWorkspaceChat();
      } else {
        document.getElementById('workspace-empty-container').style.display = 'block';
        document.getElementById('workspace-active-container').style.display = 'none';
      }
    }
  }

  async function renderLawyerCaseload() {
    const listContainer = document.getElementById('lawyer-client-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    // Merge dynamic active consultations if matching this lawyer
    const activeClientsList = [...caseloadClients];
    
    // Fetch bookings from Turso Database
    if (state.userProfile && state.userProfile.id) {
      try {
        const res = await fetch(`${API_BASE}/api/bookings/${state.userProfile.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.bookings && data.bookings.length > 0) {
            data.bookings.forEach((booking, idx) => {
              activeClientsList.unshift({
                id: `client-db-${booking.id}`,
                name: booking.client_name || 'New Client Booking',
                issue: booking.brief,
                description: booking.brief,
                date: booking.date,
                mode: booking.mode,
                status: booking.status || 'New Inquiry',
                docs: [
                  { name: 'CaseSummary.pdf', size: '1.2 MB', scanned: false }
                ],
                chat: [
                  { sender: 'client', text: `Hi, I booked you for: "${booking.brief}". Let's discuss.` }
                ]
              });
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch bookings from DB:", err);
      }
    }

    // Try to load booking from localStorage for fallback demo persistence
    const savedBooking = localStorage.getItem('VAKILSETU_MOCK_BOOKING');
    if (savedBooking && !state.activeConsultation) {
      try {
        state.activeConsultation = JSON.parse(savedBooking);
      } catch (e) {}
    }

    if (state.activeConsultation && (!state.activeConsultation.lawyerId || state.activeConsultation.lawyerId == state.userProfile.id)) {
      const matchExists = activeClientsList.some(c => c.id === 'client-current-user');
      if (!matchExists) {
        if (!state.activeConsultation.chat) {
          state.activeConsultation.chat = [
            { sender: 'client', text: `Hi, I booked you for: "${state.activeConsultation.brief}". Let's discuss.` }
          ];
        }
        activeClientsList.unshift({
          id: 'client-current-user',
          name: state.activeConsultation.clientName || 'New Client Booking',
          issue: state.activeConsultation.brief,
          description: state.activeConsultation.brief,
          date: state.activeConsultation.date,
          mode: state.activeConsultation.mode,
          status: 'New Inquiry',
          docs: [
            { name: 'CaseSummary.pdf', size: '1.2 MB', scanned: false }
          ],
          chat: state.activeConsultation.chat
        });
      }
    }

    activeClientsList.forEach(client => {
      const item = document.createElement('div');
      item.className = 'glass-card client-item-card';
      item.style.padding = '12px';
      item.style.cursor = 'pointer';
      item.style.border = '1px solid rgba(255,255,255,0.05)';
      item.style.transition = 'all 0.2s ease';
      item.style.marginBottom = '8px';
      item.style.borderRadius = '0px'; // file folder look

      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <strong style="font-size:13px; color:white;">${client.name}</strong>
          <span style="font-family:var(--font-mono); font-size:9px; background:rgba(255,255,255,0.04); padding:2px 6px; color:var(--text-secondary); border:1px solid rgba(255,255,255,0.06);">${client.status}</span>
        </div>
        <p style="font-size:11px; color:var(--text-secondary); margin:0 0 6px 0; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${client.issue}</p>
        <div style="display:flex; align-items:center; gap:10px; font-size:10px; color:var(--text-muted); font-family:var(--font-mono);">
          <span><i data-lucide="calendar" style="width:10px; height:10px; display:inline-block; vertical-align:middle; margin-right:2px;"></i> ${client.date}</span>
          <span><i data-lucide="video" style="width:10px; height:10px; display:inline-block; vertical-align:middle; margin-right:2px;"></i> ${client.mode.split(' ')[0]}</span>
        </div>
      `;

      item.addEventListener('click', () => {
        // Highlight active item
        document.querySelectorAll('.client-item-card').forEach(card => {
          card.style.borderColor = 'rgba(255,255,255,0.05)';
          card.style.background = 'transparent';
        });
        item.style.borderColor = 'var(--color-thread)';
        item.style.background = 'rgba(178, 94, 56, 0.05)';

        loadActiveClientDetail(client);
      });

      listContainer.appendChild(item);
    });

    lucide.createIcons();
  }

  function loadActiveClientDetail(client) {
    const detailPanel = document.getElementById('lawyer-active-client-detail');
    if (!detailPanel) return;

    // Render chat messages
    let chatHTML = '';
    client.chat.forEach(msg => {
      const isLawyer = msg.sender === 'lawyer' || msg.sender === 'system';
      const senderClass = isLawyer ? 'message-lawyer' : 'message-client';
      const senderName = msg.sender === 'lawyer' ? 'You' : msg.sender === 'system' ? 'VakilSetu System' : client.name;

      chatHTML += `
        <div class="chat-message ${senderClass}">
          <div class="message-meta">${senderName}</div>
          <div class="message-bubble">${msg.text}</div>
        </div>
      `;
    });

    // Render documents list
    let docsHTML = '';
    client.docs.forEach((doc, idx) => {
      docsHTML += `
        <div class="doc-item" style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <i data-lucide="file-text" style="color:var(--accent-indigo); width:16px; height:16px;"></i>
            <div>
              <div style="font-size:12px; color:white; font-weight:500;">${doc.name}</div>
              <div style="font-size:10px; color:var(--text-muted);">${doc.size}</div>
            </div>
          </div>
          <button class="btn btn-secondary btn-mini btn-scan-client-doc" data-client-id="${client.id}" data-doc-idx="${idx}" style="font-size:10px; padding:4px 10px;">
            <i data-lucide="sparkles" style="width:12px; height:12px;"></i> Scan Clauses
          </button>
        </div>
      `;
    });

    detailPanel.innerHTML = `
      <div class="workspace-main-panel glass-card" style="display: grid; grid-template-rows: auto 1fr auto; height: 320px; padding: 0;">
        
        <!-- Header -->
        <div style="padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h3 style="margin:0; font-size:14px; color:white;">Case: ${client.issue}</h3>
            <span style="font-size:11px; color:var(--text-secondary);">Client: ${client.name} • ${client.mode}</span>
          </div>
          <div style="font-family:var(--font-mono); font-size:10px; background:rgba(16, 185, 129, 0.1); border:1px solid rgba(16, 185, 129, 0.2); color:#10b981; padding:4px 8px;">
            PRIVILEGED INQUIRY
          </div>
        </div>

        <!-- Chat messages area -->
        <div id="lawyer-client-chat-box" style="padding: 15px 20px; overflow-y: auto; display:flex; flex-direction:column; gap:12px; height: 180px;">
          ${chatHTML}
        </div>

        <!-- Chat input area -->
        <div style="padding: 10px 20px; border-top: 1px solid rgba(255,255,255,0.08);">
          <form id="lawyer-chat-form" style="display:flex; gap:10px;">
            <input type="text" id="lawyer-chat-input" placeholder="Type privilege-protected reply to client..." style="flex:1; background:rgba(15,23,42,0.6); border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:8px 12px; color:white; font-size:12px;" required>
            <button type="submit" class="btn btn-primary" style="padding:8px 16px; font-size:12px;">Send</button>
          </form>
        </div>

      </div>

      <!-- Client Documents panel -->
      <div class="glass-card" style="padding: 20px;">
        <h4 style="margin:0 0 12px 0; font-size:13px; text-transform:uppercase; font-family:var(--font-mono); letter-spacing:0.05em; color:var(--text-secondary);">Client Documents Vault</h4>
        <div id="lawyer-client-docs-list">
          ${docsHTML}
        </div>
      </div>
    `;

    lucide.createIcons();

    // Bind chat form submit
    const chatForm = document.getElementById('lawyer-chat-form');
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('lawyer-chat-input');
      const text = input.value.trim();
      if (!text) return;

      // Add to array
      client.chat.push({ sender: 'lawyer', text: text });

      // Reload UI
      loadActiveClientDetail(client);

      // Scroll to bottom
      const box = document.getElementById('lawyer-client-chat-box');
      box.scrollTop = box.scrollHeight;
    });

    // Bind scan documents button
    const scanButtons = document.querySelectorAll('.btn-scan-client-doc');
    scanButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const docIdx = parseInt(btn.getAttribute('data-doc-idx'));
        openLawyerDocAuditModal(client.docs[docIdx].name);
      });
    });
  }

  function openLawyerDocAuditModal(docName) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.85)';
    modal.style.backdropFilter = 'blur(8px)';
    modal.style.zIndex = '9999';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    modal.innerHTML = `
      <div class="glass-card" style="width: 500px; padding: 24px; border: 1px solid var(--color-thread); position:relative; border-radius:0px;">
        <button id="btn-close-lawyer-audit" style="position:absolute; right:15px; top:15px; background:transparent; border:none; color:var(--text-secondary); cursor:pointer;"><i data-lucide="x"></i></button>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
          <span class="pill-tag text-rose" style="margin:0;">3 Breaches Detected</span>
          <h3 style="margin:0; font-size:16px; font-family:var(--font-serif);">${docName}</h3>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
          <div style="background:rgba(239, 68, 68, 0.05); border:1px dashed rgba(239, 68, 68, 0.3); padding:10px;">
            <strong style="color:#ef4444; font-size:11px; font-family:var(--font-mono);">⚠️ LATE FEE CAP BREACH</strong>
            <p style="font-size:11px; margin:4px 0 0 0; color:var(--text-secondary);">Clause 14 demands a ₹15,000 flat late fee. Local statutory caps limit late fees to 8% of monthly rent (₹8,000 max).</p>
          </div>
          <div style="background:rgba(239, 68, 68, 0.05); border:1px dashed rgba(239, 68, 68, 0.3); padding:10px;">
            <strong style="color:#ef4444; font-size:11px; font-family:var(--font-mono);">⚠️ UNLAWFUL ENTRY CLAUSE</strong>
            <p style="font-size:11px; margin:4px 0 0 0; color:var(--text-secondary);">Clause 8 permits the landlord to enter premises at any time without notice. Standard law requires 24 hours written notice except in emergencies.</p>
          </div>
          <div style="background:rgba(239, 68, 68, 0.05); border:1px dashed rgba(239, 68, 68, 0.3); padding:10px;">
            <strong style="color:#ef4444; font-size:11px; font-family:var(--font-mono);">⚠️ UTILITY SHUTOFF THREAT</strong>
            <p style="font-size:11px; margin:4px 0 0 0; color:var(--text-secondary);">Clause 19 allows landlord utility shutoffs for non-payment. Self-help evictions are criminal offenses under local state tenant acts.</p>
          </div>
        </div>

        <button class="btn btn-primary w-full" id="btn-close-lawyer-audit-confirm" style="border-radius:0px;">Confirm & Close Report</button>
      </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();

    const closeModal = () => modal.remove();
    document.getElementById('btn-close-lawyer-audit').addEventListener('click', closeModal);
    document.getElementById('btn-close-lawyer-audit-confirm').addEventListener('click', closeModal);
  }

  function initLawyerToolkit() {
    // 1. Sidebar Tabs Toggling
    const toolkitNavBtns = document.querySelectorAll('.toolkit-nav-btn');
    const toolkitPanels = document.querySelectorAll('.toolkit-panel');

    toolkitNavBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toolkitNavBtns.forEach(b => {
          b.classList.remove('active');
          b.style.background = 'transparent';
          b.style.borderColor = 'transparent';
          b.style.color = 'var(--text-secondary)';
        });

        btn.classList.add('active');
        btn.style.background = 'rgba(255,255,255,0.03)';
        btn.style.borderColor = 'var(--color-thread)';
        btn.style.color = 'var(--text-primary)';

        const tool = btn.getAttribute('data-tool');
        toolkitPanels.forEach(panel => {
          panel.style.display = panel.id === `tool-panel-${tool}` ? 'block' : 'none';
        });
      });
    });

    // 2. Vakalatnama Builder
    const vakalatnamaForm = document.getElementById('vakalatnama-form');
    if (vakalatnamaForm) {
      vakalatnamaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientVal = document.getElementById('vakalatnama-client').value;
        const courtVal = document.getElementById('vakalatnama-court').value;
        const caseNumVal = document.getElementById('vakalatnama-case-num').value;

        // Update Preview
        document.getElementById('preview-val-client-name').textContent = clientVal;
        document.getElementById('preview-val-court').textContent = courtVal;
        document.getElementById('preview-val-case').textContent = caseNumVal;

        const lawyerName = state.userProfile ? state.userProfile.name : 'Neha Sharma, Esq.';
        const lawyerNameEls = document.querySelectorAll('.preview-val-lawyer-name');
        lawyerNameEls.forEach(el => el.textContent = lawyerName);

        alert('Vakalatnama generated and signed successfully! Print view updated.');
      });
    }

    const btnPrintVakalatnama = document.getElementById('btn-print-vakalatnama');
    if (btnPrintVakalatnama) {
      btnPrintVakalatnama.addEventListener('click', () => {
        const previewContent = document.getElementById('vakalatnama-preview-box').innerHTML;
        const win = window.open('', '', 'height=600,width=800');
        win.document.write('<html><head><title>Vakalatnama</title>');
        win.document.write('<style>body { font-family: Georgia, serif; padding: 40px; color: #111; line-height: 1.6; } .preview-val-lawyer-name { font-weight: bold; } button { display:none; }</style>');
        win.document.write('</head><body>');
        win.document.write(previewContent);
        win.document.write('</body></html>');
        win.document.close();
        win.print();
      });
    }

    // 3. Court Calendar
    const hearingForm = document.getElementById('hearing-form');
    const hearingsList = document.getElementById('calendar-hearings-list');
    if (hearingForm) {
      hearingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientName = document.getElementById('hearing-client').value;
        const court = document.getElementById('hearing-court').value;
        const dateVal = document.getElementById('hearing-date').value;
        const details = document.getElementById('hearing-details').value;

        // Parse date for clean display
        const dateObj = new Date(dateVal);
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
        const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const hearingCard = document.createElement('div');
        hearingCard.className = 'glass-card';
        hearingCard.style.padding = '12px';
        hearingCard.style.borderLeft = '3px solid var(--accent-indigo)';
        hearingCard.style.background = 'rgba(255,255,255,0.01)';
        hearingCard.innerHTML = `
          <div style="display: flex; justify-content: space-between; font-size: 10px; font-family: var(--font-mono); color: var(--text-muted); margin-bottom: 4px;">
            <span>${formattedDate} • ${formattedTime}</span>
            <span class="pill-tag text-indigo" style="margin: 0; font-size: 8px;">Court Hearing</span>
          </div>
          <strong style="font-family: var(--font-serif);">${clientName} Matter</strong>
          <p style="font-size: 11px; margin: 4px 0 0 0; color: var(--text-secondary);">${court} • ${details}</p>
        `;

        hearingsList.insertBefore(hearingCard, hearingsList.firstChild);
        hearingForm.reset();
        alert('Hearing date scheduled and added to Court Calendar!');
      });
    }

    // 4. Escrow Billing & Chat Integration
    const billingForm = document.getElementById('billing-form');
    const invoicesList = document.getElementById('invoices-list');
    if (billingForm) {
      billingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientKey = document.getElementById('bill-client').value;
        const service = document.getElementById('bill-service').value;
        const price = parseInt(document.getElementById('bill-price').value);
        const desc = document.getElementById('bill-desc').value;

        const clientName = clientKey === 'client-rahul-verma' ? 'Rahul Verma' : (clientKey === 'client-meera-nair' ? 'Meera Nair' : 'Client');

        // Add to recent invoices list
        const invoiceCard = document.createElement('div');
        invoiceCard.className = 'glass-card';
        invoiceCard.style.padding = '12px';
        invoiceCard.style.borderLeft = '3px solid var(--accent-rose)';
        invoiceCard.style.background = 'rgba(255,255,255,0.01)';
        invoiceCard.style.display = 'flex';
        invoiceCard.style.justify = 'space-between';
        invoiceCard.style.alignItems = 'center';
        invoiceCard.innerHTML = `
          <div>
            <strong style="font-family: var(--font-serif); font-size:12px;">${service} (${clientName})</strong>
            <p style="font-size: 10px; margin: 2px 0 0 0; color: var(--text-muted);">${desc}</p>
          </div>
          <div style="text-align: right;">
            <div style="font-family: var(--font-mono); font-weight: bold; color: var(--accent-rose);">₹${price.toLocaleString('en-IN')}</div>
            <span class="pill-tag text-rose" style="font-size: 8px; margin: 2px 0 0 0; padding: 1px 4px;">Pending</span>
          </div>
        `;

        invoicesList.insertBefore(invoiceCard, invoicesList.firstChild);

        // Find client record in memory and push chat message
        const matchedClient = caseloadClients.find(c => c.id === clientKey || c.name === clientKey);

        if (matchedClient) {
          matchedClient.chat.push({
            sender: 'lawyer',
            text: `📢 Escrow Payment Request Issued:\n₹${price.toLocaleString('en-IN')} for "${service}".\nDescription: ${desc}\n\nPlease click to deposit the funds safely in VakilSetu Escrow.`
          });
          // If this client is active client, reload the chat box
          if (state.userType === 'lawyer' && activeClient && activeClient.id === matchedClient.id) {
            loadActiveClientDetail(matchedClient);
          }
        }

        billingForm.reset();
        alert(`Invoice dispatched successfully to ${clientName}! Chat history has been updated.`);
      });
    }

    // 5. Precedents & Drafts
    const draftTemplates = [
      {
        title: "Section 138 NI Act - Demand Notice for Cheque Bounce",
        text: `LEGAL NOTICE BY REGISTERED AD / SPEED POST

To,
[Client Opponent Name / Debtor Name]
[Opponent Full Address]

Dear Sir/Madam,

Under instructions from my client, Shri [Client Full Name], residing at [Client Address], I hereby serve you with this Legal Notice under Section 138 of the Negotiable Instruments Act, 1881:

1. That you issued a Cheque No. [Cheque Number] dated [Date] drawn on [Bank Name] for an amount of Rs. [Amount in Figures] (Rupees [Amount in Words] Only) towards discharge of your legal liability.
2. That my client presented the said cheque which was returned unpaid by the bank with the endorsement "Funds Insufficient" on [Bounce Date].
3. I hereby call upon you to make payment of the said amount of Rs. [Amount] within fifteen (15) days of receipt of this notice, failing which my client shall initiate criminal prosecution.

Advocate [Lawyer Name]`,
        precedents: `<li><strong>K. Bhaskaran v. Sankaran Vaidhyan Balan (1999)</strong>: Establishes that the notice is deemed served once sent by post to the correct address, even if returned.</li>
<li><strong>MSR Leathers v. S. Palaniappan (2013)</strong>: A cheque bounce notice can be sent multiple times if the cheque is represented.</li>`
      },
      {
        title: "Section 106 TP Act - Notice for Termination of Tenancy",
        text: `LEGAL NOTICE FOR TERMINATION OF LEASE

To,
[Tenant Name]
[Address of Leased Premises]

Dear Sir/Madam,

Under instructions from my client, [Landlord Name], owner of the property located at [Address], I hereby serve you with this Notice under Section 106 of the Transfer of Property Act, 1882:

1. That you entered into a lease agreement dated [Lease Date] in respect of the property at [Address] for monthly rent of Rs. [Rent Amount].
2. That my client hereby terminates your tenancy in respect of the said premises upon the expiry of fifteen (15) days from receipt of this notice.
3. I hereby call upon you to quit, vacate and deliver quiet and vacant possession of the premises to my client on or before [Vacation Date], failing which my client will file an eviction suit.

Advocate [Lawyer Name]`,
        precedents: `<li><strong>Nopany Investments (P) Ltd. v. Santokh Singh (HUF) (2008)</strong>: A notice under Sec 106 is valid even if a monthly tenancy is terminated without proving defaults, as long as 15 days' notice is given.</li>
<li><strong>State of UP v. Zahoor Ahmad (1973)</strong>: Strict compliance of notice delivery is mandatory to secure an eviction order.</li>`
      },
      {
        title: "Application for Interim Injunction & Stay Order",
        text: `IN THE COURT OF THE CIVIL JUDGE, SENIOR DIVISION, MUMBAI
I.A. NO. ___ OF 2026 IN CIVIL SUIT NO. ___ OF 2026

IN THE MATTER OF:
[Client Name]   ...Plaintiff
v.
[Opponent Name]   ...Defendant

APPLICATION UNDER ORDER 39 RULES 1 & 2 OF CPC FOR INTERIM INJUNCTION

The Plaintiff above-named states as follows:
1. The Plaintiff has filed the accompanying suit for Permanent Injunction and Declaration against the Defendant, which is pending before this Court.
2. The Defendant is attempting to unlawfully evict the Plaintiff from the suit premises without following due process of law.
3. If the Defendant is not restrained by an ad-interim injunction, the Plaintiff will suffer irreparable loss and injury which cannot be compensated in money.

PRAYER:
It is therefore prayed that this Court be pleased to grant an ad-interim temporary injunction restraining the Defendant from evicting the Plaintiff or creating any third-party rights in the suit property until final disposal of the suit.

Advocate for Plaintiff`,
        precedents: `<li><strong>Gujarat Bottling Co. Ltd. v. Coca Cola Co. (1995)</strong>: Lays down the three pillars for injunction grants: prima facie case, balance of convenience, and irreparable injury.</li>
<li><strong>Morgan Stanley Mutual Fund v. Kartick Das (1994)</strong>: Guidelines for grant of ex-parte ad-interim injunctions.</li>`
      }
    ];

    const draftBtns = document.querySelectorAll('.toolkit-draft-btn');
    const editor = document.getElementById('draft-text-editor');
    const selectedTitle = document.getElementById('selected-draft-title');
    const precedentsList = document.querySelector('#tool-panel-drafts ul');

    draftBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        draftBtns.forEach(b => {
          b.classList.remove('active');
          b.style.background = 'transparent';
          b.style.borderColor = 'transparent';
          b.style.color = 'var(--text-secondary)';
        });

        btn.classList.add('active');
        btn.style.background = 'rgba(255,255,255,0.03)';
        btn.style.borderColor = 'var(--color-thread)';
        btn.style.color = 'white';

        const idx = parseInt(btn.getAttribute('data-draft-idx'));
        const template = draftTemplates[idx];

        selectedTitle.textContent = template.title;
        editor.value = template.text.replace('[Lawyer Name]', state.userProfile ? state.userProfile.name : 'Neha Sharma, Esq.');
        precedentsList.innerHTML = template.precedents;
      });
    });

    const btnCopyDraft = document.getElementById('btn-copy-draft');
    if (btnCopyDraft) {
      btnCopyDraft.addEventListener('click', () => {
        editor.select();
        document.execCommand('copy');
        alert('Draft notice copied to clipboard!');
      });
    }

    const draftSearchInput = document.getElementById('draft-search-input');
    if (draftSearchInput) {
      draftSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        draftBtns.forEach(btn => {
          const text = btn.textContent.toLowerCase();
          btn.style.display = text.includes(query) ? 'block' : 'none';
        });
      });
    }
  }

  // Fetch existing lawyers from the database and populate the list
  async function fetchLawyersFromDatabase() {
    try {
      const response = await fetch(`${API_BASE}/api/lawyers`);
      if (response.ok) {
        const dbLawyers = await response.json();
        if (dbLawyers && dbLawyers.length > 0) {
          // Merge with static seeds, ensuring no duplicates by ID
          dbLawyers.forEach(lawyer => {
            const index = LAWYERS_DATABASE.findIndex(l => l.id === lawyer.id);
            if (index !== -1) {
              LAWYERS_DATABASE[index] = lawyer;
            } else {
              LAWYERS_DATABASE.unshift(lawyer);
            }
          });
          // Re-render UI list
          renderLawyers();
        }
      }
    } catch (error) {
      console.error("Failed to fetch lawyers from database:", error);
    }
  }

  // Pre-load default lawyers & set initial navigation
  renderLawyers();
  updateNavForUserRole();
  initLawyerToolkit();
  fetchLawyersFromDatabase();

  // Restore user session on startup if present
  const savedUserType = localStorage.getItem('VAKILSETU_USER_TYPE');
  const savedUserId = localStorage.getItem('VAKILSETU_USER_ID');
  if (savedUserType && savedUserId) {
    (async () => {
      try {
        const endpoint = savedUserType === 'lawyer'
          ? `${API_BASE}/api/lawyers/${savedUserId}`
          : `${API_BASE}/api/clients/${savedUserId}`;

        const res = await fetch(endpoint);
        if (res.status === 404) {
          throw new Error('404');
        }
        if (!res.ok) {
          throw new Error('Failed to fetch user');
        }
        const data = await res.json();
        const user = data.user;

        restoreUserSession(savedUserType, user);
        // Force restore after refresh
        onboardingOverlay.style.display = 'none';
        updateNavForUserRole();
        switchTab('workspace');
      } catch (err) {
        console.error("Failed to restore session:", err);
        localStorage.removeItem('VAKILSETU_USER_TYPE');
        localStorage.removeItem('VAKILSETU_USER_ID');
        localStorage.removeItem('VAKILSETU_USER_PROFILE');

        // Show login screen
        onboardingStep1.style.display = 'flex';
        onboardingStep2.style.display = 'none';
        onboardingStep3Client.style.display = 'none';
        onboardingStep3Lawyer.style.display = 'none';
        onboardingStepAdvocateSignup.style.display = 'none';
        onboardingOverlay.style.display = 'flex';
        updateNavForUserRole();
        switchTab('analyzer');
      }
    })();
  } else {
    localStorage.removeItem('VAKILSETU_USER_PROFILE');
  }

  // ==================== DIGILOCKER VERIFICATION LOGIC ====================
  const digilockerLockScreen = document.getElementById('digilocker-lock-screen');
  const btnDigilockerVerify = document.getElementById('btn-digilocker-verify');
  const verifyLockBarId = document.getElementById('verify-lock-bar-id');

  window.checkDigiLockerLock = function () {
    if (state.userType === 'lawyer' && state.userProfile && state.userProfile.verificationStatus !== 'verified') {
      if (digilockerLockScreen) {
        digilockerLockScreen.style.display = 'flex';
        if (state.userProfile.barCouncilId) {
          verifyLockBarId.value = state.userProfile.barCouncilId;
        }
      }
    } else {
      if (digilockerLockScreen) {
        digilockerLockScreen.style.display = 'none';
      }
    }
  }

  if (btnDigilockerVerify) {
    btnDigilockerVerify.addEventListener('click', async () => {
      const barId = verifyLockBarId.value.trim();
      if (!barId) {
        alert('Please enter your Bar Council ID to verify.');
        return;
      }

      btnDigilockerVerify.disabled = true;
      btnDigilockerVerify.innerHTML = '<i data-lucide="loader" class="spin"></i> Verifying...';
      lucide.createIcons();

      try {
        const res = await fetch(`${API_BASE}/api/digilocker/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lawyerId: state.userProfile?.id || null,
            barCouncilId: barId,
            contactInfo: state.userProfile?.contactInfo || onboardingContactVal || null
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Verification failed');
        }

        const resData = await res.json();

        alert('✅ Identity verified successfully! Welcome to your dashboard.');

        // Update local state — use resolved ID from backend if our local ID was missing
        if (resData.lawyerId && !state.userProfile.id) {
          state.userProfile.id = resData.lawyerId;
        }
        state.userProfile.verificationStatus = 'verified';
        state.userProfile.barCouncilId = barId;
        persistSession();
        window.checkDigiLockerLock();
      } catch (err) {
        console.error('DigiLocker error:', err);
        alert(err.message || 'Verification failed. Please try again.');
      } finally {
        btnDigilockerVerify.disabled = false;
        btnDigilockerVerify.innerHTML = '<i data-lucide="check-circle" style="width:20px; height:20px;"></i> Verify via DigiLocker';
        lucide.createIcons();
      }
    });
  }

  // ==================== SETTINGS LOGIC ====================
  const settingsForm = document.getElementById('settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-save-settings');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i data-lucide="loader-2" style="width:16px;height:16px;display:inline;margin-right:6px;"></i> Saving...';
      btn.disabled = true;

      try {
        let endpoint = '';
        let payload = {};
        const sharedName = document.getElementById('settings-name-shared').value;

        if (state.userType === 'lawyer') {
          endpoint = `${API_BASE}/api/lawyers/${state.userProfile.id}`;
          payload = {
            name: sharedName,
            specialty: document.getElementById('settings-lawyer-specialty').value,
            exp: document.getElementById('settings-lawyer-exp').value,
            fought: document.getElementById('settings-lawyer-fought').value,
            won: document.getElementById('settings-lawyer-won').value,
            bio: document.getElementById('settings-lawyer-bio').value,
            bar_council_id: document.getElementById('settings-bar-council-id').value,
            bar_number: document.getElementById('settings-lawyer-enrolment').value,
            state_bar_council: document.getElementById('settings-lawyer-state').value
          };
        } else {
          endpoint = `${API_BASE}/api/clients/${state.userProfile.id}`;
          payload = {
            name: sharedName,
            city: document.getElementById('settings-city-shared').value,
            interest: document.getElementById('settings-client-interest').value
          };
        }

        const res = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to update profile');
        }
        const data = await res.json();
        state.userProfile = data.user;
        persistSession();

        // Update header name
        const userRoleEl = document.querySelector('.user-role');
        if (userRoleEl) userRoleEl.textContent = state.userProfile.name;

        btn.innerHTML = '<i data-lucide="check" style="width:16px;height:16px;display:inline;margin-right:6px;"></i> Saved!';
        lucide.createIcons();
        setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; lucide.createIcons(); }, 2000);
        return;

      } catch (err) {
        console.error(err);
        alert('Error saving profile: ' + err.message);
      }
      btn.innerHTML = originalText;
      btn.disabled = false;
      lucide.createIcons();
    });
  }

  // Populate Settings form when switching to that tab
  function populateSettingsForm() {
    if (!state.userProfile) return;
    document.getElementById('settings-name-shared').value = state.userProfile.name || '';
    document.getElementById('settings-city-shared').value = state.userProfile.city || '';
    document.getElementById('settings-contact-shared').value = state.userProfile.contactInfo || state.userProfile.contact || '';

    if (state.userType === 'lawyer') {
      document.getElementById('lawyer-only-settings').style.display = 'block';
      document.getElementById('client-only-settings').style.display = 'none';
      document.getElementById('settings-lawyer-specialty').value = state.userProfile.specialty || 'tenancy';
      document.getElementById('settings-lawyer-exp').value = state.userProfile.experience || 0;
      document.getElementById('settings-lawyer-fought').value = state.userProfile.casesHandled || 0;
      document.getElementById('settings-lawyer-won').value = state.userProfile.casesWon || parseInt((state.userProfile.winRate || '0%').replace('%', '')) || 0;
      document.getElementById('settings-lawyer-bio').value = state.userProfile.bio || '';
      document.getElementById('settings-lawyer-state').value = state.userProfile.state_bar_council || '';
      document.getElementById('settings-lawyer-enrolment').value = state.userProfile.bar_number || '';
      document.getElementById('settings-bar-council-id').value = state.userProfile.bar_council_id || '';
    } else {
      document.getElementById('lawyer-only-settings').style.display = 'none';
      document.getElementById('client-only-settings').style.display = 'block';
      document.getElementById('settings-client-interest').value = state.userProfile.interest || 'Tenant Disputes';
    }
  }

  // ==================== ACADEMY MODAL LOGIC ====================
  const academyModal = document.getElementById('academy-modal');
  const btnCloseAcademyModal = document.getElementById('btn-close-academy-modal');
  const btnAcademyUnderstood = document.getElementById('btn-academy-understood');
  const academyModalTitle = document.getElementById('academy-modal-title');
  const academyModalContent = document.getElementById('academy-modal-content');

  const academyMockContent = {
    'deposit': { title: 'Security Deposit Recovery', content: '<p>Under the Rent Control Act and general tenancy agreements, a landlord is required to return the security deposit within 30 days of you vacating the premises, minus any legitimate deductions for unpaid rent or major damages.</p><p><b>Steps to take:</b><ol><li>Review your lease agreement.</li><li>Send a formal written notice or email requesting the return.</li><li>If ignored, you may send a legal notice or approach a small claims or rent controller court.</li></ol></p>' },
    'repairs': { title: 'Landlord Refusing Repairs?', content: '<p>The landlord has a statutory duty to keep the premises in a habitable condition. This includes structural repairs, plumbing, and electrical faults.</p><p>If they refuse, you generally have the right to carry out minor repairs yourself and deduct the cost from the rent, provided you have given 14-30 days written notice and kept all receipts. Major structural issues may require approaching the local rent controller.</p>' },
    'eviction': { title: 'Illegal Lockouts & Eviction', content: '<p>A landlord <b>cannot</b> forcefully evict you, change locks, or cut off essential supplies (water/electricity) without a court order.</p><p>If you face an illegal lockout, immediately call the local police station and file an FIR for criminal trespass and illegal dispossession. You can also file a suit for injunction in the civil court to restore possession.</p>' },
    'wage': { title: 'Recovering Unpaid Invoices', content: '<p>As a freelancer, you operate as an independent contractor. Unpaid invoices are considered a breach of contract.</p><p><b>Steps:</b><br>1. Send a formal demand letter.<br>2. If they are a registered MSME, you can file a complaint with the MSME Samadhaan portal for delayed payments (which includes interest).<br>3. File a civil suit for recovery of money.</p>' },
    'contract': { title: 'Employee vs Contractor', content: '<p>Misclassifying an employee as an independent contractor is a common tactic to avoid paying benefits (PF, Gratuity, Health Insurance).<br><br>The primary test is the "Control Test": If the company controls your working hours, provides equipment, and dictates exactly <i>how</i> you do your work, you are legally likely an employee regardless of what the contract says.</p>' },
    'overtime': { title: 'Overtime Claims', content: '<p>Under the Factories Act and various State Shops & Establishments Acts, working beyond standard hours (usually 8-9 hours a day or 48 hours a week) entitles you to overtime pay, typically at twice the ordinary rate of wages.</p><p>Keep a strict log of your hours. If denied, you can file a claim with the local Labour Commissioner.</p>' },
    'lemon': { title: 'Used Car & Lemon Law', content: '<p>India does not have a specific "Lemon Law," but consumers are protected under the Consumer Protection Act against unfair trade practices and defective goods.</p><p>If a dealer sold you a defective vehicle while hiding material facts, you can file a complaint in the District Consumer Disputes Redressal Commission seeking a replacement, refund, or damages.</p>' },
    'subscription': { title: 'Subscription Traps', content: '<p>Auto-renewing subscriptions that are deliberately difficult to cancel violate RBI guidelines on recurring payments and Consumer Protection rules against unfair contracts.</p><p>You can revoke the e-mandate directly through your bank or UPI app. If the company continues to bill you or refuses to refund an unauthorized charge, you can initiate a chargeback.</p>' },
    'chargeback': { title: 'Credit Card Chargebacks', content: '<p>A chargeback is a dispute resolution mechanism provided by credit card networks (Visa/Mastercard). If you paid for a service/good that was not delivered, or was misrepresented, you can ask your bank to reverse the charge.</p><p>You must file this within 90-120 days of the transaction. The bank will investigate and may temporarily credit your account during the dispute.</p>' },
    'smallclaims': { title: 'Small Claims Court', content: '<p>While India doesn\'t have formal "Small Claims Courts," you can use the Lok Adalat system, Gram Nyayalayas, or file a summary suit under Order 37 of the CPC for speedy recovery of money (based on written contracts, bills, or cheques).</p><p>These fast-track courts minimize procedural delays and often do not require a lawyer.</p>' },
    'mediation': { title: 'What Happens in Mediation?', content: '<p>Mediation is a voluntary, confidential process where a neutral third party helps you and the other side negotiate a settlement. The mediator does not act as a judge and cannot force a decision.</p><p>If an agreement is reached, it is put in writing and signed, making it legally binding. If mediation fails, you can still proceed to court.</p>' },
    'lawyer-fees': { title: 'How Legal Fees Work', content: '<p><b>Hourly Rate:</b> You pay for the exact time the lawyer spends on your case.<br><b>Flat Fee:</b> A set price for a specific service (e.g., drafting a will).<br><b>Retainer:</b> An upfront deposit that the lawyer bills against hourly.<br><b>Contingency:</b> (Note: Strictly speaking, contingency fees where lawyers take a % of the winnings are illegal in India under BCI rules, though alternative success-based structures are sometimes used informally).</p>' }
  };

  const academyLinks = document.querySelectorAll('.academy-link');
  academyLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const scenario = link.getAttribute('data-scenario');
      const data = academyMockContent[scenario];
      if (data) {
        academyModalTitle.textContent = data.title;
        academyModalContent.innerHTML = data.content;
      } else {
        academyModalTitle.textContent = 'Legal Guide';
        academyModalContent.innerHTML = '<p>Detailed information for this scenario is currently being updated. Please consult a qualified advocate for specific advice.</p>';
      }
      academyModal.style.display = 'flex';
      lucide.createIcons();
    });
  });

  const closeAcademyModal = () => {
    if (academyModal) academyModal.style.display = 'none';
  };

  if (btnCloseAcademyModal) btnCloseAcademyModal.addEventListener('click', closeAcademyModal);
  if (btnAcademyUnderstood) btnAcademyUnderstood.addEventListener('click', closeAcademyModal);

  if (academyModal) {
    academyModal.addEventListener('click', (e) => {
      if (e.target === academyModal) closeAcademyModal();
    });
  }

});
