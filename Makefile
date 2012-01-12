all: update
	for x in lib/*/Makefile; do \
		make -C `dirname $$x` all; \
	done

update:
	git submodule update --init
