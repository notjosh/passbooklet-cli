import crypto, { Hash } from 'crypto';
import Zip from '../zip/index.js';

type Config = {
  algorithm: string;
};

const defaultConfig: Config = {
  algorithm: 'sha1',
};

class ZipFileHasher {
  private hash: Hash;
  constructor(algorithm: string) {
    this.hash = crypto.createHash(algorithm);
  }

  async fromStream(stream: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        stream.on('data', (data) => {
          this.hash.update(data);
        });
        stream.on('end', () => {
          const hash = this.hash.digest('hex');
          return resolve(hash);
        });
      } catch (error) {
        return reject('hasher fail');
      }
    });
  }
}

class Manifesto {
  private zip: Zip;
  private config: Config;

  constructor(zip: Zip, config: Partial<Config> = {}) {
    this.zip = zip;
    this.config = {
      ...defaultConfig,
      ...config,
    };
  }

  async generate(): Promise<Record<string, string>> {
    const files = await Promise.all(
      await this.zip.map(async (path, file) => {
        const hasher = new ZipFileHasher(this.config.algorithm);
        const signature = await hasher.fromStream(file.nodeStream());

        return {
          path,
          signature,
        };
      })
    );

    return Object.fromEntries(files.map((file) => [file.path, file.signature]));
  }

  async hashFor(path: string): Promise<string> {
    const file = this.zip.fileAt(path);
    const hasher = new ZipFileHasher(this.config.algorithm);
    const signature = await hasher.fromStream(file.nodeStream());

    return signature;
  }
}

export default Manifesto;
