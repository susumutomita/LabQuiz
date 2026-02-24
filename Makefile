ENV_FILE ?= .env
ifneq ("$(wildcard $(ENV_FILE))","")
    include $(ENV_FILE)
endif

CLASP := ./node_modules/.bin/clasp

.PHONY: install build build-server build-frontend deploy generate-clasp create clean start

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

create: install build
	@test ! -f .clasp.json || (echo ".clasp.json already exists. Delete it first to recreate." && exit 1)
	$(CLASP) create --type webapp --title "LAB CHECKPOINT" --rootDir dist
	@echo "Created. Add SCRIPT_ID to .env from .clasp.json"

deploy: build generate-clasp
	@if $(CLASP) push 2>/dev/null; then \
		$(CLASP) version "Deploy: $$(date +'%Y%m%d-%H%M%S')"; \
		echo ""; \
		echo "=== Deploy complete ==="; \
	else \
		echo ""; \
		echo "============================================"; \
		echo "  clasp push に失敗しました"; \
		echo "  以下の手順で手動デプロイしてください"; \
		echo "============================================"; \
		echo ""; \
		echo "1. GAS エディタを開く:"; \
		echo "   https://script.google.com/d/$(SCRIPT_ID)/edit"; \
		echo ""; \
		echo "2. ファイルの中身を差し替える:"; \
		echo "   bundle.gs  ← dist/bundle.js の内容をコピペ"; \
		echo "   index.html ← dist/index.html の内容をコピペ"; \
		echo ""; \
		echo "3. デプロイ → デプロイを管理 → 新しいバージョンを作成"; \
		echo "============================================"; \
	fi

start:
	cd frontend && npm run dev

clean:
	@echo "Cleaning dist/"
	@[ -d dist ] && find dist -mindepth 1 -delete 2>/dev/null || true
