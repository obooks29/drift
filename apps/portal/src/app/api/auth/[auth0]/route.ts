import { handleAuth, handleLogin, handleCallback, handleLogout } from "@auth0/nextjs-auth0";

export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: { audience: process.env.AUTH0_AUDIENCE },
  }),
  callback: handleCallback({
    afterCallback: async (_req: unknown, session: unknown) => session,
  }),
  logout: handleLogout({ returnTo: "/" }),
});
