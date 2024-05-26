import { join } from "node:path";

export const keysDirname = join(process.cwd(), ".w3name");
export const nameKeyPath = join(keysDirname, "name.key");
export const revisionKeyPath = join(keysDirname, "../ipfs.forge.json");
export const defaultGateway = "https://w3s.link"
