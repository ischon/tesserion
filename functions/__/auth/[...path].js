export async function onRequest(context) {
    const url = new URL(context.request.url);
    // Pas dit aan naar jouw specifieke Firebase project ID
    const firebaseHost = "schon-tesserion.firebaseapp.com";

    const proxyUrl = "https://" + firebaseHost + url.pathname + url.search;

    const modifiedRequest = new Request(proxyUrl, context.request);

    const response = await fetch(modifiedRequest);
    const newResponse = new Response(response.body, response);

    // Zorg dat de COOP header ook hier goed staat
    newResponse.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

    return newResponse;
}
