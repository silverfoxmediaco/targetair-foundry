import { createClient, type Client } from "@osdk/client";
import { createPublicOauthClient, type PublicOauthClient } from "@osdk/oauth";

function getMetaTagContent(tagName: string): string {
  const elements = document.querySelectorAll(`meta[name="${tagName}"]`);
  const element = elements.item(elements.length - 1);
  const value = element ? element.getAttribute("content") : null;
  if (value == null || value === "") {
    throw new Error(`Meta tag ${tagName} not found or empty`);
  }
  if (value.match(/%.+%/)) {
    throw new Error(
      `Meta tag ${tagName} contains placeholder value. Please add ${value.replace(
        /%/g,
        ""
      )} to your .env files`
    );
  }
  return value;
}

const foundryUrl = getMetaTagContent("osdk-foundryUrl");
const clientId = getMetaTagContent("osdk-clientId");
const redirectUrl = getMetaTagContent("osdk-redirectUrl");
const ontologyRid = getMetaTagContent("osdk-ontologyRid");

const scopes = [
  "api:ontologies-read",
  "api:ontologies-write",
];

export const auth: PublicOauthClient = createPublicOauthClient(
  clientId,
  foundryUrl,
  redirectUrl,
  { scopes }
);

/**
 * Where @osdk/oauth keeps the in-flight PKCE artifacts — codeVerifier, state,
 * oldUrl. It writes them to sessionStorage before redirecting to Multipass.
 */
const oauthSessionKey = `@osdk/oauth : refresh : ${clientId}`;

/**
 * Clear the in-flight PKCE artifacts.
 *
 * @osdk/oauth 1.14.0 writes them but only clears them when a callback throws.
 * A successful callback leaves them in place, and signOut() clears localStorage
 * and never touches sessionStorage. So they outlive the flow that created them.
 *
 * A leftover codeVerifier is not inert. signIn() checks for one BEFORE it
 * decides to start a fresh login, and treats its presence as proof that the
 * current URL is an OAuth callback. On any URL without a `state` query
 * parameter — /dashboard, say — validation fails with
 * `response parameter "state" missing` and no redirect is ever attempted.
 * sessionStorage survives reloads, so the tab stays broken until the key goes.
 */
export function clearOauthSession(): void {
  globalThis.sessionStorage?.removeItem(oauthSessionKey);
}

function isStalePkceError(e: unknown): boolean {
  return e instanceof Error && e.message.includes('parameter "state" missing');
}

/**
 * auth.signIn(), with the stale-PKCE trap handled.
 *
 * Every route calls this on mount. Clearing on the way out of a successful
 * sign-in stops the artifacts accumulating; catching the failure and retrying
 * once recovers tabs that were already poisoned before this shipped — which
 * matters, because the alternative is a blank screen and an error string for
 * anyone holding an old tab.
 */
export async function signIn(): Promise<Awaited<ReturnType<typeof auth.signIn>>> {
  try {
    const token = await auth.signIn();
    clearOauthSession();
    return token;
  } catch (e) {
    if (!isStalePkceError(e)) {
      throw e;
    }
    // The retry falls through to a fresh authorization redirect.
    clearOauthSession();
    return await auth.signIn();
  }
}

/**
 * Initialize the client to interact with the Ontology and Platform SDKs
 */
export const client: Client = createClient(foundryUrl, ontologyRid, auth);

export default client;
