import path from "node:path";
import { promises as fs } from "node:fs";
import { Pool } from "pg";
import { faker } from "@faker-js/faker/locale/en_US";

const NUM_ADDRESSES = 100;
const NUM_INTERESTS = 100;
const NUM_USERS = 1000;

async function schema(client: Pool) {
  const cmds = await fs
    .readFile(path.resolve(__dirname, "..", "..", "schema.sql"), "utf-8")
    .then((txt) => txt.split("\n\n"));
  for (const cmd of cmds) {
    await client.query(cmd);
  }
}

async function mkAddress(client: Pool) {
  const state = faker.location.state({ abbreviated: true });
  const resp = await client.query(
    "INSERT INTO addresses (state, city, line1, line2, zip, plus_4) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;",
    [
      state,
      faker.location.city(),
      faker.location.streetAddress(),
      undefined,
      faker.location.zipCode({ state }),
      undefined,
    ],
  );
  return resp.rows[0].id;
}

async function mkUser(client: Pool, addressId: number) {
  const resp = await client.query(
    "INSERT INTO users (address_id, first_name, last_name, age) VALUES ($1, $2, $3, $4) RETURNING id;",
    [
      addressId,
      faker.person.firstName(),
      faker.person.lastName(),
      faker.number.int({ min: 13, max: 100 }),
    ],
  );
  return resp.rows[0].id;
}

async function mkInterest(client: Pool, interest: string) {
  const resp = await client.query(
    "INSERT INTO interests (name) VALUES ($1) RETURNING id;",
    [interest],
  );
  return resp.rows[0].id;
}

async function mkUserInterest(
  client: Pool,
  userId: number,
  interestId: number,
) {
  await client.query(
    "INSERT INTO users_interests (user_id, interest_id) VALUES ($1, $2);",
    [userId, interestId],
  );
}

async function mkAddresses(client: Pool): Promise<Array<number>> {
  const ids = [];
  for (let i = 0; i < NUM_ADDRESSES; i++) {
    ids.push(await mkAddress(client));
  }
  return ids;
}

async function mkUsers(
  client: Pool,
  addressIds: Array<number>,
): Promise<Array<number>> {
  const ids = [];
  const max = addressIds.length - 1;
  for (let i = 0; i < NUM_USERS; i++) {
    const addressId = addressIds[faker.number.int({ min: 0, max })];
    ids.push(await mkUser(client, addressId));
  }
  return ids;
}

async function mkInterests(client: Pool): Promise<Array<number>> {
  const ids = [];
  const seen = new Set<string>();
  for (let i = 0; i < NUM_INTERESTS; i++) {
    while (true) {
      const name = faker.word.noun();
      if (!seen.has(name)) {
        seen.add(name);
        ids.push(await mkInterest(client, name));
        break;
      }
    }
  }
  return ids;
}

async function mkUserInterests(
  client: Pool,
  userIds: Array<number>,
  interestIds: Array<number>,
) {
  const maxInterest = interestIds.length - 1;
  for (const u of userIds) {
    const ninterests = faker.number.int({ min: 0, max: 3 });
    for (let i = 0; i < ninterests; i++) {
      const interest =
        interestIds[faker.number.int({ min: 0, max: maxInterest })];
      await mkUserInterest(client, u, interest);
    }
  }
}

async function truncate(client: Pool) {
  await client.query("TRUNCATE TABLE addresses CASCADE");
  await client.query("TRUNCATE TABLE interests CASCADE");
  await client.query("TRUNCATE TABLE users CASCADE");
}

async function main() {
  const pool = new Pool({
    host: "localhost",
    user: "postgres",
    password: "postgres",
    port: 6545,
  });
  await schema(pool);
  await truncate(pool);
  const addresses = await mkAddresses(pool);
  const interests = await mkInterests(pool);
  const users = await mkUsers(pool, addresses);
  await mkUserInterests(pool, users, interests);
  console.log(`
  Created ${NUM_ADDRESSES} addresses
  Created ${NUM_INTERESTS} interests
  Created ${NUM_USERS} users`);
  await pool.end();
}

main();
