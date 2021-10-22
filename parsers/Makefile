jison = $(wildcard *.jison)
dest = $(jison:%.jison=%.js)

all: $(dest)
.PHONY: all

%.js: %.jison
	jison $<

test: all
	node sparul.js tests/sparul.ru
.PHONY: test

todo: all
	node sparul.js tests/sparul-todo.ru
.PHONY: todo

