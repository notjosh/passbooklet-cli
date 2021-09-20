type Barcode = {
  altText?: string;
  format: string;
  message: string;
  messageEncoding: string;
};

type SharedPass = {
  description: string;
  formatVersion: 1;
  organizationName: string;
  passTypeIdentifier: string;
  serialNumber: string;
  teamIdentifier: string;

  appLaunchURL?: string;
  associatedStoreIdentifiers?: number[];

  userInfo?: Record<string, any>;

  expirationDate?: string;
  voided?: boolean;

  beacons?: {
    major?: number;
    minor?: number;
    proximityUUID: string;
    relevantText?: string;
  }[];
  locations?: {
    altitude?: number;
    latitude: number;
    longitude: number;
    relevantText?: string;
  }[];
  maxDistance?: number;
  relevantDate?: string;

  barcode?: Barcode;
  barcodes?: Barcode[];
  backgroundColor?: string;
  foregroundColor?: string;
  groupingIdentifier?: string;
  labelColor?: string;
  logoText?: string;
  suppressStripShine?: boolean;

  authenticationToken?: string;
  webServiceURL?: string;

  nfc?: {
    message: string;
    encryptionPublicKey?: string;
  };
};

type DataDetector =
  | 'PKDataDetectorTypePhoneNumber'
  | 'PKDataDetectorTypeLink'
  | 'PKDataDetectorTypeAddress'
  | 'PKDataDetectorTypeCalendarEvent';
type TextAlignment =
  | 'PKTextAlignmentLeft'
  | 'PKTextAlignmentCenter'
  | 'PKTextAlignmentRight'
  | 'PKTextAlignmentNatural';

type Field = {
  attributedValue?: string;
  changeMessage?: string;
  dataDetectorTypes?: DataDetector[];
  key: string;
  label?: string;
  textAlignment?: TextAlignment;
  value: string | number;
};

type PassStructure = {
  auxiliaryFields?: Field[];
  backFields?: Field[];
  headerFields?: Field[];
  primaryFields?: Field[];
  secondaryFields?: Field[];
};

type BoardingPass = SharedPass & {
  boardingPass: PassStructure & {
    transitType:
      | 'PKTransitTypeAir'
      | 'PKTransitTypeBoat'
      | 'PKTransitTypeBus'
      | 'PKTransitTypeGeneric'
      | 'PKTransitTypeTrain';
  };
};

type CouponPass = SharedPass & {
  coupon: PassStructure;
};

type EventTicketPass = SharedPass & {
  eventTicket: PassStructure;
};

type GenericPass = SharedPass & {
  generic: PassStructure;
};

type StoreCardPass = SharedPass & {
  storeCard: PassStructure;
};

export type Pass =
  | BoardingPass
  | CouponPass
  | EventTicketPass
  | GenericPass
  | StoreCardPass;
