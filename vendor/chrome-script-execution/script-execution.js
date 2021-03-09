'use strict';

let browser
if (typeof browser === 'undefined') {
  browser = globalThis.chrome // eslint-disable-line no-global-assign
}

(function () {

    function ScriptExecution(tabId) {
        this.tabId = tabId;
    }

    ScriptExecution.prototype.executeScripts = function (fileArray) {
        var executor = this;

        fileArray = Array.prototype.slice.call(arguments); // ES6: Array.from(arguments)
        return Promise.all(fileArray.map(function (file) {
            return exeScript(executor.tabId, file);
        })).then(function (result) {
            return {executor, result};
        }).catch(function (result) {
            //catch invalid URL
        });
    };

    function promiseTo(fn, tabId, info) {
        return new Promise(function (resolve, reject) {
            browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
                if (tabs[0].url.match(/^chrome:\/\//)) {
                    return reject();
                } else {
                    fn.call(browser.tabs, tabId, info, function (result) {
                        if (undefined === chrome.runtime.lastError) {
                            return resolve(result);
                        } else {
                            return reject();
                        }
                    });
                }
            });

        });
    }

    function exeScript(tabId, path) {
        var info = { file: path, runAt: 'document_end' };
        return promiseTo(browser.tabs.executeScript, tabId, info);
    }

    window.ScriptExecution = ScriptExecution;
})();
