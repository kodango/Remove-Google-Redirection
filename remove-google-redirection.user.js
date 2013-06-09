// ==UserScript==
// @id             remove_google_redirection
// @name           Remove Google Redirection
// @namespace      http://kodango.me
// @description    Remove redirection and click-tracking in Google search results.
// @author         tuantuan <dangoakachan@gmail.com>
// @homepage       http://kodango.me
// @version        0.9.3
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
// @exclude        *tbm=pts*
// @exclude        *tbm=shop*
// @exclude        *tbm=isch*
// @exclude        *tbm=bks*
// @updateURL      https://userscripts.org/scripts/source/98394.meta.js
// @run-at         document-start
// ==/UserScript==

/*
 * DESCRIPTION:
 * 
 * This script disable click-tracking and redirection in Google search results,
 * and restore the result url from
 *      "http://www.google.com/url?url=http://example.com" 
 * to 
 *      "http://example.com"
 *
 * Now Support both http and https search, instant-on and instant-off search.
 *
 * Support Browsers:
 * Mozilla Firefox, Google Chrome
 *
 * Support site or script homepage:
 * http://kodango.com/remove-google-redirection
 */

/*
 * Let the user scripts or content scripts running in an annoymous function,
 * that is more safer.
 */
(function (window) {
    "use strict";

    /* 
     * User config section start
     */

    var config = set_default('dangoGoogleRR', {
        'quiet': false, // Enable debug messages
        'new_tab': true, // Open link in new tab, override google search setting
        'selector': '#res a, #rhs a', // Selector for links to be processed
    });

    /* 
     * User config section end 
     */

    var debug = config.quiet ? function(msg) {} :
        function(msg) { console.log(msg); };

    /*
     * Set default value only if the key doesn't exist
     */
    function set_default(key, def) {
        var val = null;

        if (key in window.localStorage) {
            val = window.localStorage.getItem(key);
        } else {
            val = JSON.stringify(def);
            window.localStorage.setItem(key, val);
        }

        return JSON.parse(val);
    }

    /*
     * Shorthand functions
     */
    //function $(id) { return document.getElementById(id); }
    function dec(s) { return window.decodeURIComponent(s); }

    /* Set the link to be openned in new or current tab */
    function setOpenInNewTab(link) { link.setAttribute('target', '_blank'); }
    function setOpenInCurTab(link) { link.setAttribute('target', '_self'); }

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

        if (config.new_tab) 
            setOpenInNewTab(link);
        else
            setOpenInCurTab(link);

        /*
         * If the link contains click-tracking code, we should remove it. Otherwise,
         * the link that is a redirection or image URL also need to be restored to
         * the original one.
         */
        if (track_code && track_code.indexOf('return rwt(') != -1) {
            link.removeAttribute('onmousedown');
            return 1
        } else if (rredirect.test(link.href)) {
            link.href = dec(link.href.match(rredirect)[1]);
            return 1
        } else if (rrealimg.test(link.href)) {
            link.href = dec(link.href.match(rrealimg)[1]);
            return 1
        }

        return 0;
    }

    /*
     * Removes click-tracking and restores redirection in all search results.
     */
    function removeRedirect(event) {
        /* Queries all result links */
        var links = document.querySelectorAll(config.selector);
        var len = links.length;
        var process_num = 0;

        /* Iterates each link that found in the result and clean it */
        for (var i = 0; i < len; i++) {
            process_num += cleanLink(links[i]);
        }

        debug('removeRedirect processes ' + process_num + ' links, event type is '
                + event.type);
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
         *
         * DOMAttrModified event is more effecient here, but this event is not
         * well supported by every browsers. So, we should handle other event
         * types here.
         */
        switch (event.type) {
            case 'DOMAttrModified':
                if (event.target.id === 'xfoot' && event.newValue == '') {
                    removeRedirect(event);
                    event.stopPropagation();
                }

                break;
            case 'DOMNodeInserted':
                if (event.relatedNode.id == 'xfoot') {
                    //console.dir(event);
                    removeRedirect(event);
                    event.stopPropagation();
                }

                break;
            default:
                break;
        }
    }

    /* Listens specified events and handle it */
    function listenEvents() {
        /* 
         * Listens DOMContentLoaded event in normal search, this event will
         * not fire in Instant Search.
         */
        if (location.pathname == '/search') {
            debug('Not enable instant search?');
            window.addEventListener("DOMContentLoaded", removeRedirect, false);
        }

        /* The name of mutation event that will be listened */
        var mutationEvtName;

        /* 
         * DOMAttrModified event will only fire when you modify one 
         * elements' attribute with the native setAttribute method in
         * Chrome. So we need to select an alternative method here.
         */
        if (window.chrome) {
            debug('Guess you are running on google chrome');
            mutationEvtName = 'DOMNodeInserted';
        } else {
            mutationEvtName = 'DOMAttrModified';
        }

        /*
         * Listen the specified mutation event in document object, but we
         * use event delegate here.This will save a lot of unnecessary
         * performance overhead.
         */
        document.addEventListener(mutationEvtName, delayRemoveRedirect, false);

        /*
         * Listens the click event on image link, try to open images in new tab
         */
        document.addEventListener('click', function(event) {
            var target = event.target;

            if (target.id == 'uh_hpl' || target.id == 'rg_hl') {
                setOpenInNewTab(target);
            }
        }, false);
    }

    listenEvents();
})(window);
