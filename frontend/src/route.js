export const DEFAULT_LOGIN_REDIRECT = "/";

export const authRoute = "/auth";

export const apiRoute = "/auth-api";

/**
 * Pages a visitor can see without an account. Everything else redirects to
 * the public landing page rather than dumping them straight on a login form.
 */
export const publicRoutes = ["/welcome"];
