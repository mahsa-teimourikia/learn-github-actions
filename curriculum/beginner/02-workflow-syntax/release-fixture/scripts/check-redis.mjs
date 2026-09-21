import assert from "node:assert/strict";
import { createConnection } from "node:net";

const host = process.env.REDIS_HOST ?? "127.0.0.1";
const port = Number(process.env.REDIS_PORT ?? "6379");

const response = await new Promise((resolve, reject) => {
  const socket = createConnection({ host, port });
  socket.setTimeout(5_000);
  socket.once("connect", () => socket.write("*1\r\n$4\r\nPING\r\n"));
  socket.once("data", (data) => {
    socket.end();
    resolve(data.toString("utf8"));
  });
  socket.once("timeout", () => socket.destroy(new Error("Redis connection timed out")));
  socket.once("error", reject);
});

assert.equal(response, "+PONG\r\n");
console.log(`service responded on ${host}:${port}`);
