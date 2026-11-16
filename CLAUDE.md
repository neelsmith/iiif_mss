

## Overview

`iiif_mss` is a repository for single-page webapps using the datasets built by https://github.com/neelsmith/biblissima and published in a single delimited-text file at https://raw.githubusercontent.com/neelsmith/biblissima/refs/heads/main/datareleases/current.cex



## Functionality

https://github.com/neelsmith/biblissima has two marimo notebooks named `browsetexts.py` and `browsecollections.py`. This repo should replicate their functionality in two standalone HTML files, `browsetexts.html` and `browsecollections.html`, that can function either when served from a web server, or when opened from a local file. Instead of loading data from a local file, however, these apps should load data from https://shot.holycross.edu/iiif-mss/current.cex


## Architecture & Directory Structure

- `quarto`, `docs`, `README.md`, `releases.md`, and `version.txt` are all user-readable content owned by me; Claude should not touch them
- `notes` is for documentation and notes that Claude writes, includes session summaries so I can reliably pick up working with Claude from different machines
- `src` is for source code



## Testing Guidelines

- Write unit tests for utility functions and integration/component tests for critical UI flows.
- Run relevant tests before proposing significant refactors.