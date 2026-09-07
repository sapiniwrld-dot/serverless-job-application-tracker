const authStatus = document.getElementById("authStatus");
const signInButton = document.getElementById("signInButton");
const signOutButton = document.getElementById("signOutButton");
const trackerApp = document.getElementById("trackerApp");

const cognitoDomain =
  window.APP_CONFIG.COGNITO_DOMAIN.replace(/\/$/, "");
const cognitoClientId =
  window.APP_CONFIG.COGNITO_CLIENT_ID;
const redirectUri =
  window.APP_CONFIG.REDIRECT_URI;

function base64UrlEncode(bytes) {
  return btoa(
    String.fromCharCode(...new Uint8Array(bytes))
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function createCodeVerifier() {
  const bytes = new Uint8Array(48);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function createCodeChallenge(verifier) {
  const encoded = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoded
  );
  return base64UrlEncode(digest);
}

function readTokenPayload(token) {
  const encodedPayload = token.split(".")[1]
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const paddedPayload = encodedPayload.padEnd(
    Math.ceil(encodedPayload.length / 4) * 4,
    "="
  );

  return JSON.parse(atob(paddedPayload));
}

function getAccessToken() {
  const token = sessionStorage.getItem("accessToken");

  if (!token) {
    return null;
  }

  const payload = readTokenPayload(token);
  const isExpired = payload.exp * 1000 <= Date.now();

  if (isExpired) {
    clearTokens();
    return null;
  }

  return token;
}

function clearTokens() {
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("idToken");
  sessionStorage.removeItem("refreshToken");
}

function updateAuthDisplay() {
  const accessToken = getAccessToken();
  const idToken = sessionStorage.getItem("idToken");

  if (accessToken && idToken) {
    const user = readTokenPayload(idToken);
    authStatus.textContent =
      "Signed in as " + user.email;
    signInButton.hidden = true;
    signOutButton.hidden = false;
    trackerApp.hidden = false;
    return;
  }

  authStatus.textContent = "Not signed in";
  signInButton.hidden = false;
  signOutButton.hidden = true;
  trackerApp.hidden = true;
}

async function beginSignIn() {
  const verifier = createCodeVerifier();
  const challenge = await createCodeChallenge(verifier);
  const state = crypto.randomUUID();

  sessionStorage.setItem("codeVerifier", verifier);
  sessionStorage.setItem("authState", state);

  const parameters = new URLSearchParams({
    response_type: "code",
    client_id: cognitoClientId,
    redirect_uri: redirectUri,
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256"
  });

  window.location.assign(
    cognitoDomain +
      "/oauth2/authorize?" +
      parameters.toString()
  );
}

async function finishSignIn() {
  const parameters = new URLSearchParams(
    window.location.search
  );
  const code = parameters.get("code");

  if (!code) {
    return;
  }

  const returnedState = parameters.get("state");
  const savedState = sessionStorage.getItem("authState");
  const verifier = sessionStorage.getItem("codeVerifier");

  if (!savedState || returnedState !== savedState) {
    throw new Error("The sign-in state did not match");
  }

  if (!verifier) {
    throw new Error("The PKCE verifier is missing");
  }

  const tokenResponse = await fetch(
    cognitoDomain + "/oauth2/token",
    {
      method: "POST",
      headers: {
        "content-type":
          "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: cognitoClientId,
        code,
        redirect_uri: redirectUri,
        code_verifier: verifier
      })
    }
  );

  if (!tokenResponse.ok) {
    throw new Error("Cognito rejected the sign-in");
  }

  const tokens = await tokenResponse.json();

  sessionStorage.setItem(
    "accessToken",
    tokens.access_token
  );
  sessionStorage.setItem("idToken", tokens.id_token);

  if (tokens.refresh_token) {
    sessionStorage.setItem(
      "refreshToken",
      tokens.refresh_token
    );
  }

  sessionStorage.removeItem("codeVerifier");
  sessionStorage.removeItem("authState");

  window.history.replaceState(
    {},
    document.title,
    redirectUri
  );
}

function signOut() {
  clearTokens();
  trackerApp.hidden = true;
  document.getElementById("applicationList").innerHTML = "";
  document.getElementById("totalCount").textContent =
    "Sign in to view applications";

  const parameters = new URLSearchParams({
    client_id: cognitoClientId,
    logout_uri: redirectUri
  });

  window.location.assign(
    cognitoDomain +
      "/logout?" +
      parameters.toString()
  );
}

signInButton.addEventListener("click", function () {
  beginSignIn().catch(function (error) {
    console.error(error);
    alert("Could not begin sign-in.");
  });
});

signOutButton.addEventListener("click", signOut);

const authReady = finishSignIn()
  .catch(function (error) {
    console.error(error);
    alert("Could not finish sign-in.");
  })
  .finally(updateAuthDisplay);

window.jobTrackerAuth = {
  ready: authReady,
  getAccessToken
};
