'use strict';

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
        });
    };

    function promiseTo(fn, tabId, info) {
        return new Promise(function (resolve) {
            fn.call(chrome.tabs, tabId, info, function (result) {
                return resolve(result);
            });
        });
    }

    function exeScript(tabId, path) {
        var info = { file: path, runAt: 'document_end' };
        return promiseTo(chrome.tabs.executeScript, tabId, info);
    }

    window.ScriptExecution = ScriptExecution;
})();