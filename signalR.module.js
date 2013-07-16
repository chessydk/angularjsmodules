/*
*   AngularJs module simplifying the work with SignalR hub proxies. No need to explicitly start the connection to a hub. 
*   Requires angular.js
*   @example: hubFactory.hub("myHub").run("myMethod", param_1, param_2, .... param_n).then ( function(responseData) {} )
*/
angular.module("dataAccess.SignalRModule", []).factory("hubFactory", ["$q", "$rootScope", function ($q, $rootScope) {
    "use strict";

    // log signalR client-side messages
    $.connection.hub.logging = true;

    function init() {
        return $.connection.hub.start();
    };

    /**
    * Hub constructor.
    *
    * @class Hub
    * @constructor
    * @param {String} SignalR hub name
    */
    function Hub(strHubName) {
        if (!strHubName) {
            throw new Error("Hub name not defined!");
        }

        this.hub = $.connection[strHubName];

        if (this.hub === undefined) {
            throw new Error("Hub with name " + strHubName + " doesn't exist.");
        }
    }

    /**
    * Runs a method on the SignalR hub proxy asynchronously.
    *
    * @method run
    * @param {String} proxy method name
    * @return {Promise} Returns promise
    */
    Hub.prototype.run = function (methodName) {
        var self = this;
        var args = arguments;
        var def = $q.defer();

        // calls the hub method and resolves the promise
        function _resolveMethodCall() {
            
            try {
                var promiseResponse = self.hub.invoke.apply(self.hub, args);

                if (!$rootScope.$$phase) {
                    $rootScope.$apply(function () {
                        def.resolve(promiseResponse);
                    });
                }
                else {
                    def.resolve(promiseResponse);
                }
            }
            catch (err) {
                if (!$rootScope.$$phase) {
                    $rootScope.$apply(function () {
                        def.reject(err);
                    });
                }
                else {
                    def.reject(err);
                }
            }

        }

        // if connection to the hub isn't established
        if ($.connection.hub && $.connection.hub.state === $.signalR.connectionState.disconnected) {
            init().done(function () {
                _resolveMethodCall();
            }).fail(function (err) {
                if (!$rootScope.$$phase) {
                    $rootScope.$apply(function () {
                        def.reject(err);
                    });
                }
                else {
                    def.reject(err);
                }
            });
        }
        else {
            _resolveMethodCall();
        }

        return def.promise;
    }
    // returns an Object containing a method that returns a required SignalR hub
    return {
        hub: function (hubName) {
            return new Hub(hubName);
        }
    };
}]);
