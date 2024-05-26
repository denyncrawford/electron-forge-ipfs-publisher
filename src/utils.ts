import { join } from "node:path";
import { Driver } from "./types";
import * as storage from "node-persist";
import { type InitOptions } from "node-persist";

export const keysDirname = join(process.cwd(), ".w3name");
export const nameKeyPath = join(keysDirname, "name.key");
export const revisionKeyPath = join(keysDirname, "../publications.json");
export const defaultGateway = "https://w3s.link";
export const sessionDirname = join(keysDirname, 'session');

// Storage driver utils

export const reviver = (_: string, v: any) => {
  if (!v) return v;
  if (v.$url) return new URL(v.$url);
  if (v.$map) return new Map(v.$map);
  if (v.$bytes) return new Uint8Array(v.$bytes);
  return v;
};

export const replacer = (k: string, v: any) => {
  if (v instanceof URL) {
    return { $url: v.toString() };
  } else if (v instanceof Map) {
    return { $map: [...v.entries()] };
  } else if (v instanceof Uint8Array) {
    return { $bytes: [...v.values()] };
  } else if (v instanceof ArrayBuffer) {
    return { $bytes: [...new Uint8Array(v).values()] };
  } else if (v?.type === "Buffer" && Array.isArray(v.data)) {
    return { $bytes: v.data };
  }
  return v;
};

export class StoreConf<T extends Record<string, any>> implements Driver<T> {
  path: string | undefined;
  #options: Partial<InitOptions> = {};

  constructor(opts: Partial<InitOptions> = {}) {
    this.#options = opts;
    this.path = opts.dir;
  }

  async open() {}

  async close() {}

  async init() {
    await storage.init({
      ...this.#options,
      stringify: (data) => JSON.stringify(data, replacer),
      parse: (data) => JSON.parse(data, reviver),
    });
  }

  async reset() {
    await storage.clear();
  }

  async save(data: T) {
    if (typeof data === "object") {
      data = { ...data };
      for (const [k, v] of Object.entries(data)) {
        if (v === undefined) {
          delete data[k];
        }
      }
    }
    await storage.setItem("data", data);
  }

  /** @returns {Promise<T|undefined>} */
  async load() {
    const data = (await storage.getItem("data")) || {};
    if (Object.keys(data).length === 0) return;
    return data;
  }
}
