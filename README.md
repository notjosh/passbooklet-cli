# `passbooklet-cli`

Assists you modify & re-sign `.pkpass` files.

## Set Up

First, you need enough ✨Apple developer✨ access to generate a valid certificate. Do that, export the pair as `.p12`.

Next, make sure you have your `.env` file in place:

```
cp .env.example .env
```

And since we're a `yarn` project, let's initialise via:

```
yarn
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

## Usage

### Dump Editable `.pkpass` Keys

```
yarn ts-node ./bin/passbooklet-cli.ts read /path/to/some.pkpass
```

### Rewrite Keys & Export New `.pkpass`

```
# This would change a field to "2", i.e. to bump up a boarding group
yarn ts-node ./bin/passbooklet-cli.ts modify /path/to/source.pkpass /path/to/destination.pkpass -u boardingPass.auxiliaryFields.3.value=2
```

## TODO

- parse IATA code from `barcode.message`
- `.pkpass` validation
- automate certificate import/`.env` creation
- instead of `.env`, import from keychain at runtime so certs aren't just sitting on disk in the open (or, at least, read from `.p12`)
- publish `npx` friendly executable
- handle `.pkpass` files with `.zip` (sub)folders
