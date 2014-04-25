/*
 * Content Script
 *
 * Description:
 * 
 * This script disable click-tracking and redirection in Google search results,
 * and restore the result url from
 *
 *      "http://www.google.com/url?url=http://example.com"
 * to
 * 
 *      "http://example.com"
 *
 * Now Support both http and https search, instant-on and instant-off search.
 */

/*
 * Let the user scripts or content scripts running in an annoymous function,
 * that is more safer.
 */
(function (window) {
    "use strict";

    /*
     * Override the rwt function
     */
    function overrideRwt() {
        var ele = document.createElement('script');

        ele.type = 'text/javascript';

        /* Inject the function into document */
        function injectFunc() {
            Object.defineProperty(window, 'rwt', {
                value: function() { return true; },
                writable: false,
                configurable: false
            });
        }

        ele.textContent = '(' + injectFunc + ')()';
        document.body.appendChild(ele);
    }

    /*
     * Clean the link and prevent the url to be rewritten
     */
    function cleanTheLink(event) {
        var a = event.target, depth = 1;

        /* Found the target link, and try to clean it */
        while (a && a.tagName != 'A' && depth-- > 0)
            a = a.parentNode;

        if (!a || a.tagName != 'A')
           return;

        if (a.dataset['cleaned'] == 1) // Return if a link has been already cleaned
            return;

        var need_clean = false;

        /* Find the original url */
        var result = /\/(?:url|imgres).*[&?](?:url|q|imgurl)=([^&]+)/i.exec(a.href);

        /* Restores the redirection url */
        if (result) {
            a.href = decodeURIComponent(result[1]);
            need_clean = true;
        }

        var val = a.getAttribute('onmousedown') || '';

        /* Remove the onmousedown attribute */
        if (val.indexOf('return rwt(') != -1) {
            a.removeAttribute('onmousedown');
            need_clean = true;
        }
                        
        var cls = a.className || '';

        if (cls.indexOf('irc_') != -1)
            need_clean = true;

        /* Remove all event listener from the element */
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
        overrideRwt();
        document.addEventListener('mouseover', cleanTheLink, true);
    }

    main();
})(window);
