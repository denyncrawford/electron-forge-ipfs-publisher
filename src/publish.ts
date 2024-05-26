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

/**
 * Creates a new publishing name
 * This method creates a ney key pair and writes it to the keys directory
 * the key is used to create a IPNS / W3S unique and persistent name
 * which is used to publish mutable data to IPFS.
 * 
 * The key stored in the keys directory should not be uploaded ignored by git
 * and should not be exposed.
 */
export const createPublishingName = async () => {
  const name = await create();
  await writeFile(nameKeyPath, name.key.bytes);
};

/**
 * Loads the publishing name from the keys directory
 * This method reads the key from the keys directory and returns it.
 * @returns name: {@link WritableName}
 */
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

/**
 * Writes the latest revision to the revision file
 * This method writes the latest revision to the revision file
 * locates in the root of the project this file should not be mutated by the user
 * @param latest {@link Revision}
 * @param nameKey {@link WritableName}
 * @param currentRevision? {@link RevisionFile}
 */
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
      ipfs: latest.toString(),
      w3s: `/name/${nameKey.toString()}`,
      ipns: `/ipns/${nameKey.toString()}`,
    })
  );
};

/**
 * Publishes the latest revision to IPFS
 * This method publishes the latest revision to IPFS
 * @param value IPFS current path with the dynamic CID: {@link string}
 */
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
