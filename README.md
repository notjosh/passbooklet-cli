# `passbooklet-cli`

Assists you modify & re-sign `.pkpass` files.

## Set Up

First, you need enough ✨Apple developer✨ access to generate a valid certificate. Do that, export the pair as `.p12`.

Next, make sure you have your `.env` file in place:

```
cp .env.example .env
```

### Key & Certificate

From above, you should have the `.p12` file. We'll run a command to generate an value for the `.env` file as follows:

```
# this will prompt you for a password - it's asking for the password you used when exporting from Keychain
openssl pkcs12 -in /path/to/Certificates.p12 -nodes | sed 's/$/\\n/' | tr -d '\n'
```

Use that for your `CERTIFICATE` variable used in `.env`. Make sure you include the quotes! It should start like:

```
CERTIFICATE="Bag Attributes\n    friendlyName: Pass Type ID: ...
```

### Team Identifier Pass Type Identifier

From our `.p12`, we can also extract the `TEAM_IDENTIFIER` and `PASS_TYPE_IDENTIFIER` values as follows:

```
# this will prompt you for a password - it's asking for the password you used when exporting from Keychain
openssl pkcs12 -in /path/to/Certificates.p12 -nodes | openssl x509 -noout -subject -nameopt multiline
```

This will create output such as:

```
subject=
    userId                    = pass.com.example.foo.bar
    commonName                = Pass Type ID: pass.com.example.foo.bar
    organizationalUnitName    = ABC123DEF456
    organizationName          = Firstname Lastname
    countryName               = US
```

Using this example, we set environment variables:

```
TEAM_IDENTIFIER=ABC123DEF456
PASS_TYPE_IDENTIFIER=pass.com.example.foo.bar
```

### Wwdr Intermediate Certificate

You can find this on [Apple's Certificate Authority page](https://www.apple.com/certificateauthority/) - at the time of writing, I used [this one](https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer).

Once it's there, we'll run a command to generate the variable:

```
security find-certificate -p -c 'Apple Worldwide Developer Relations Certification Authority' login.keychain | sed 's/$/\\n/' | tr -d '\n'
```

Use that for your `WWDR_CERTIFICATE` variable used in `.env`. Make sure you include the quotes! It should start like:

```
WWDR_CERTIFICATE="-----BEGIN CERTIFICATE-----\n
```

#### commands

##### export wwdr cert:

`security find-certificate -p -c 'Apple Worldwide Developer Relations Certification Authority' login.keychain > data/certificates/wwdr.pem`

our p12 -> pem:

`openssl pkcs12 -in ./data/certificates/Certificates.p12 -out ./data/certificates/combined.pem -passin pass:password -nodes`

make single line for .env:

`cat ./data/certificates/combined.pem | sed 's/$/\\n/' | tr -d '\n'`

##### generate thingy manually

```
# create signature
openssl smime -sign -signer ./data/certificates/certificate.pem -inkey ./data/certificates/key.pem -certfile ./data/certificates/wwdr.pem -in ./data/output/manifest.json -out ./data/o
utput/signature -outform der -binary

# OR, using a combined pem
openssl smime -sign -signer ./data/certificates/combined.pem -certfile ./data/certificates/wwdr.pem -in ./data/output/manifest.json -out ./data/output/signature -outform der -binary

# create zip
rm ./data/output/.DS_Store; zip -r -j ./data/output.pkpass ./data/output
```

##### verify manually

manual .pkpass verification, once extracted:

```
# hash the manifest:
shasum manifest

# read the signature:
# look for `:messageDigest`, then [HEX DUMP]
openssl asn1parse -in signature -inform der

# the signature:
openssl smime -verify -in signature -content manifest.json -inform der -noverify
```
