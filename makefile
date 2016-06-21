ODIR=release

MINIFY=~/uglifyjs2harmony/bin/uglifyjs
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
	$(ODIR)/manifest.json \
	$(ODIR)/html \
	$(ODIR)/image \
	$(ODIR)/vendor


$(BUILDDIR):
	mkdir -p $(BUILDDIR)


$(BUILDDIR)/dataExtractor.js: dataExtractor.js
	$(MINIFY) $< --mangle -o $@

$(BUILDDIR)/mapUtil.js: mapUtil.js
	$(MINIFY) $< -c --mangle -o $@

$(BUILDDIR)/options.js: options.js
	$(MINIFY) $< --mangle -o $@

$(BUILDDIR)/outputMaps.js: outputMaps.js
	$(MINIFY) $< -o $@

$(BUILDDIR)/mapswitcher.js: mapswitcher.js
	$(MINIFY) $< -c --mangle -o $@


$(TO_COPY) : $(ODIR)/% : %
	$(CP) -r $< $@

extension: $(BUILDDIR) $(OUT_SRC) $(TO_COPY)

clean:
	rm -rf $(ODIR)

.PHONY: clean

all: extension
