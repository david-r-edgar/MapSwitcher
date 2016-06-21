ODIR=release

UGLIFY=~/uglifyjs2harmony/bin/uglifyjs
CP=cp

VPATH=src
BUILDDIR=$(ODIR)/src


$(BUILDDIR):
	mkdir -p $(BUILDDIR)


$(BUILDDIR)/dataExtractor.js: src/dataExtractor.js $(BUILDDIR)/mapUtil.js
	$(UGLIFY) $< --mangle -o $@

$(BUILDDIR)/mapUtil.js: src/mapUtil.js
	$(UGLIFY) $< -c --mangle -o $@

$(BUILDDIR)/options.js: src/options.js
	$(UGLIFY) $< --mangle -o $@

$(BUILDDIR)/outputMaps.js: src/outputMaps.js
	$(UGLIFY) $< -o $@

$(BUILDDIR)/mapswitcher.js: src/mapswitcher.js $(BUILDDIR)/mapUtil.js $(BUILDDIR)/options.js $(BUILDDIR)/outputMaps.js $(BUILDDIR)/dataExtractor.js
	$(UGLIFY) $< -c --mangle -o $@



$(ODIR)/manifest.json: manifest.json
	$(CP) $< $@

$(ODIR)/image: image
	$(CP) -r $< $@

$(ODIR)/html: html
	$(CP) -r $< $@

$(ODIR)/vendor: vendor
	$(CP) -r $< $@


extension: $(BUILDDIR) $(BUILDDIR)/mapswitcher.js $(BUILDDIR)/dataExtractor.js $(BUILDDIR)/mapUtil.js $(BUILDDIR)/options.js $(BUILDDIR)/outputMaps.js $(ODIR)/vendor $(ODIR)/manifest.json $(ODIR)/image $(ODIR)/html

clean:
	rm -rf $(ODIR)

.PHONY: clean

all: extension
