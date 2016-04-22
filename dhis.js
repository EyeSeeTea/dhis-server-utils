(function (jQuery) {
    //TODO: Improve this script loader and bootstrapper
    var dhis2Root;
    var dhis2CoreScripts = [
//        '/dhis-web-commons/javascripts/jQuery/calendars/jquery.calendars.min.js',
//        '/dhis-web-commons/javascripts/jQuery/calendars/jquery.calendars.plus.min.js',
//        '/dhis-web-commons/javascripts/dhis2/dhis2.util.js',
//        '/dhis-web-commons/javascripts/dhis2/dhis2.period.js',
//        '/dhis-web-commons/javascripts/jQuery/ui/jquery-ui.min.js',
        '/dhis-web-commons/javascripts/dhis2/dhis2.translate.js',
        '/dhis-web-commons/javascripts/dhis2/dhis2.menu.js',
        '/dhis-web-commons/javascripts/dhis2/dhis2.menu.ui.js',
        
    ];
    $.ajaxSetup({
        cache: true
    });
    function loadScript(callBack) {
        var script;
        if (dhis2CoreScripts.length > 0) {
            script = dhis2CoreScripts.shift();
            jQuery.getScript(dhis2Root + script, function () {
                loadScript(callBack);
            });
        } else {
            callBack();
        }
    }
    jQuery.get('manifest.webapp').success(function (manifest) {
        var manifest = JSON.parse(manifest);
        dhis2Root = manifest.activities.dhis.href;
        if (!dhis2Root) {
            console.error('Error trying to get the dhis2 url from the manifest');
        }
        window.dhis2 = window.dhis2 || {};
        dhis2.settings = dhis2.settings || {};
        dhis2.settings.baseUrl = dhis2Root.replace(window.location.origin, '').replace(/^\//, ''); //TODO: Perhaps this regex should go into the menu.js
        //Load all the required scripts and then launch the angular app
        loadScript(function (){
            angular.module('dhisServerUtilsConfig').factory('AppManifest', function () {
                return manifest;
            });
        });
        //Load the jquery ui stylesheet for the forms
        jQuery('<link/>', {
            rel: 'stylesheet',
            type: 'text/css',
            //href: dhis2Root + '/dhis-web-commons/javascripts/jQuery/ui/css/redmond/jquery-ui.css'
            href: dhis2Root + '/dhis-web-commons/font-awesome/css/font-awesome.min.css'
        }).appendTo('head');
        jQuery('<link/>', {
            rel: 'stylesheet',
            type: 'text/css',
            href: dhis2Root + '/dhis-web-commons/css/menu.css'
        }).appendTo('head');
    });
})(jQuery);