// ==UserScript==
// @id             remove-google-redirection
// @name           Remove Google Redirection
// @namespace      http://kodango.com
// @description    Prohibit click-tracking, and prevent url redirection when clicks on the result links in Google search page.
// @author         tuantuan <dangoakachan@gmail.com>
// @homepage       http://kodango.com
// @version        1.1.0
// @include        http*://www.google.*/
// @include        http*://www.google.*/#hl=*
// @include        http*://www.google.*/search*
// @include        http*://www.google.*/webhp?hl=*
// @include        https://encrypted.google.com/
// @include        https://encrypted.google.com/#hl=*
// @include        https://encrypted.google.com/search* 
// @include        https://encrypted.google.com/webhp?hl=*
// @include        http://ipv6.google.com/
// @include        http://ipv6.google.com/search*
// @updateURL      https://github.com/dangoakachan/Remove-Google-Redirection/raw/master/extension/firefox/remove-google-redirection.meta.js 
// @icon           https://github.com/dangoakachan/Remove-Google-Redirection/raw/master/extension/firefox/icon.png
// @run-at         document-end
// ==/UserScript==

/*
 * Let the user scripts or content scripts running in an annoymous function,
 * that is more safer.
 */
(function (window) {
    "use strict";

    /*
     * Inject the function into current document and run it
     */
    function injectFunction(func) {
        var ele = document.createElement('script');
      　var s = document.getElementsByTagName('script')[0];

        ele.type = 'text/javascript';
        ele.textContent = '(' + func + ')();';

        s.parentNode.insertBefore(ele, s);
    }

    /*
     * Disable the url rewrite function
     */
    function disableURLRewrite() {
        function inject_init() {
            /* Define the url rewrite function */
            Object.defineProperty(window, 'rwt', {
                value: function() { return true; },
                writable: false, // set the property to read-only
                configurable: false
            });
        }

        injectFunction(inject_init);
    }

    /*
     * Clean the link, no track and no url redirection
     */
    function cleanTheLink(a) {
        if (a.dataset['cleaned'] == 1) // Already cleaned
            return;

        /* Set clean flag */
        var need_clean = false;

        /* Find the original url */
        var result = /\/(?:url|imgres).*[&?](?:url|q|imgurl)=([^&]+)/i.exec(a.href);

        if (result) {
            need_clean = true;
            a.href = result[1]; // Restore url to original one
        }

        /* Remove the onmousedown attribute if found */
        var val = a.getAttribute('onmousedown') || '';

        if (val.indexOf('return rwt(') != -1) {
            need_clean = true;
            a.removeAttribute('onmousedown');
        }

        /* FIXME: check the link class name */
        var cls = a.className || '';

        if (cls.indexOf('irc_') != -1) need_clean = true;

        /*
         * Remove all event listener added to this link
         */ 
        if (need_clean) {
            var clone = a.cloneNode(true);
            a.parentNode.replaceChild(clone, a);
            clone.dataset['cleaned'] = 1;
        }
    }

    /*
     * The main entry
     */
    function main()
    {
        disableURLRewrite();

        document.addEventListener('mouseover', function (event) {
            var a = event.target, depth = 1;

            /* Found the target link, and try to clean it */
            while (a && a.tagName != 'A' && depth-- > 0)
                a = a.parentNode;

            if (a && a.tagName == 'A')
                cleanTheLink(a);
        }, true);
    }

    main();
})(window);
