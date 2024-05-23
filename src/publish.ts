import {
  from,
  create,
  v0,
  publish,
  parse,
  increment,
  resolve,
  Revision,
} from "w3name";
import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { ensureDir, exists } from "fs-extra";
import { RevisionFile } from "./types.js";

const keysDirname = join(process.cwd(), ".w3name");
const nameKeyPath = join(keysDirname, "name.key");
const revisionKeyPath = join(keysDirname, "../ipfs.revision.json");

await ensureDir(keysDirname);

export const createPublishingName = async () => {
  const name = await create();
  await writeFile(nameKeyPath, name.key.bytes);
};

export const loadPublishingName = async () => {
  const existsPrivateKey = await exists(keysDirname);

  if (!existsPrivateKey) {
    await createPublishingName();
  }

  const key = await readFile(nameKeyPath);
  const name = await from(key);

  return name;
};

export const writeRevision = async ({ value: latest }: Revision) => {
  await writeFile(
    revisionKeyPath,
    JSON.stringify({
      latest,
    })
  );
};

export const publishRevision = async (value: string) => {
  const nameKey = await loadPublishingName();
  const existsRevision = await exists(revisionKeyPath);

  let revision: Revision;

  if (!existsRevision) {
    revision = await v0(nameKey, value);
    await writeRevision(revision);
  } else {
    const revisionJson = await readFile(revisionKeyPath, "utf8");
    const revisionFile = JSON.parse(revisionJson) as RevisionFile;
    const revisionAsName = parse(revisionFile.latest);
    const latestRevision = await resolve(revisionAsName);
    revision = await increment(latestRevision, value);
    await writeRevision(revision);
  }

  await publish(revision, nameKey.key);
};
