CREATE TABLE
  IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    state VARCHAR(2) NOT NULL,
    city TEXT,
    line1 TEXT,
    line2 TEXT,
    zip VARCHAR(5),
    plus_4 VARCHAR(4)
  );

CREATE INDEX IF NOT EXISTS addresses_state ON addresses (state);

CREATE TABLE
  IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    address_id INTEGER NOT NULL REFERENCES addresses (id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    age INTEGER NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS interests (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL);

CREATE TABLE
  IF NOT EXISTS users_interests (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id),
    interest_id INTEGER NOT NULL REFERENCES interests (id)
  );
