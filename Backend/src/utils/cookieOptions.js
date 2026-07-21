/**
 * Shared auth cookie options — ensures `res.cookie()` and `res.clearCookie()`
 * always agree on the same flags, which is required for browsers to actually
 * clear the cookie on logout.
 */
function getAuthCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  };
}

module.exports = { getAuthCookieOptions };
