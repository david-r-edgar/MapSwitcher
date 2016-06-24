ODIR=release

UGLIFY=~/uglifyjs2harmony/bin/uglifyjs
CP=cp

VPATH=src
BUILDDIR=$(ODIR)/src

OUT_SRC = \
	$(BUILDDIR)/mapswitcher.js \
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
	$(UGLIFY) $< --mangle -o $@

$(BUILDDIR)/mapUtil.js: mapUtil.js
	$(UGLIFY) $< -c --mangle -o $@

$(BUILDDIR)/options.js: options.js
	$(UGLIFY) $< --mangle -o $@

$(BUILDDIR)/outputMaps.js: outputMaps.js
	$(UGLIFY) $< -o $@

$(BUILDDIR)/mapswitcher.js: mapswitcher.js
	$(UGLIFY) $< -c --mangle -o $@


$(TO_COPY) : $(ODIR)/% : %
	$(CP) $< $@

$(DIRS_TO_COPY) : $(ODIR)/% : %
	$(CP) -r $< $(ODIR)

extension: $(BUILDDIR) $(OUT_SRC) $(TO_COPY) $(DIRS_TO_COPY)

clean:
	rm -rf $(ODIR)

.PHONY: clean

all: extension
