# mite-reminder
command line tool to check if times are entered for each day in mite

## Setup

### Install & configure mite-cli

A fork of mite-cli can be installed via:

```
npm i -g phiros/mite-cli
```

The api key for mite & the account need to be configured via:

```
mite config set apiKey <YOUR MITE API KEY HERE>
mite config set account leanovate
```

**NOTE:** Your API key can be retrieved at https://leanovate.mite.yo.lk/myself

### Install mite-reminder
```
npm i -g 'leanovate/mite-reminder#use-mite-reminder-as-subcommand-of-mite-cli'
```
