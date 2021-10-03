export enum PEMContentKind {
  Certificate,
  PrivateKey,
}

const nameForKind = (kind: PEMContentKind): string => {
  switch (kind) {
    case PEMContentKind.Certificate:
      return 'CERTIFICATE';
    case PEMContentKind.PrivateKey:
      return 'PRIVATE KEY';
  }
};

export default async (
  contents: string,
  kind: PEMContentKind
): Promise<Buffer> => {
  const name = nameForKind(kind);

  const beginString = `-----BEGIN ${name}-----`;
  const endString = `-----END ${name}-----`;

  const beginIndex = contents.indexOf(beginString);
  const endIndex = contents.indexOf(endString, beginIndex + beginString.length);

  const payload = contents.substring(beginIndex + beginString.length, endIndex);
  return Buffer.from(payload.trim(), 'base64');
};
