const AUTH0_DOMAIN="dev-1iq1my7l1yyrvjwu.eu.auth0.com";
const API_AUDIENCE="http://localhost:8000";
const AUTH0_CLIENT_ID="DwTysoUXiqaVAZOakOoUxL1F1er0K8VD";

let auth0 = null, currentUser = null, accessToken = null;

async function configureClient() {
    auth0 = await createAuth0Client({
        domain: AUTH0_DOMAIN,
        client_id: AUTH0_CLIENT_ID,
        audience: API_AUDIENCE,
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
            <button id="fetch">Fetch My Items</button>
            <div id="items"></div>
        `;
        document.getElementById("logout").onclick = logout;
        document.getElementById("fetch").onclick = fetchItems;
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

async function fetchItems() {
    const itemsDiv = document.getElementById("items");
    itemsDiv.innerHTML = "Loading...";

    try {
        const userSub = currentUser.sub;
        const response = await fetch(`http://localhost:8000/items/${encodeURIComponent(userSub)}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();

        itemsDiv.innerHTML = "";

        const ul = document.createElement("ul");

        data.items.forEach(bill => {
            const li = document.createElement("li");
            li.textContent = `${bill.item}: ${bill.amount} ${bill.currency}`;
            ul.appendChild(li);
        });

        itemsDiv.appendChild(ul);

    } catch (e) {
        itemsDiv.innerHTML = "";
        alert("Failed to fetch: " + e.message);
    }
}

window.onload = async () => {
    await configureClient();

    const isAuthenticated = await auth0.isAuthenticated();

    if (!isAuthenticated && window.location.search.includes("code=")) {
        try {
            await auth0.handleRedirectCallback();
            window.history.replaceState({}, document.title, "/");
        } catch (e) {
            console.error("Error handling redirect callback:", e);
            window.history.replaceState({}, document.title, "/");
        }
    }

    if (await auth0.isAuthenticated()) {
        currentUser = await auth0.getUser();
        accessToken = await auth0.getTokenSilently({ audience: API_AUDIENCE });
    }

    render();
};

