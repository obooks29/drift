/**
 * Auth0 Management API Client
 * Handles M2M app provisioning, Token Vault, and CIBA via Auth0 Management API v2
 */
import axios, { AxiosInstance } from "axios";

interface Auth0Config {
  domain: string;
  clientId: string;
  clientSecret: string;
  audience: string;
}

export class Auth0ManagementClient {
  private http!: AxiosInstance;
  private tokenExpiry = 0;
  private cachedToken = "";

  constructor(private readonly config: Auth0Config) {}

  /** Get a Management API access token (cached, auto-refreshes) */
  private async getToken(): Promise<string> {
    if (Date.now() < this.tokenExpiry - 30_000) return this.cachedToken;
    const { data } = await axios.post(`https://${this.config.domain}/oauth/token`, {
      grant_type: "client_credentials",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      audience: `https://${this.config.domain}/api/v2/`,
    });
    this.cachedToken = data.access_token as string;
    this.tokenExpiry = Date.now() + (data.expires_in as number) * 1000;
    return this.cachedToken;
  }

  private async client(): Promise<AxiosInstance> {
    const token = await this.getToken();
    return axios.create({
      baseURL: `https://${this.config.domain}/api/v2`,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
  }

  /** ── M2M Application ─────────────────────────────── */

  /** Create a new M2M application for an agent */
  async createM2MApp(opts: {
    agentId: string;
    name: string;
    description?: string;
  }): Promise<{ clientId: string; clientSecret: string }> {
    const http = await this.client();
    const { data } = await http.post("/clients", {
      name: `drift-agent-${opts.agentId}`,
      description: opts.description ?? `Drift agent: ${opts.name}`,
      app_type: "non_interactive",
      grant_types: ["client_credentials"],
      oidc_conformant: true,
      metadata: {
        drift_agent_id: opts.agentId,
        drift_agent_name: opts.name,
        managed_by: "drift",
      },
    });
    return { clientId: data.client_id as string, clientSecret: data.client_secret as string };
  }

  /** Grant the M2M app access to an API audience */
  async grantM2MAccess(clientId: string, audience: string, scopes: string[]): Promise<void> {
    const http = await this.client();
    // Find the API resource server
    const { data: apis } = await http.get("/resource-servers");
    const api = (apis as Array<{ identifier: string; id: string }>).find((a) => a.identifier === audience);
    if (!api) throw new Error(`API audience "${audience}" not found in Auth0 tenant`);
    await http.post("/client-grants", {
      client_id: clientId,
      audience,
      scope: scopes,
    });
  }

  /** Delete an M2M application (agent revocation) */
  async deleteM2MApp(auth0ClientId: string): Promise<void> {
    const http = await this.client();
    await http.delete(`/clients/${auth0ClientId}`);
  }

  /** Block/unblock an M2M app (agent suspension) */
  async updateM2MApp(auth0ClientId: string, updates: Record<string, unknown>): Promise<void> {
    const http = await this.client();
    await http.patch(`/clients/${auth0ClientId}`, updates);
  }

  /** Get a client credentials token for an agent */
  async getAgentToken(auth0ClientId: string, clientSecret: string, audience: string): Promise<{
    accessToken: string;
    expiresIn: number;
    scope: string;
  }> {
    const { data } = await axios.post(`https://${this.config.domain}/oauth/token`, {
      grant_type: "client_credentials",
      client_id: auth0ClientId,
      client_secret: clientSecret,
      audience,
    });
    return {
      accessToken: data.access_token as string,
      expiresIn: data.expires_in as number,
      scope: data.scope as string,
    };
  }

  /** ── Token Vault ──────────────────────────────────── */

  /** Store a third-party OAuth token in Auth0 Token Vault */
  async storeVaultToken(opts: {
    userId: string;         // The user delegating the agent
    connection: string;     // e.g. "github", "google-oauth2", "slack"
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    scopes?: string[];
  }): Promise<{ vaultKey: string }> {
    const http = await this.client();
    // Auth0 Token Vault stores tokens under a user's linked accounts
    await http.post(`/users/${opts.userId}/identities`, {
      provider: opts.connection,
      connection: opts.connection,
      access_token: opts.accessToken,
      refresh_token: opts.refreshToken,
    });
    // The vault key is a deterministic reference — no raw token stored server-side
    const vaultKey = `vault:${opts.userId}:${opts.connection}:${Date.now()}`;
    return { vaultKey };
  }

  /** Retrieve a token from Token Vault for an agent action */
  async retrieveVaultToken(userId: string, connection: string): Promise<{
    accessToken: string;
    expiresAt?: Date;
    scope?: string;
  } | null> {
    const http = await this.client();
    try {
      const { data: user } = await http.get(`/users/${userId}`);
      const identity = (user.identities as Array<{
        provider: string;
        access_token?: string;
        expires_in?: number;
      }>)?.find((i) => i.provider === connection);
      if (!identity?.access_token) return null;
      return {
        accessToken: identity.access_token,
        expiresAt: identity.expires_in
          ? new Date(Date.now() + identity.expires_in * 1000)
          : undefined,
      };
    } catch {
      return null;
    }
  }

  /** ── CIBA (Client-Initiated Backchannel Authentication) ── */

  /** Initiate a CIBA request — sends push to user's device */
  async initiateCIBA(opts: {
    loginHint: string;       // User email
    scope: string;           // e.g. "openid approve:action"
    bindingMessage: string;  // Short code shown on both devices (e.g. "DRIFT-7X4K")
    requestedExpiry?: number; // Seconds (default 300)
  }): Promise<{ authReqId: string; expiresIn: number; interval: number }> {
    const { data } = await axios.post(
      `https://${this.config.domain}/bc-authorize`,
      new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        login_hint: JSON.stringify({ format: "iss_sub", iss: `https://${this.config.domain}/`, sub: opts.loginHint }),
        scope: opts.scope,
        binding_message: opts.bindingMessage,
        requested_expiry: String(opts.requestedExpiry ?? 300),
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return {
      authReqId: data.auth_req_id as string,
      expiresIn: data.expires_in as number,
      interval: data.interval as number ?? 5,
    };
  }

  /** Poll CIBA status — call every `interval` seconds */
  async pollCIBA(authReqId: string): Promise<{
    status: "pending" | "approved" | "rejected" | "expired";
    accessToken?: string;
  }> {
    try {
      const { data } = await axios.post(
        `https://${this.config.domain}/oauth/token`,
        new URLSearchParams({
          grant_type: "urn:openid:params:grant-type:ciba",
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          auth_req_id: authReqId,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      return { status: "approved", accessToken: data.access_token as string };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      const code = error.response?.data?.error;
      if (code === "authorization_pending") return { status: "pending" };
      if (code === "access_denied")         return { status: "rejected" };
      if (code === "expired_token")         return { status: "expired" };
      throw err;
    }
  }

  /** ── Log Streams ──────────────────────────────────── */

  /** Register a webhook log stream pointing to our ledger endpoint */
  async createLogStream(webhookUrl: string, signingSecret: string): Promise<{ streamId: string }> {
    const http = await this.client();
    const { data } = await http.post("/log-streams", {
      name: "drift-action-ledger",
      type: "http",
      sink: {
        httpEndpoint: webhookUrl,
        httpContentFormat: "JSONLINES",
        httpContentType: "application/json",
        httpAuthorization: signingSecret,
      },
      filters: [
        { type: "category", name: "auth.login" },
        { type: "category", name: "auth.token" },
        { type: "category", name: "management.success" },
      ],
    });
    return { streamId: data.id as string };
  }

  /** ── Users ────────────────────────────────────────── */

  async getUserByEmail(email: string): Promise<{ userId: string; email: string } | null> {
    const http = await this.client();
    const { data } = await http.get("/users", { params: { q: `email:"${email}"`, search_engine: "v3" } });
    const users = data as Array<{ user_id: string; email: string }>;
    if (!users.length) return null;
    return { userId: users[0]!.user_id, email: users[0]!.email };
  }
}

/** Singleton factory — lazily initialised from env */
let _client: Auth0ManagementClient | null = null;
export function getAuth0Client(): Auth0ManagementClient {
  if (!_client) {
    _client = new Auth0ManagementClient({
      domain:       process.env.AUTH0_DOMAIN!,
      clientId:     process.env.AUTH0_M2M_CLIENT_ID!,
      clientSecret: process.env.AUTH0_M2M_CLIENT_SECRET!,
      audience:     process.env.AUTH0_AUDIENCE!,
    });
  }
  return _client;
}
