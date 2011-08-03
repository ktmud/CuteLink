# this file is copied from jQuery source (https://github.com/jquery/jquery).

SRC_DIR = src-kissy
SRC_DIR_JQ = src-jquery

TEST_DIR = test
BUILD_DIR = build

PREFIX = .
DIST_DIR = ${PREFIX}/dist

JS_ENGINE ?= `which node`
COMPILER = ${JS_ENGINE} ${BUILD_DIR}/uglifyjs --unsafe --ascii

MODULES = ${SRC_DIR}/base.js\
					${SRC_DIR}/urltools.js\
					${SRC_DIR}/history.js\
					${SRC_DIR}/register.js

CL = ${DIST_DIR}/cutelink.js
CL_MIN = ${DIST_DIR}/cutelink-min.js

CL_VER = $(shell cat version.txt)
VER = sed "s/@VERSION/${CL_VER}/"

DATE = $(shell git log -1 --pretty=format:%ad)

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
		echo "Minifying cutelink" ${CL_MIN}; \
		${COMPILER} -o ${CL_MIN} ${CL}; \
	else \
		echo "You must have NodeJS installed in order to minify cutelink."; \
	fi

clean:
	@@echo "Removing Distribution directory:" ${DIST_DIR}
	@@rm -rf ${DIST_DIR}

pull:
	@@git pull ${REMOTE} ${BRANCH}

.PHONY: all cutelink min clean pull core
