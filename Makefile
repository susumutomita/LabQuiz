ENV_FILE ?= .env
ifneq ("$(wildcard $(ENV_FILE))","")
    include $(ENV_FILE)
endif

.PHONY: install build build-server build-frontend deploy generate-clasp clean

install:
	npm install
	cd frontend && npm install

build-server:
	mkdir -p dist
	node esbuild.config.js

build-frontend:
	cd frontend && npm run build
	mkdir -p dist
	cp frontend/dist/index.html dist/index.html

build: install build-server build-frontend
	cp appsscript.json dist/

generate-clasp:
	@test -n "$(SCRIPT_ID)" || (echo "Error: SCRIPT_ID is not set. Define it in .env or environment variable." && exit 1)
	@echo "Generating .clasp.json with SCRIPT_ID = $(SCRIPT_ID)"
	@echo '{"scriptId":"$(SCRIPT_ID)","rootDir":"dist"}' > .clasp.json

deploy: build generate-clasp
	npx clasp push
	npx clasp version "Deploy: $$(date +'%Y%m%d-%H%M%S')"

clean:
	@echo "Cleaning dist/"
	@[ -d dist ] && find dist -mindepth 1 -delete 2>/dev/null || true
