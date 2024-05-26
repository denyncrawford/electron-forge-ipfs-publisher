export interface RevisionFile {
  ipfs: string;
  ipns: string;
  w3s: string;
}

export interface SquirrelMacRelease {
  version: string;
  updateTo: {
    version: string;
    pub_date: string;
    notes: string;
    name: string;
    url: string;
  };
}

export interface SquirrelMacReleases {
  currentRelease: string;
  releases?: SquirrelMacRelease[];
}

export interface IpfsArtifact {
  path: string;
  keyPrefix: string;
  platform: string;
  arch: string;
  key?: string;
}

export type InternalReleaseData = IpfsArtifact & SquirrelMacRelease;

export interface ResultBlock {
  releaseArtifact: InternalReleaseData;
  artifacts: IpfsArtifact[];
}

export type Email = `${string}@${string}`;
export type DID = `did:${string}:${string}`;

export interface PublisherIpfsConfig {
  /**
   * The email address to use for your Web3.Storage account
   */
  web3StorageEmail: Email;

  /**
   * The space to upload to
   */
  space?: DID;

  /**
   * the folder to upload to
   */
  folder?: string;

  /**
   * Custom function to provide the key to upload a given file to
   */
  keyResolver?: (fileName: string, platform: string, arch: string) => string;

  /**
   * Publisher release notes
   */

  notes?: string;

  /**
   * Persist the session data to the .w3name folder using UCAN (experimental)
   */

  enableExperimentalSession?: boolean;

  /**
   * Override the releases file
   */
  overrideReleasesFile?: boolean;

  /**
   * Enable autogenerate space
   */
  autoGenerateSpace?: boolean;
}

export interface Driver<T> {
  /**
   * Open driver
   */
  open: () => Promise<void>;
  /**
   * Clean up and close driver
   */
  close: () => Promise<void>;
  /**
   * Persist data to the driver's backend
   */
  save: (data: T) => Promise<void>;
  /**
   * Loads data from the driver's backend
   */
  load: () => Promise<T | undefined>;
  /**
   * Clean all the data in the driver's backend
   */
  reset: () => Promise<void>;
}
