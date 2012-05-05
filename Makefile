#
# Copyright (c) 2012, Joyent, Inc. All rights reserved.
#
# Makefile: top-level Makefile
#
# This Makefile contains only repo-specific logic and uses included makefiles
# to supply common targets (javascriptlint, jsstyle, restdown, etc.), which are
# used by other repos as well.
#

#
# Tools
#
NPM		 = npm

#
# Files
#
JSL_CONF_NODE	 = tools/jsl.node.conf
JSL_CONF_WEB	 = tools/jsl.web.conf
JSL_FILES_NODE  := $(shell find lib -name '*.js')
JSL_FILES_WEB   := $(shell find www/resources/js -name '*.js')
JSSTYLE_FILES	:= $(JSL_FILES_NODE) $(JSL_FILES_WEB)

#
# Repo-specific targets
#
.PHONY: all
all:
	$(NPM) install

include ./Makefile.deps
include ./Makefile.targ
