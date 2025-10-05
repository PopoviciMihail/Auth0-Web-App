const AUTH0_DOMAIN="dev-1iq1my7l1yyrvjwu.eu.auth0.com";
const API_AUDIENCE="https://localhost/api";
const AUTH0_CLIENT_ID="skGOn8WoLzVSBRfVjtV1s3BFIixW67Gs";

let auth0 = null, currentUser = null, accessToken = null;

async function configureClient() {
    auth0 = await createAuth0Client({
        domain: AUTH0_DOMAIN,
        client_id: AUTH0_CLIENT_ID,
        audience: AUTH0_AUDIENCE,
        cacheLocation: "localstorage"
    });
}

function render() {
    const app = document.getElementById('app');
    if (!currentUser) {
        app.innerHTML = `<button id="login">Login</button>`;
        document.getElementById("login").onclick = login;
    } else {
        app.innerHTML = `
            <button id="logout">Logout</button><br>
            Logged in as: ${currentUser.email || currentUser.sub}<br>
        `;
        document.getElementById("logout").onclick = logout;
    }
}
async function login() {
    await auth0.loginWithRedirect({
        redirect_uri: window.location.origin
    });
}

async function logout() {
    auth0.logout({
        logoutParams: {
            returnTo: window.location.origin
        }
    });
}

window.onload = async () => {
    await configureClient();
    if (window.location.search.includes("code=")) {
        await auth0.handleRedirectCallback();
        window.history.replaceState({}, document.title, "/");
    }
    const isAuthenticated = await auth0.isAuthenticated();
    if (isAuthenticated) {
        currentUser = await auth0.getUser();
        accessToken = await auth0.getTokenSilently();
    } else {
        currentUser = null;
        accessToken = null;
    }
    render();
};
