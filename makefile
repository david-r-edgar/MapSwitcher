ODIR=release

UGLIFY=~/uglifyjs2harmony/bin/uglifyjs
UGLIFY_OPTIONS=-c --mangle
CP=cp

VPATH=src
BUILDDIR=$(ODIR)/src

OUT_SRC = \
	$(BUILDDIR)/mapSwitcher.js \
	$(BUILDDIR)/dataExtractor.js \
	$(BUILDDIR)/mapUtil.js \
	$(BUILDDIR)/options.js \
	$(BUILDDIR)/outputMaps.js

TO_COPY = \
	$(ODIR)/manifest.json

DIRS_TO_COPY = \
	$(ODIR)/html \
	$(ODIR)/image \
	$(ODIR)/vendor


$(BUILDDIR):
	mkdir -p $(BUILDDIR)


$(BUILDDIR)/dataExtractor.js: dataExtractor.js
	$(UGLIFY) $< $(UGLIFY_OPTIONS) -o $@

$(BUILDDIR)/mapUtil.js: mapUtil.js
	$(UGLIFY) $< $(UGLIFY_OPTIONS) -o $@

$(BUILDDIR)/options.js: options.js
	$(UGLIFY) $< $(UGLIFY_OPTIONS) -o $@

$(BUILDDIR)/outputMaps.js: outputMaps.js
	$(UGLIFY) $< $(UGLIFY_OPTIONS) -o $@

$(BUILDDIR)/mapSwitcher.js: mapSwitcher.js
	$(UGLIFY) $< $(UGLIFY_OPTIONS) -o $@


$(TO_COPY) : $(ODIR)/% : %
	$(CP) $< $@

$(DIRS_TO_COPY) : $(ODIR)/% : %
	$(CP) -r $< $(ODIR)

extension: $(BUILDDIR) $(OUT_SRC) $(TO_COPY) $(DIRS_TO_COPY)

clean:
	rm -rf $(ODIR)

.PHONY: clean

all: extension
