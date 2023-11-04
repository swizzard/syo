#!/usr/bin/bash
set -euo pipefail

function dependency_checks {
	if [ -z "$(which yarn)" ] || [ -z "$(which docker-compose)" ]; then
		echo "Make sure yarn and docker-compose are installed and on your PATH"
		exit 1
	fi
}

function initialize {
	local d
	d="$(pwd)"
	docker-compose up -d --build
	cd seed && yarn && yarn run seed && cd "$d" && exit 0 || exit 1
}

initialize
