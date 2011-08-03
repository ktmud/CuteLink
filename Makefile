# this file is copied from jQuery source (https://github.com/jquery/jquery).

SRC_DIR = src-kissy
SRC_DIR_JQ = src-jquery

TEST_DIR = test
BUILD_DIR = build

PREFIX = .
DIST_DIR = ${PREFIX}/dist

JS_ENGINE ?= `which node nodejs`
COMPILER = ${JS_ENGINE} ${BUILD_DIR}/uglify.js --unsafe
POST_COMPILER = ${JS_ENGINE} ${BUILD_DIR}/post-compile.js

MODULES = ${SRC_DIR}/base.js\
					${SRC_DIR}/urltools.js\
					${SRC_DIR}/history.js\
					${SRC_DIR}/register.js

CL = ${DIST_DIR}/cutelink.js
CL_MIN = ${DIST_DIR}/cutelink-min.js

CL_VER = $(shell cat version.txt)
VER = sed "s/@VERSION/${CL_VER}/"

DATE=$(shell git log -1 --pretty=format:%ad)

all: core

core: cutelink min
	@@echo "cutelink build complete."

${DIST_DIR}:
	@@mkdir -p ${DIST_DIR}

cutelink: ${CL}

${CL}: ${MODULES} | ${DIST_DIR}
	@@echo "Building" ${CL}

	@@cat ${MODULES} | \
		sed 's/@DATE/'"${DATE}"'/' | \
		${VER} > ${CL};

min: cutelink ${CL_MIN}

${CL_MIN}: ${CL}
	@@if test ! -z ${JS_ENGINE}; then \
		echo "Minifying Cutelink" ${CL_MIN}; \
		${COMPILER} ${CL} > ${CL_MIN}.tmp; \
		${POST_COMPILER} ${CL_MIN}.tmp > ${CL_MIN}; \
		rm -f ${CL_MIN}.tmp; \
	else \
		echo "You must have NodeJS installed in order to do the minify."; \
	fi

clean:
	@@echo "Removing Distribution directory:" ${DIST_DIR}
	@@rm -rf ${DIST_DIR}

pull:
	@@git pull ${REMOTE} ${BRANCH}

.PHONY: all cutelink min clean pull core
