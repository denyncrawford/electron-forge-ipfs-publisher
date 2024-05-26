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
import { readFile, writeFile } from "node:fs/promises";
import { ensureDir, exists } from "fs-extra";
import { type RevisionFile } from "./types";
import { keysDirname, nameKeyPath, revisionKeyPath } from "./utils";

export const createPublishingName = async () => {
  const name = await create();
  await writeFile(nameKeyPath, name.key.bytes);
};

export const loadPublishingName = async () => {
  await ensureDir(keysDirname);
  const existsPrivateKey = await exists(nameKeyPath);

  if (!existsPrivateKey) {
    await createPublishingName();
  }

  const key = await readFile(nameKeyPath);
  const name = await from(key);

  return name;
};

export const writeRevision = async (
  { value: latest }: Revision,
  nameKey: WritableName,
  currentRevision?: RevisionFile
) => {
  await ensureDir(keysDirname);

  await writeFile(
    revisionKeyPath,
    JSON.stringify({
      ...(currentRevision || {}),
      ipfs: `/ipfs/${latest.toString()}`,
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
    const revisionJson = await readFile(revisionKeyPath, "utf8");
    const revisionFile = JSON.parse(revisionJson) as RevisionFile;
    revision = await increment(latestRevision, value);
    await writeRevision(revision, nameKey, revisionFile);
  }

  await publish(revision, nameKey.key);
};
