import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { app } from '@backend/app';
import { appRuntime } from '@backend/common/effect';
import { prismaService } from '@backend/common/prisma.service';

import { authService } from './auth.service';
import { cleanupOnce } from './whitelist-cleanup';
import { tokenWhitelistService } from './whitelist.service';

const PASSWORD = 'db-lifecycle-password';
const DAY_MS = 24 * 60 * 60 * 1000;

const sha256Hex = (value: string) =>
  crypto.createHash('sha256').update(value).digest('hex');

const USER_A = 'whitelist-db-user-a';
const USER_B = 'whitelist-db-user-b';

let userAId = 0;
let userBId = 0;

async function readRows(userId: number) {
  return prismaService.$queryRaw<
    { id: number; tokenHash: string; secondsUntilExpiry: number }[]
  >`
    SELECT "id", "tokenHash",
           extract(epoch FROM ("expiresAt" - now()))::int AS "secondsUntilExpiry"
    FROM "token_whitelist"
    WHERE "userId" = ${userId}
    ORDER BY "id" ASC
  `;
}

async function readWholeTable() {
  return prismaService.$queryRaw<Record<string, unknown>[]>`
    SELECT * FROM "token_whitelist" ORDER BY "id" ASC
  `;
}

async function loginAs(username: string) {
  const result = await appRuntime.runPromise(
    authService.login(username, PASSWORD, {
      device: 'vitest',
      ip: '127.0.0.1',
      userAgent: 'vitest',
    }),
  );

  if (!result) {
    throw new Error(`login failed for ${username}`);
  }

  return result.accessToken;
}

const callProtectedRoute = (token?: string) =>
  app.request('/api/cms/user-info', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

async function readProtectedRoute(token?: string) {
  const response = await callProtectedRoute(token);
  return { status: response.status, body: await response.json() };
}

const logout = (token: string) =>
  app.request('/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function expireEntry(token: string) {
  await prismaService.$executeRaw`
    UPDATE "token_whitelist"
    SET "expiresAt" = now() - interval '1 hour'
    WHERE "tokenHash" = ${sha256Hex(token)}
  `;
}

async function seedUserInfo(userId: number) {
  await prismaService.$executeRaw`
    INSERT INTO "user_info" ("id", "name", "contact", "occupation", "avatar", "aboutMe", "abstract", "userId")
    VALUES (${userId}, 'db-fixture', '{}', 'tester', '', '', '', ${userId})
  `;
}

async function purgeUsers() {
  await prismaService.$executeRaw`
    DELETE FROM "user_info"
    WHERE "userId" IN (SELECT "id" FROM "user" WHERE "username" IN (${USER_A}, ${USER_B}))
  `;
  await prismaService.$executeRaw`
    DELETE FROM "user" WHERE "username" IN (${USER_A}, ${USER_B})
  `;
}

describe('token whitelist against a real database', () => {
  beforeAll(async () => {
    await purgeUsers();
    const password = await bcrypt.hash(PASSWORD, 10);
    const userA = await prismaService.user.create({
      data: {
        username: USER_A,
        password,
        email: `${USER_A}@db.test`,
        salt: 'db',
      },
    });
    const userB = await prismaService.user.create({
      data: {
        username: USER_B,
        password,
        email: `${USER_B}@db.test`,
        salt: 'db',
      },
    });
    userAId = userA.id;
    userBId = userB.id;
    await seedUserInfo(userAId);
    await seedUserInfo(userBId);
  });

  afterAll(async () => {
    await prismaService.$executeRaw`DELETE FROM "token_whitelist"`.catch(
      () => undefined,
    );
    await purgeUsers();
  });

  beforeEach(async () => {
    await prismaService.$executeRaw`DELETE FROM "token_whitelist"`;
  });

  it('stores only the sha256 of an issued token, expiring it one day out', async () => {
    const token = await loginAs(USER_A);

    const rows = await readRows(userAId);

    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).toBe(sha256Hex(token));
    expect(rows[0].tokenHash).not.toBe(token);
    expect(rows[0].tokenHash).toHaveLength(64);

    const table = await readWholeTable();
    expect(JSON.stringify(table)).not.toContain(token);

    expect(Math.abs(rows[0].secondsUntilExpiry - DAY_MS / 1000)).toBeLessThan(
      60,
    );
  });

  it('accepts a request carrying a whitelisted token and refuses one without it', async () => {
    const token = await loginAs(USER_A);

    const accepted = await readProtectedRoute(token);
    const refused = await readProtectedRoute();

    expect(accepted.status).toBe(200);
    expect(accepted.body.code).toBe('0000');
    expect(refused.status).toBe(401);
    expect(refused.body.code).toBe('ERR0002');
  });

  it('drops the whitelist row on logout so the same token is refused afterwards', async () => {
    const token = await loginAs(USER_A);

    expect((await readProtectedRoute(token)).body.code).toBe('0000');

    const loggedOut = await logout(token);
    expect(loggedOut.status).toBe(200);

    expect(await readRows(userAId)).toHaveLength(0);
    expect((await readProtectedRoute(token)).status).toBe(401);
  });

  it('refuses a token whose entry has expired and deletes that entry', async () => {
    const token = await loginAs(USER_A);
    await expireEntry(token);

    expect(await readRows(userAId)).toHaveLength(1);
    expect((await readProtectedRoute(token)).status).toBe(401);
    expect(await readRows(userAId)).toHaveLength(0);
  });

  it('lets the hourly cleanup delete expired entries and keep live ones', async () => {
    const expiredToken = await loginAs(USER_A);
    const liveToken = await loginAs(USER_B);
    await expireEntry(expiredToken);

    const removed = await appRuntime.runPromise(cleanupOnce);

    expect(removed).toBe(1);
    expect(await readRows(userAId)).toHaveLength(0);
    expect(await readRows(userBId)).toHaveLength(1);
    expect((await readProtectedRoute(liveToken)).body.code).toBe('0000');
  });

  it('removes one entry by id and every entry of one user without touching another', async () => {
    await loginAs(USER_A);
    await wait(1100);
    const secondTokenA = await loginAs(USER_A);
    await loginAs(USER_B);

    const rowsA = await readRows(userAId);
    expect(rowsA).toHaveLength(2);
    expect(
      await appRuntime.runPromise(tokenWhitelistService.countByUser(userAId)),
    ).toBe(2);

    await appRuntime.runPromise(tokenWhitelistService.removeById(rowsA[0].id));
    expect(await readRows(userAId)).toHaveLength(1);
    expect((await readProtectedRoute(secondTokenA)).body.code).toBe('0000');

    const listed = await appRuntime.runPromise(
      tokenWhitelistService.findByUser(userAId),
    );
    expect(listed.map((entry) => entry.id)).toEqual([rowsA[1].id]);

    await appRuntime.runPromise(tokenWhitelistService.removeByUser(userAId));

    expect(await readRows(userAId)).toHaveLength(0);
    expect((await readProtectedRoute(secondTokenA)).status).toBe(401);
    expect(await readRows(userBId)).toHaveLength(1);
  });
});
