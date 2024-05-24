import { create } from "@web3-storage/w3up-client";
import fs from "node:fs/promises";
import { File } from "@web-std/file";
// @ts-ignore
import mime from "mime";
import { DID, Email, IpfsArtifact, PublisherIpfsConfig } from "./types.js";

let mainClient: Awaited<ReturnType<typeof create>>;

export const getClient = async (email: Email, space: DID) => {
  if (!mainClient) {
    mainClient = await create();
    await mainClient.login(email);
    await mainClient.setCurrentSpace(space);
  }
  return mainClient;
};

export async function upload(
  artifacts: IpfsArtifact[],
  config: PublisherIpfsConfig,
  logger: (message: string) => void
) {
  const client = await getClient(config.web3StorageEmail!, config.space!);

  let bytesToUpload = 0;
  const artifactFiles = await Promise.all(
    artifacts.map(async (artifact) => {
      const read = await fs.readFile(artifact.path);
      bytesToUpload += read.byteLength;
      const file = new File([read], artifact.key!, {
        type: mime.getType(artifact.path) || "application/json",
      });
      return file;
    })
  );

  const directoryCid = await client.uploadDirectory(artifactFiles, {
    onUploadProgress: (progress) => {
      logger(`Uploaded ${progress.loaded} of ${bytesToUpload || progress.total}`);
    },
  });
  return directoryCid;
}
