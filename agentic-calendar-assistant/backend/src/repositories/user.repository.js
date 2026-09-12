import { getPool } from "../db/pool.js";

function mapUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    authUserId: row.auth_user_id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}

export function toPublicUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export async function ensureUser(input) {
  const result = await getPool().query(
    `
        INSERT INTO users (auth_user_id, email, name)
        VALUES ($1, $2, $3)
        ON CONFLICT (auth_user_id)
        DO UPDATE SET
          email = COALESCE(EXCLUDED.email, users.email),
          name = COALESCE(EXCLUDED.name, users.name)
        RETURNING *
        `,
    [input.authUserId, input.email ?? null, input.name ?? null],
  );

  return mapUser(result.rows[0]);
}

export async function createLocalUser(input) {
  const result = await getPool().query(
    `
        INSERT INTO users (auth_user_id, email, name, password_hash)
        VALUES (gen_random_uuid()::text, $1, $2, $3)
        RETURNING *
        `,
    [input.email, input.name, input.passwordHash],
  );

  const user = mapUser(result.rows[0]);

  await getPool().query(
    `
        UPDATE users
        SET auth_user_id = id::text
        WHERE id = $1
        `,
    [user.id],
  );

  return findUserById(user.id);
}

export async function findUserByEmail(email) {
  const result = await getPool().query(
    `
        SELECT *
        FROM users
        WHERE lower(email) = lower($1)
        LIMIT 1
        `,
    [email],
  );

  return mapUser(result.rows[0]);
}

export async function findUserById(id) {
  const result = await getPool().query(
    `
        SELECT *
        FROM users
        WHERE id = $1
        LIMIT 1
        `,
    [id],
  );

  return mapUser(result.rows[0]);
}

export async function findUserByAuthUserId(authUserId) {
  const result = await getPool().query(
    `
        SELECT *
        FROM users
        WHERE auth_user_id = $1
        LIMIT 1
        `,
    [authUserId],
  );

  return mapUser(result.rows[0]);
}
