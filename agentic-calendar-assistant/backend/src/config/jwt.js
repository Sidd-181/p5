const jwtSecret = process.env.JWT_SECRET ?? "agentic-calendar-dev-secret";
const jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? "7d";

export function getJwtConfig() {
  return { jwtSecret, jwtExpiresIn };
}
