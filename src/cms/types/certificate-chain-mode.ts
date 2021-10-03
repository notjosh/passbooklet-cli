export enum CMSCertificateChainMode {
  none,
  signerOnly,
  chain, // everything up until the root
  chainWithRoot,
}
