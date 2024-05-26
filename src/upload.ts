import { create } from "@web3-storage/w3up-client";
import { readFile } from "node:fs/promises";
import { File } from "@web-std/file";
import mime from "mime";
import {
  DID,
  Email,
  PublisherIpfsConfig,
  ResultBlock,
  RevisionFile,
  SquirrelMacReleases,
  InternalReleaseData,
} from "./types.js";
import axios from "axios";
import { defaultGateway, revisionKeyPath, sessionDirname } from "./utils";
import { StoreConf } from "./utils";

let mainClient: Awaited<ReturnType<typeof create>>;
let readLocal: string;

/**
 * Create a new IPFS client
 * @param email {@link Email}
 * @param space {@link DID}
 * @returns Client
 */

export const getClient = async (config: PublisherIpfsConfig) => {
  if (!mainClient) {
    const store = !!config.enableExperimentalSession
      ? new StoreConf({
          dir: sessionDirname,
        })
      : undefined;

    await store?.init?.();

    mainClient = await create({
      store,
    });

    await mainClient.login(config.web3StorageEmail!);
    const currentSpace = config.space
      ? config.space
      : (await mainClient.createSpace("electron-forge")).did();
    await mainClient.setCurrentSpace(currentSpace);
  }
  return mainClient;
};

/**
 * Get the latest releases file for a given artifact
 * @param artifact {@link InternalReleaseData}
 * @returns [SquirrelMacReleases, string] - the latest releases file and the remote path to it
 */
const getLatestReleasesFile = async (
  artifact: InternalReleaseData
): Promise<[SquirrelMacReleases, string]> => {
  try {
    readLocal = readLocal || (await readFile(revisionKeyPath, "utf8"));
    const ipfsPath = (JSON.parse(readLocal) as RevisionFile).ipfs;
    const remoteLastPath = `${defaultGateway}${ipfsPath}/${artifact.key}`;
    const { data } = await axios.get<SquirrelMacReleases>(remoteLastPath);
    return [data, remoteLastPath];
  } catch (e) {
    return [
      {
        currentRelease: "",
        releases: [],
      } as SquirrelMacReleases,
      "",
    ];
  }
};

/**
 * Upload the artifacts and the latest releases file to IPFS
 * @param artifacts Array<{@link ResultBlock}>
 * @param config {@link PublisherIpfsConfig}
 * @param logger (message: string) => void
 * @returns the directory CID
 */
export async function upload(
  artifacts: ResultBlock[],
  config: PublisherIpfsConfig,
  logger: (message: string) => void
) {
  const client = await getClient(config);

  let bytesToUpload = 0;

  logger(`Finding previous releases for ${artifacts.length} results`);

  const releaseArtifactsFiles = !config.overrideReleasesFile
    ? []
    : await Promise.all(
        artifacts
          .flatMap((e) => e.releaseArtifact)
          // If the release artifact is the same folder as previous release artifacts, then it's a duplicate
          .filter((e, i, a) => a.findIndex((e2) => e2.key === e.key) === i)
          .map(async (artifact) => {
            const [read, remoteLastPath] = await getLatestReleasesFile(
              artifact
            );

            // manipulate new version info
            const newVersion = {
              version: artifact.version,
              updateTo: {
                ...artifact.updateTo,
                url: remoteLastPath,
              },
            };

            const upgradedReleases: SquirrelMacReleases = {
              currentRelease: artifact.version,
              releases: [
                ...(read.releases?.filter(
                  (e) => e.version !== artifact.version
                ) || []),
                newVersion,
              ],
            };

            const buffer = Buffer.from(JSON.stringify(upgradedReleases));
            const file = new File([buffer], artifact.key!, {
              type: "application/json",
            });

            return file;
          })
      );

  logger(`Reading artifacts...`);

  const artifactFiles = await Promise.all(
    artifacts
      .flatMap((e) => e.artifacts)
      .map(async (artifact) => {
        const read = await readFile(artifact.path);
        bytesToUpload += read.byteLength;
        const file = new File([read], artifact.key!, {
          type: mime.getType(artifact.path) || "application/json",
        });
        return file;
      })
  );

  logger(`Uploading artifacts...`);

  const directoryCid = await client.uploadDirectory(
    [...artifactFiles, ...releaseArtifactsFiles],
    {
      onUploadProgress: (progress) => {
        logger(
          `Uploaded ${progress.loaded} of ${bytesToUpload || progress.total}`
        );
      },
    }
  );
  return directoryCid;
}
