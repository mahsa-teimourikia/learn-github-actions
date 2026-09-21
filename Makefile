.PHONY: help test workflows links pages

help:
	@echo "test       Run all local validation"
	@echo "workflows  Validate workflow-native labs"
	@echo "links       Validate local Markdown and quiz links"
	@echo "pages       Build and smoke-test the static Hub plus quiz"

test: workflows links pages
	python3 -m unittest discover -s tests -p 'test_*.py'
	cd quiz && npm test

workflows:
	python3 scripts/validate_learning.py --workflows

links:
	python3 scripts/validate_learning.py --links

pages:
	node scripts/build-pages.mjs
	node --test tests/pages-smoke.test.mjs
