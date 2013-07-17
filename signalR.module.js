/*
*   AngularJs module simplifying the work with SignalR hub proxies. No need to explicitly start the connection to a hub. 
*   Requires angular.js
*   @example: hubFactory.hub("myHub").run("myMethod", param_1, param_2, .... param_n).then ( function(responseData) {} )
*/
angular.module("dataAccess.SignalRModule", []).factory("hubFactory", ["$q", "$rootScope", function ($q, $rootScope) {
    "use strict";

    // log signalR client-side messages
    $.connection.hub.logging = true;

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

        if (!$.connection.hub) {
            window.setTimeout(
                function () {
                    _safeApply(def.reject, "Hub not available.");
                }, 0);
            return def.promise;
        }

        function _init() {
            return $.connection.hub.start();
        };

        // calls apply on the root scope
        function _safeApply(methodRef, arg) {
            if (!$rootScope.$$phase) {
                $rootScope.$apply(function () {
                    methodRef(arg);
                });
            }
            else {
                methodRef(arg);
            }
        }


        // calls the hub method and resolves the promise
        function _resolveMethodCall() {
            
            try {                
                var response = self.hub.invoke.apply(self.hub, args);
                _safeApply(def.resolve, response);                
            }
            catch (err) {
                _safeApply(def.reject, response);
            }
        }

        switch ($.connection.hub.state) {
            case $.signalR.connectionState.connected:
                _resolveMethodCall();
                break;
            case $.signalR.connectionState.disconnected:
                _init().done(function () {
                    _resolveMethodCall();
                }).fail(function (err) {
                    _safeApply(def.reject, err);                   
                });
                break;
            case $.signalR.connectionState.connecting:
            case $.signalR.connectionState.reconnecting:
            default:
                $.connection.hub.stateChanged(function (state) {
                    if (state.newState === $.signalR.connectionState.connected)
                        _resolveMethodCall();
                });
                break;

        }

        return def.promise;
    }
    // returns an Object containing a method that returns a required SignalR hub
    return {
        getHub: function (hubName) {
            return new Hub(hubName);
        }
    };
}]);
