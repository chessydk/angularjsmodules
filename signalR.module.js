/*
*   AngularJs module simplifying the work with SignalR hub proxies. No need to explicitly start the connection to a hub. 
*   Requires angular.js
*   @example: hubFactory.hub("myHub").run("myMethod", param_1, param_2, .... param_n).then ( function(responseData) {} )
*/
angular.module("SignalRModule", []).factory("hubFactory", ["$q", "$rootScope", function ($q, $rootScope) {
    "use strict";

    // log signalR client-side messages
    //$.connection.hub.logging = true;

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
        var args = [];
        // since the first argument is the parameter "methodName", we ignore it
        for (var i = 1, n = arguments.length; i < n; i++) {
            args.push(arguments[i]);
        }

        var def = $q.defer();

        // calls the hub method and resolves the promise
        function _resolveMethodCall() {
            var methodRef = self.hub.server[methodName];
            try {
                var promiseResponse = methodRef.apply(self.hub, args);
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
                        def.reject(new Error(err));
                    });
                }
                else {
                    def.reject(new Error(err));
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
                        def.reject(new Error(err));
                    });
                }
                else {
                    def.reject(new Error(err));
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
