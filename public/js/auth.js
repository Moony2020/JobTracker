// Authentication Management
class AuthManager {
  constructor() {
    this.loginForm = document.getElementById("login-form");
    this.registerForm = document.getElementById("register-form");
    this.forgotPasswordForm = document.getElementById("forgot-password-form");
    this.resetPasswordForm = document.getElementById("reset-password-form");

    // Mobile auth buttons
    this.mobileLoginBtn = document.getElementById("mobileLoginBtn");
    this.mobileRegisterBtn = document.getElementById("mobileRegisterBtn");
    this.mobileLogoutBtn = document.getElementById("mobileLogoutBtn");

    this.initEventListeners();
    this.checkAuthentication();
    this.checkHash();
  }

  initEventListeners() {
    // Login form
    this.loginForm.addEventListener("submit", (e) => this.handleLogin(e));

    // Register form
    this.registerForm.addEventListener("submit", (e) => this.handleRegister(e));

    // Forgot password form
    if (this.forgotPasswordForm) {
        this.forgotPasswordForm.addEventListener("submit", (e) => this.handleForgotPassword(e));
    }

    // Reset password form
    if (this.resetPasswordForm) {
        this.resetPasswordForm.addEventListener("submit", (e) => this.handleResetPassword(e));
    }

    // Mobile auth buttons
    if (this.mobileLoginBtn) {
      this.mobileLoginBtn.addEventListener("click", () =>
        uiManager.showModal("loginModal")
      );
    }

    if (this.mobileRegisterBtn) {
      this.mobileRegisterBtn.addEventListener("click", () =>
        uiManager.showModal("registerModal")
      );
    }

    if (this.mobileLogoutBtn) {
      this.mobileLogoutBtn.addEventListener("click", () =>
        uiManager.handleLogout()
      );
    }
  }

  async handleLogin(e) {
    e.preventDefault();

    const formData = {
      email: document.getElementById("login-email").value,
      password: document.getElementById("login-password").value,
    };

    // Validate form
    const errors = uiManager.validateForm(formData);
    if (errors.length > 0) {
      uiManager.showNotification(errors[0], "error");
      return;
    }

    try {
      window.uiManager?.setLoading(true); // Show loader
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        uiManager.updateUserInterface(data.user);
        uiManager.hideAllModals();
        uiManager.showNotification("Login successful!", "success");

        // Reload applications
        if (window.applicationManager) {
          window.applicationManager.loadApplications();
        }
      } else {
        uiManager.showNotification(data.message || "Login failed", "error");
      }
    } catch (error) {
      uiManager.showNotification("Network error. Please try again.", "error");
    } finally {
      window.uiManager?.setLoading(false); // Hide loader
    }
  }

  async handleRegister(e) {
    e.preventDefault();

    const formData = {
      name: document.getElementById("register-name").value,
      email: document.getElementById("register-email").value,
      password: document.getElementById("register-password").value,
      confirmPassword: document.getElementById("register-confirm").value,
    };

    // Validate form
    const errors = uiManager.validateForm(formData);
    if (errors.length > 0) {
      uiManager.showNotification(errors[0], "error");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      uiManager.showNotification("Passwords do not match", "error");
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        uiManager.updateUserInterface(data.user);
        uiManager.hideAllModals();
        uiManager.showNotification("Registration successful!", "success");

        // Reload applications
        if (window.applicationManager) {
          window.applicationManager.loadApplications();
        }
      } else {
        uiManager.showNotification(
          data.message || "Registration failed",
          "error"
        );
      }
    } catch (error) {
      uiManager.showNotification("Network error. Please try again.", "error");
    }
  }

  async handleForgotPassword(e) {
    e.preventDefault();

    const email = document.getElementById("forgot-email").value;

    if (!uiManager.validateEmail(email)) {
      uiManager.showNotification("Please enter a valid email", "error");
      return;
    }

    try {
      window.uiManager?.setLoading(true);
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        uiManager.showNotification(data.message, "success");
        uiManager.hideAllModals();
        e.target.reset();
      } else {
        uiManager.showNotification(data.message || "Failed to send reset link", "error");
      }
    } catch (error) {
      uiManager.showNotification("Network error. Please try again.", "error");
    } finally {
      window.uiManager?.setLoading(false);
    }
  }

  async handleResetPassword(e) {
    e.preventDefault();

    const token = document.getElementById("reset-token").value;
    const password = document.getElementById("reset-password").value;
    const confirmPassword = document.getElementById("reset-confirm").value;

    if (password !== confirmPassword) {
      uiManager.showNotification("Passwords do not match", "error");
      return;
    }

    try {
      window.uiManager?.setLoading(true);
      const response = await fetch(`/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        uiManager.showNotification(data.message, "success");
        uiManager.hideAllModals();
        window.location.hash = ""; // Clear hash
        uiManager.showModal("loginModal");
      } else {
        uiManager.showNotification(data.message || "Reset failed", "error");
      }
    } catch (error) {
      uiManager.showNotification("Network error. Please try again.", "error");
    } finally {
      window.uiManager?.setLoading(false);
    }
  }

  checkHash() {
    const hash = window.location.hash;
    if (hash.startsWith("#reset/")) {
      const token = hash.split("/")[1];
      document.getElementById("reset-token").value = token;
      uiManager.showModal("resetPasswordModal");
    }
  }

  async checkAuthentication() {
    const token = localStorage.getItem("token");

    if (!token) {
      uiManager.updateUserInterface(null);
      return;
    }

    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const user = await response.json();
        uiManager.updateUserInterface(user);

        // Load applications if manager exists
        if (window.applicationManager) {
          window.applicationManager.loadApplications();
        }
      } else {
        localStorage.removeItem("token");
        uiManager.updateUserInterface(null);
      }
    } catch (error) {
      localStorage.removeItem("token");
      uiManager.updateUserInterface(null);
    }
  }

  getToken() {
    return localStorage.getItem("token");
  }

  isAuthenticated() {
    return !!this.getToken();
  }
}

// Initialize Auth Manager
const authManager = new AuthManager();
window.authManager = authManager;
