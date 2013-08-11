/*
 * Content Script Js
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
     * Shorthand functions
     */
    function dec(s) { return window.decodeURIComponent(s); }

    /* 
     * Removes click-tracking and restores redirection URL to original one.
     */
    function cleanLink(link) {
        /* Click-tracking is bind on mousedown event. */
        var track_code = link.getAttribute('onmousedown');
        /* Redirection URL's regular expression */
        var rredirect = /\/url\?(?:url|q)=([^&]*)/i;
        /* Real image URL's regular expression */
        var rrealimg = /imgurl=([^&]*)/i;

        if (track_code && track_code.indexOf('return rwt(') != -1) {
            link.removeAttribute('onmousedown');
        } else if (rredirect.test(link.href)) {
            link.href = dec(link.href.match(rredirect)[1]);
        } else if (rrealimg.test(link.href)) {
            link.href = dec(link.href.match(rrealimg)[1]);
        }
    }

    /*
     * Removes click-tracking and restores redirection in all search results.
     */
    function removeRedirect(event) {
        /* Queries all result links */
        var links = document.querySelectorAll('#res a, #rhs a');
        var len = links.length;

        /* Iterates each link that found in the result and clean it */
        for (var i = 0; i < len; i++) {
            cleanLink(links[i]);
        }
    }

    /*
     * Removes click-tracking and restores redirection in all search results
     * until the Instant Search is complete, that means all results are
     * displayed in the search result page.
     */
    function delayRemoveRedirect(event) {
        /*
         * Web page is loading from top to bottom, so we choose an element 
         * that is located after the result lists and will change in one
         * search. The foot (div#xfoot) element meets both requirements. 
         *
         * DOM Mutation Events can detect whether a dom element is changed.
         */
        if (event.relatedNode.id == 'xfoot') {
            removeRedirect(event);
            event.stopPropagation();
        }
    }

    /* 
     * Listens specified events and handle it 
     */
    function listenEvents() {
        /* 
         * Listens DOMContentLoaded event in normal search, this event will
         * not fire in Instant Search.
         */
        if (location.pathname == '/search') {
            window.addEventListener("DOMContentLoaded", removeRedirect, false);
        }

        /*
         * Listen the specified mutation event in document object, but we
         * use event delegate here. This will save a lot of unnecessary
         * performance overhead.
         */
        document.addEventListener('DOMNodeInserted', delayRemoveRedirect, false);
    }

    listenEvents();
})(window);
