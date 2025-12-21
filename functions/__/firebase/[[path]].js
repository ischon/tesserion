export async function onRequest(context) {
    const url = new URL(context.request.url);
    const firebaseHost = "schon-tesserion.firebaseapp.com";

    const proxyUrl = "https://" + firebaseHost + url.pathname + url.search;

    return fetch(new Request(proxyUrl, context.request));
}
