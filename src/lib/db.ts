import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

type Sql = NeonQueryFunction<false, false>;
let client: Sql | null = null;

// Connect lazily so `next build` can load routes without DATABASE_URL;
// a missing URL only fails when a request actually queries the database.
function getClient(): Sql {
  if (!client) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    client = neon(process.env.DATABASE_URL);
  }
  return client;
}

export const sql = new Proxy((() => {}) as unknown as Sql, {
  apply: (_target, _this, args) => Reflect.apply(getClient(), undefined, args),
  get: (_target, prop) => {
    const value = Reflect.get(getClient(), prop);
    return typeof value === "function" ? value.bind(getClient()) : value;
  },
});
