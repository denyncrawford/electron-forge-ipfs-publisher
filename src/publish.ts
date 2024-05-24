import {
  from,
  create,
  v0,
  publish,
  increment,
  resolve,
  Revision,
  WritableName,
} from "w3name";
import fs from "node:fs/promises";
import path from "path";
import { RevisionFile } from "./types";
import { ensureDir, exists } from "fs-extra";

const keysDirname = path.join(process.cwd(), ".w3name");
const nameKeyPath = path.join(keysDirname, "name.key");
const revisionKeyPath = path.join(keysDirname, "../ipfs.forge.json");

export const createPublishingName = async () => {
  const name = await create();
  await fs.writeFile(nameKeyPath, name.key.bytes);
};

export const loadPublishingName = async () => {
  await ensureDir(keysDirname);
  const existsPrivateKey = await exists(nameKeyPath);

  if (!existsPrivateKey) {
    await createPublishingName();
  }

  const key = await fs.readFile(nameKeyPath);
  const name = await from(key);

  return name;
};

export const writeRevision = async (
  { value: latest }: Revision,
  nameKey: WritableName,
  currentRevision?: RevisionFile
) => {
  await ensureDir(keysDirname);

  await fs.writeFile(
    revisionKeyPath,
    JSON.stringify({
      ...(currentRevision || {}),
      latest_revision: latest.toString(),
      w3s: `/name/${nameKey.toString()}`,
      ipns: `/ipns/${nameKey.toString()}`,
    })
  );
};

export const publishRevision = async (value: string) => {
  const nameKey = await loadPublishingName();
  const existsRevision = await exists(revisionKeyPath);

  let revision: Revision;

  if (!existsRevision) {
    revision = await v0(nameKey, value);
    await writeRevision(revision, nameKey);
  } else {
    const latestRevision = await resolve(nameKey);
    const revisionJson = await fs.readFile(revisionKeyPath, "utf8");
    const revisionFile = JSON.parse(revisionJson) as RevisionFile;
    revision = await increment(latestRevision, value);
    await writeRevision(revision, nameKey, revisionFile);
  }

  await publish(revision, nameKey.key);
};
