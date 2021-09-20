import fs from 'fs';
import JSZip from 'jszip';

class Zip {
  static async readAtPath(path: string): Promise<Zip> {
    const buffer = await new JSZip.external.Promise<Buffer>(
      (resolve, reject) => {
        fs.readFile(path, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      }
    );

    const jszip = await JSZip.loadAsync(buffer);
    return new Zip(jszip);
  }

  private zip: JSZip;

  private constructor(jszip: JSZip) {
    this.zip = jszip;
  }

  async saveTo(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.zip
        .generateNodeStream({ streamFiles: true })
        .pipe(fs.createWriteStream(path))
        .on('error', (error) => {
          reject(error);
        })
        .on('finish', () => {
          resolve();
        });
    });
  }

  fileAt(path: string): JSZip.JSZipObject {
    const file = this.zip.file(path);

    if (file == null) {
      throw new Error(`no path in zip at ${path}`);
    }

    return file;
  }

  async stringFor(path: string) {
    return this.zip.file(path)?.async('string');
  }

  async bufferFor(path: string) {
    return this.zip.file(path)?.async('nodebuffer');
  }

  async remove(path: string) {
    this.zip.remove(path);
  }

  async writeString(path: string, data: string): Promise<void> {
    this.zip.file(path, data, { binary: false, base64: false });
  }

  async writeBinary(path: string, data: Buffer): Promise<void> {
    this.zip.file(path, data, { binary: true, base64: false });
  }

  map<T>(callback: (relativePath: string, file: JSZip.JSZipObject) => T) {
    const out = [] as T[];

    this.zip.forEach((path, file) => {
      out.push(callback(path, file));
    });

    return out;
  }
}

export default Zip;
