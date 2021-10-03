// `Buffer` to `ArrayBuffer` wrapper

const buf2ab = (buf: Buffer): ArrayBuffer => new Uint8Array(buf).buffer;

export default buf2ab;
