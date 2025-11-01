/* auth.js - frontend integration with your APIs
   Uses:
   - Signup: POST https://cspv.in/.../registration.php  with JSON { name, email, password, num }
   - Login : POST https://cspv.in/.../Login.php         with JSON { email, password }

   Behavior:
   - signup: on success redirects to login.html
   - login:  on success stores session flags in localStorage and redirects to home.html
*/

const API_SIGNUP = "https://cspv.in/Vending_dashbaord/vending_dashboard_apis/registration.php";
const API_LOGIN  = "https://cspv.in/Vending_dashbaord/vending_dashboard_apis/Login.php";

function parseJSONSafe(text) {
  try { return JSON.parse(text); } catch(e) { return null; }
}

async function apiPostRaw(url, data) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const text = await res.text();
    const json = parseJSONSafe(text);
    return { ok: res.ok, status: res.status, text, json };
  } catch (err) {
    console.error("Network/API error:", err);
    return { ok: false, status: 0, text: err.message, json: null };
  }
}

function isApiSuccess(json, ok) {
  if (!json) return ok; // if no json but status OK, consider success cautiously
  if (json.success === true || json.success === "true") return true;
  if (json.status === "ok" || json.status === "success" || json.status === "true") return true;
  if (json.message && /success/i.test(json.message)) return true;
  return false;
}

/* Signup function */
async function signupUser(name, email, password, phone) {
  const payload = { name, email, password, num: phone };
  const r = await apiPostRaw(API_SIGNUP, payload);

  // debug logs (you can remove)
  console.log("Signup API response:", r);

  if (isApiSuccess(r.json, r.ok)) {
    // success
    // show success briefly (optional)
    alert("Signup successful — please login.");
    // redirect to login page
    window.location.href = "login.html";
    return { ok:true, data: r.json || r.text };
  } else {
    // extract friendly message
    const errMsg = (r.json && (r.json.message || r.json.error)) || r.text || "Signup failed";
    alert("Signup failed: " + errMsg);
    return { ok:false, error: errMsg };
  }
}

/* Login function */
async function loginUser(email, password) {
  const payload = { email, password };
  const r = await apiPostRaw(API_LOGIN, payload);

  console.log("Login API response:", r);

  if (isApiSuccess(r.json, r.ok)) {
    // store minimal session info
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userEmail", email);

    // token keys common variants
    const token = r.json && (r.json.token || r.json.access_token || r.json.authToken);
    if (token) localStorage.setItem("authToken", token);

    // store full user if returned
    if (r.json && r.json.user) localStorage.setItem("user", JSON.stringify(r.json.user));

    // redirect to home
    window.location.href = "home.html";
    return { ok:true, data: r.json || r.text };
  } else {
    const errMsg = (r.json && (r.json.message || r.json.error)) || r.text || "Invalid credentials";
    alert("Login failed: " + errMsg);
    return { ok:false, error: errMsg };
  }
}

/* Auto attach to forms if present on page */
document.addEventListener("DOMContentLoaded", function () {
  // signup form
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const name = (document.getElementById("name") || {}).value || "";
      const email = (document.getElementById("email") || {}).value || "";
      const password = (document.getElementById("password") || {}).value || "";
      const phone = (document.getElementById("phone") || {}).value || "";
      signupUser(name.trim(), email.trim(), password, phone.trim());
    });
  }

  // login form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = (document.getElementById("email") || {}).value || "";
      const password = (document.getElementById("password") || {}).value || "";
      loginUser(email.trim(), password);
    });
  }
});
