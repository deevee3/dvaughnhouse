/**
 * GET /auth/logout — gateway sign-out (live 2026-10-28, WorkOS).
 * Clears the gateway session cookie and returns to the home page.
 */

export async function onRequestGet() {
  const headers = new Headers({ Location: '/' });
  headers.append(
    'Set-Cookie',
    'gw_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
  );
  headers.append(
    'Set-Cookie',
    'gw_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
  );
  return new Response(null, { status: 302, headers });
}
